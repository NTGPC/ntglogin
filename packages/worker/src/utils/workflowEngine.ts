import { openProfileContext } from './browser';
import { BrowserContext, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:3000';

export class WorkflowEngine {
  profileId: number;
  vars: Record<string, any>;
  private context!: BrowserContext;
  private page!: Page;
  screenshots: string[];
  private userDataDir: string;
  private driverChannel: 'chrome' | 'chromium' | 'msedge';

  constructor(profileId: number, vars: Record<string, any> = {}) {
    this.profileId = profileId;
    this.vars = vars;
    this.screenshots = [];
    
    // Determine userDataDir (persistent profile directory)
    const profilesDir = path.join(process.cwd(), 'browser_profiles');
    if (!fs.existsSync(profilesDir)) {
      fs.mkdirSync(profilesDir, { recursive: true });
    }
    this.userDataDir = path.join(profilesDir, `profile_${profileId}`);
    
    // Default channel (will be updated from profile fingerprint if available)
    this.driverChannel = 'chrome';
  }

  async init() {
    console.log(`🔄 [WorkflowEngine] Initializing for profile ${this.profileId}, userDataDir: ${this.userDataDir}`);
    
    // Fetch profile to get fingerprint/driver info
    try {
      const profileResponse = await axios.get(`${BACKEND_URL}/api/profiles/${this.profileId}`);
      const profile = profileResponse.data.data || profileResponse.data;
      
      console.log(`✅ [WorkflowEngine] Fetched profile ${this.profileId}`);
      
      if (profile?.fingerprint) {
        const fp = typeof profile.fingerprint === 'string' 
          ? JSON.parse(profile.fingerprint) 
          : profile.fingerprint;
        
        if (fp.driver === 'msedge') {
          this.driverChannel = 'msedge';
        } else if (fp.driver === 'chromium') {
          this.driverChannel = 'chromium';
        }
        console.log(`✅ [WorkflowEngine] Using channel: ${this.driverChannel}`);
      }
    } catch (err) {
      console.warn(`⚠️ [WorkflowEngine] Failed to fetch profile ${this.profileId}, using default channel:`, err);
    }

    // Open profile context with persistent userDataDir
    console.log(`🔄 [WorkflowEngine] Opening browser context...`);
    const { ctx, page } = await openProfileContext(this.userDataDir, this.driverChannel);
    this.context = ctx;
    this.page = page; // <- page bạn sẽ điều khiển
    this.screenshots = [];
    console.log(`✅ [WorkflowEngine] Browser context opened, page ready`);
  }

  async run(workflowJson: any): Promise<{ status: 'success' | 'error'; message?: string; screenshots: string[] }> {
    console.log(`🔄 [WorkflowEngine] Starting workflow execution, nodes: ${workflowJson.nodes?.length || 0}, edges: ${workflowJson.edges?.length || 0}`);
    
    try {
      this.vars = workflowJson.vars || this.vars || {};
      const nodes = workflowJson.nodes || [];
      const edges = workflowJson.edges || [];

      console.log(`📋 [WorkflowEngine] Workflow vars:`, this.vars);
      console.log(`📋 [WorkflowEngine] Nodes:`, nodes.map((n: any) => `${n.id}(${n.type})`).join(', '));

      // Order nodes by edges if edges exist
      const orderedNodes = edges.length > 0 ? this.orderByEdges(nodes, edges) : nodes;
      console.log(`📋 [WorkflowEngine] Ordered nodes:`, orderedNodes.map((n: any) => `${n.id}(${n.type})`).join(', '));
      
      console.log(`▶️ [WorkflowEngine] Executing ${orderedNodes.length} nodes...`);
      await this.execNodes(orderedNodes);
      console.log(`✅ [WorkflowEngine] All nodes executed successfully`);

      return {
        status: 'success',
        screenshots: this.screenshots,
      };
    } catch (error: any) {
      console.error(`❌ [WorkflowEngine] Error during execution:`, error?.message || error);
      console.error(`❌ [WorkflowEngine] Error stack:`, error?.stack);
      return {
        status: 'error',
        message: error?.message || String(error),
        screenshots: this.screenshots,
      };
    }
  }

  // Order nodes by edges: Edge { from: string, to: string }
  orderByEdges(nodes: any[], edges: any[]): any[] {
    const map = new Map(nodes.map(n => [n.id, n]));
    const next = new Map<string, string[]>();
    
    // Handle both { from, to } and { source, target } edge formats
    edges.forEach(e => {
      const from = e.from || e.source;
      const to = e.to || e.target;
      if (from && to) {
        next.set(from, [...(next.get(from) || []), to]);
      }
    });

    const start = nodes.find(n => n.type === 'start');
    const ordered: any[] = [];
    const visit = (id: string) => {
      const n = map.get(id);
      if (!n) return;
      ordered.push(n);
      (next.get(id) || []).forEach(visit);
    };

    if (start) visit(start.id);
    return ordered.length ? ordered : nodes;
  }

  async execNodes(nodes: any[]) {
    for (const node of nodes) {
      await this.execNode(node);
    }
  }

  async execNode(node: any) {
    console.log(`▶️ [WorkflowEngine] Executing node ${node.id} (${node.type})`);
    
    switch (node.type) {
      case 'openPage': {
        const url = String(node.data?.url || 'about:blank');
        console.log(`🌐 [WorkflowEngine] Opening page: ${url}`);
        await this.page.bringToFront();
        await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        console.log(`✅ [WorkflowEngine] Page loaded: ${url}`);
        break;
      }

      case 'typeText': {
        if (!node.data?.selector) {
          throw new Error(`typeText node missing selector`);
        }
        const text = node.data.var ? String(this.vars[node.data.var] ?? '') : String(node.data.text ?? '');
        console.log(`⌨️ [WorkflowEngine] Typing text into ${node.data.selector}: ${text.substring(0, 20)}${text.length > 20 ? '...' : ''}`);
        await this.page.fill(node.data.selector, text, { timeout: node.data?.timeoutMs ?? 15000 });
        console.log(`✅ [WorkflowEngine] Text typed successfully`);
        break;
      }

      case 'click': {
        if (!node.data?.selector) {
          throw new Error(`click node missing selector`);
        }
        console.log(`🖱️ [WorkflowEngine] Clicking on ${node.data.selector}`);
        await this.page.click(node.data.selector, { timeout: node.data?.timeoutMs ?? 15000 });
        console.log(`✅ [WorkflowEngine] Clicked successfully`);
        break;
      }

      case 'waitSelector': {
        if (!node.data?.selector) {
          throw new Error(`waitSelector node missing selector`);
        }
        console.log(`⏳ [WorkflowEngine] Waiting for selector: ${node.data.selector}`);
        await this.page.waitForSelector(node.data.selector, { timeout: node.data?.timeoutMs ?? 15000 });
        console.log(`✅ [WorkflowEngine] Selector found`);
        break;
      }

      case 'wait': {
        await this.page.waitForTimeout(node.data?.ms ?? 1000);
        break;
      }

      case 'waitNavigation': {
        await this.page.waitForLoadState('networkidle', { timeout: node.data?.timeoutMs ?? 30000 });
        break;
      }

      case 'screenshot': {
        const file = await this._saveShot(node.data?.label);
        this.screenshots.push(file);
        break;
      }

      case 'ifSelector': {
        if (!node.data?.selector) {
          throw new Error(`ifSelector node missing selector`);
        }
        const handle = await this.page.$(node.data.selector);
        if (handle) {
          await this.execNodes(node.data.onTrue || []);
        } else {
          await this.execNodes(node.data.onFalse || []);
        }
        break;
      }

      case 'start':
      case 'end':
      case 'merge':
        // Control flow nodes - no action needed
        break;

      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  async _saveShot(label?: string): Promise<string> {
    const screenshotsDir = path.join(process.cwd(), 'screenshots', String(this.profileId));
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const filename = label
      ? `${timestamp}_${label.replace(/[^a-zA-Z0-9]/g, '_')}.png`
      : `${timestamp}.png`;
    const filepath = path.join(screenshotsDir, filename);

    await this.page.screenshot({ path: filepath, fullPage: true });

    return filepath;
  }

  async teardown() {
    try {
      if (this.page) {
        await this.page.close();
      }
      if (this.context) {
        // Close persistent context (this also closes the browser)
        await this.context.close();
      }
    } catch (error) {
      console.error('Error during teardown:', error);
    }
  }
}
