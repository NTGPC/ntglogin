import { Page } from "playwright-core";
import axios from "axios";

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:3000';

// đơn giản hoá: mỗi node có { type, params }
type Step =
  | { type: "start" }
  | { type: "end" }
  | { type: "open", url: string }
  | { type: "click", selector: string, timeout?: number }
  | { type: "type", selector: string, value: string, delay?: number }
  | { type: "waitSelector", selector: string, state?: "visible" | "attached" | "hidden" | "detached", timeout?: number }
  | { type: "screenshot", path?: string };

function tpl(input: string, vars: Record<string, any>) {
  return input.replace(/\{\{\s*vars\.([a-zA-Z0-9_]+)\s*\}\}/g, (_, k) => vars[k] ?? "");
}

export async function runWorkflowSteps(workflowId: number, page: Page, vars: Record<string, any>) {
  console.log(`🔄 [WorkflowRunner] Fetching workflow ${workflowId} from backend...`);
  
  // Lấy workflow từ backend (workflow.data là JSON với nodes và edges)
  const workflowResponse = await axios.get(`${BACKEND_URL}/api/workflows/${workflowId}`);
  const wf = workflowResponse.data.data || workflowResponse.data;

  if (!wf) throw new Error("Workflow not found");
  if (!wf.data) throw new Error("Workflow has no data");

  const workflowData = wf.data;
  const nodes = workflowData.nodes || [];
  const edges = workflowData.edges || [];

  console.log(`📋 [WorkflowRunner] Workflow has ${nodes.length} nodes, ${edges.length} edges`);

  // Convert workflow nodes to Steps
  // Nếu có edges, order nodes theo edges; nếu không, dùng thứ tự trong array
  let orderedNodes = nodes;
  if (edges.length > 0) {
    // Simple ordering: find start node, then follow edges
    const nodeMap = new Map(nodes.map((n: any) => [n.id, n]));
    const nextMap = new Map<string, string[]>();
    edges.forEach((e: any) => {
      const from = e.from || e.source;
      const to = e.to || e.target;
      if (from && to) {
        nextMap.set(from, [...(nextMap.get(from) || []), to]);
      }
    });

    const startNode = nodes.find((n: any) => n.type === 'start');
    if (startNode) {
      orderedNodes = [];
      const visited = new Set<string>();
      const visit = (id: string) => {
        if (visited.has(id)) return;
        visited.add(id);
        const node = nodeMap.get(id);
        if (node) orderedNodes.push(node);
        (nextMap.get(id) || []).forEach(visit);
      };
      visit(startNode.id);
    }
  }

  // Convert nodes to steps
  const steps: Step[] = orderedNodes.map((n: any) => {
    const nodeType = n.type || n.action;
    const config = n.data?.config || n.config || {};

    switch (nodeType) {
      case "start":
        return { type: "start" };
      case "end":
        return { type: "end" };
      case "openPage":
        return { type: "open", url: String(config.url || "") };
      case "click":
        return { 
          type: "click", 
          selector: String(config.selector || ""), 
          timeout: Number(config.timeoutMs || config.timeout || 10000) 
        };
      case "typeText":
        return { 
          type: "type", 
          selector: String(config.selector || ""), 
          value: String(config.text || config.value || ""),
          delay: Number(config.delay || 0),
        };
      case "waitSelector":
        return { 
          type: "waitSelector", 
          selector: String(config.selector || ""), 
          state: (config.state as any) || "visible", 
          timeout: Number(config.timeoutMs || config.timeout || 10000) 
        };
      case "screenshot":
        return { 
          type: "screenshot", 
          path: String(config.path || config.label ? `screenshot_${config.label}_${Date.now()}.png` : `screenshot_${Date.now()}.png`)
        };
      default:
        console.warn(`⚠️ [WorkflowRunner] Unknown node type: ${nodeType}, skipping`);
        return { type: "start" };
    }
  });

  console.log(`▶️ [WorkflowRunner] Executing ${steps.length} steps...`);

  // Execute steps
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    console.log(`▶️ [WorkflowRunner] Step ${i + 1}/${steps.length}: ${s.type}`);

    try {
      switch (s.type) {
        case "open":
          const url = tpl(s.url, vars);
          console.log(`🌐 [WorkflowRunner] Opening: ${url}`);
          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
          console.log(`✅ [WorkflowRunner] Page loaded`);
          break;

        case "click":
          console.log(`🖱️ [WorkflowRunner] Clicking: ${s.selector}`);
          await page.waitForSelector(s.selector, { timeout: s.timeout ?? 10000 });
          await page.click(s.selector, { timeout: s.timeout ?? 10000 });
          console.log(`✅ [WorkflowRunner] Clicked`);
          break;

        case "type":
          const value = tpl(s.value, vars);
          console.log(`⌨️ [WorkflowRunner] Typing into ${s.selector}: ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
          await page.fill(s.selector, value, { timeout: 10000 });
          if (s.delay) {
            await page.waitForTimeout(s.delay);
          }
          console.log(`✅ [WorkflowRunner] Typed`);
          break;

        case "waitSelector":
          console.log(`⏳ [WorkflowRunner] Waiting for selector: ${s.selector} (state: ${s.state})`);
          await page.waitForSelector(s.selector, { state: s.state ?? "visible", timeout: s.timeout ?? 10000 });
          console.log(`✅ [WorkflowRunner] Selector found`);
          break;

        case "screenshot":
          const screenshotPath = s.path || `screenshot_${Date.now()}.png`;
          console.log(`📸 [WorkflowRunner] Taking screenshot: ${screenshotPath}`);
          await page.screenshot({ path: screenshotPath, fullPage: true });
          console.log(`✅ [WorkflowRunner] Screenshot saved`);
          break;

        default:
          // start/end: bỏ qua
          console.log(`⏭️ [WorkflowRunner] Skipping ${s.type} step`);
          break;
      }
    } catch (stepError: any) {
      console.error(`❌ [WorkflowRunner] Step ${i + 1} failed:`, stepError?.message);
      throw new Error(`Step ${i + 1} (${s.type}) failed: ${stepError?.message || stepError}`);
    }
  }

  console.log(`✅ [WorkflowRunner] All steps completed successfully`);
}

