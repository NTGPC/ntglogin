import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Panel,
  ReactFlowProvider,
  ConnectionMode,
  applyNodeChanges,
  applyEdgeChanges,
  OnNodesChange,
  OnEdgesChange,
  addEdge,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { workflowsApi } from '@/lib/workflows'
import { useWorkflowStore, WorkflowNode } from '@/store/workflowStore'
import {
  Save, Settings, Trash2, ArrowLeft, Search,
  Globe, MousePointer, Type, Camera, XCircle, Clock,
  GripVertical, Play, Download, CheckCircle, AlertCircle, GitMerge
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { StartNode, EndNode, MergeNode, OpenPageNode, ClosePageNode, ClickNode, WaitSelectorNode, TypeTextNode, ScreenshotNode } from '@/components/workflow/nodes'
import { RightInspector } from '@/components/workflow/RightInspector'
import { validateWorkflow, ValidationIssue } from '@/lib/workflowValidation'

const nodeTypes = {
  start: StartNode,
  end: EndNode,
  merge: MergeNode,
  openPage: OpenPageNode,
  closePage: ClosePageNode,
  click: ClickNode,
  waitSelector: WaitSelectorNode,
  typeText: TypeTextNode,
  screenshot: ScreenshotNode,
}

const NODE_CATEGORIES = [
  { id: 'control', label: 'Control', icon: Play, color: 'bg-gray-100 text-gray-700 border-gray-300' },
  { id: 'navigation', label: 'Navigation', icon: Globe, color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { id: 'interaction', label: 'Interaction', icon: MousePointer, color: 'bg-green-100 text-green-700 border-green-300' },
  { id: 'data', label: 'Data', icon: Type, color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { id: 'output', label: 'Output', icon: Camera, color: 'bg-orange-100 text-orange-700 border-orange-300' },
]

const ACTION_TYPES = [
  { category: 'control', id: 'start', label: 'Start', description: 'Workflow start', icon: Play, nodeType: 'start', defaultConfig: {} },
  { category: 'control', id: 'end', label: 'End', description: 'Workflow end', icon: XCircle, nodeType: 'end', defaultConfig: {} },
  { category: 'control', id: 'merge', label: 'Merge', description: 'Wait for all inputs', icon: GitMerge, nodeType: 'merge', defaultConfig: {} },
  { category: 'navigation', id: 'openPage', label: 'Open Page', description: 'Navigate to URL', icon: Globe, nodeType: 'openPage', defaultConfig: { url: 'https://example.com' } },
  { category: 'navigation', id: 'closePage', label: 'Close Page', description: 'Close current page', icon: XCircle, nodeType: 'closePage', defaultConfig: {} },
  { category: 'interaction', id: 'click', label: 'Click', description: 'Click on selector', icon: MousePointer, nodeType: 'click', defaultConfig: { selector: 'button' } },
  { category: 'interaction', id: 'waitSelector', label: 'Wait Selector', description: 'Wait for element', icon: Clock, nodeType: 'waitSelector', defaultConfig: { selector: 'body', timeout: 5000 } },
  { category: 'data', id: 'typeText', label: 'Type Text', description: 'Fill input field', icon: Type, nodeType: 'typeText', defaultConfig: { selector: 'input', text: '' } },
  { category: 'output', id: 'screenshot', label: 'Screenshot', description: 'Capture page', icon: Camera, nodeType: 'screenshot', defaultConfig: {} },
]

export default function WorkflowEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'
  const [name, setName] = useState('Untitled Workflow')
  const [loading, setLoading] = useState(false)
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([])
  const { nodes, edges, setNodes, setEdges, addNode, updateNode, setSelectedNode, selectedNode } = useWorkflowStore()

  // React Flow change handlers
  const onNodesChangeHandler: OnNodesChange = useCallback(
    (changes) => setNodes(applyNodeChanges(changes, nodes)),
    [nodes, setNodes]
  )

  const onEdgesChangeHandler: OnEdgesChange = useCallback(
    (changes) => setEdges(applyEdgeChanges(changes, edges)),
    [edges, setEdges]
  )

  const onConnectHandler = useCallback(
    (params: any) => {
      // Validate connection
      const sourceNode = nodes.find((n) => n.id === params.source)
      const targetNode = nodes.find((n) => n.id === params.target)

      if (!sourceNode || !targetNode) return
      if (sourceNode === targetNode) return // No self-connections

      // Start can only have outputs
      if (sourceNode.type === 'start' && params.sourceHandle === 'target') return
      if (targetNode.type === 'start') return

      // End can only have inputs
      if (sourceNode.type === 'end') return
      if (targetNode.type === 'end' && params.targetHandle === 'source') return

      // Add edge
      const newEdge = addEdge(params, edges)
      setEdges(newEdge)
    },
    [nodes, edges, setEdges]
  )

  const handleSave = useCallback(async () => {
    try {
      setLoading(true)
      const payload = { name, data: { nodes, edges, version: 1 } }
      if (isNew) {
        const w = await workflowsApi.create(payload)
        navigate(`/workflows/${w.id}`)
      } else if (id) {
        await workflowsApi.update(Number(id), payload)
        alert('Saved!')
      }
    } catch (err: any) {
      console.error('Failed to save workflow:', err)
      let errorMessage = 'Failed to save workflow'

      if (err.message) {
        errorMessage = err.message
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail
      } else if (typeof err === 'string') {
        errorMessage = err
      }

      // Special handling for network errors
      if (err.code === 'ECONNREFUSED' || err.message?.includes('Network Error') || err.message?.includes('Cannot connect')) {
        errorMessage = `Cannot connect to backend server.\n\nPlease make sure:\n1. Backend server is running on http://127.0.0.1:3000\n2. Python backend: uvicorn api.main:app --reload --port 3000\n3. Or Node.js backend: npm run dev (in src/ directory)`
      }

      // Special handling for 403 Forbidden (authentication issue)
      if (err.response?.status === 403) {
        errorMessage = `Authentication failed (403 Forbidden).\n\nPlease check:\n1. Open browser console (F12) to see auto-login status\n2. Backend log in terminal to see if login endpoint works\n3. Database may need user 'admin' - check backend logs\n4. Try refreshing the page to trigger auto-login again`
      }

      // Special handling for 500 Internal Server Error
      if (err.response?.status === 500) {
        errorMessage = `Backend server error (500).\n\nPlease check:\n1. Backend log in terminal for detailed error\n2. Database connection may be broken\n3. Tables may not exist - check if migrations ran\n4. Check backend terminal for Python traceback`
      }

      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [name, nodes, edges, isNew, id, navigate])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedNode) {
        setNodes(nodes.filter((n) => n.id !== selectedNode.id))
        setEdges(edges.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id))
        setSelectedNode(null)
      }

      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNode, nodes, edges, setNodes, setEdges, setSelectedNode, handleSave])

  useEffect(() => {
    if (!isNew && id) {
      loadWorkflow(Number(id))
    }
  }, [id, isNew])

  useEffect(() => {
    if (isNew) {
      setNodes([])
      setEdges([])
    }
  }, [id, isNew, setNodes, setEdges])

  useEffect(() => {
    // Run validation when nodes/edges change
    const issues = validateWorkflow(nodes as any, edges)
    setValidationIssues(issues)
  }, [nodes, edges])

  async function loadWorkflow(workflowId: number) {
    try {
      setLoading(true)
      const w = await workflowsApi.get(workflowId)
      setName(w.name)
      if (w.data?.nodes) setNodes(w.data.nodes)
      if (w.data?.edges) setEdges(w.data.edges)
    } finally {
      setLoading(false)
    }
  }

  const handleOnDragStart = (event: React.DragEvent, nodeType: typeof ACTION_TYPES[0]) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeType))
    event.dataTransfer.effectAllowed = 'move'
  }

  const handleOnDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const nodeData = JSON.parse(event.dataTransfer.getData('application/reactflow'))
    const reactFlowBounds = (event.target as Element).closest('.react-flow')?.getBoundingClientRect()

    if (reactFlowBounds) {
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      }

      const newNode: WorkflowNode = {
        id: `node-${Date.now()}`,
        type: nodeData.nodeType,
        position,
        data: {
          label: nodeData.label,
          action: nodeData.id,
          config: nodeData.defaultConfig,
        },
      }
      addNode(newNode)
    }
  }, [addNode])

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  const handleValidate = () => {
    const issues = validateWorkflow(nodes as any, edges)
    setValidationIssues(issues)

    if (issues.length === 0) {
      alert('✓ Workflow is valid!')
    } else {
      const errors = issues.filter((i) => i.type === 'error').length
      const warnings = issues.filter((i) => i.type === 'warning').length
      alert(`Found ${errors} errors and ${warnings} warnings`)
    }
  }

  const handleTest = async () => {
    if (isNew || !id) {
      alert('Please save the workflow first before testing')
      return
    }

    try {
      // Save current state first
      await handleSave()

      // Call test API
      const result = await workflowsApi.test(Number(id))

      if (result.success) {
        alert(`✓ Test passed!\n\n${result.message}\n\nStats:\n- Nodes: ${result.stats.nodes}\n- Edges: ${result.stats.edges}\n- Start nodes: ${result.stats.startNodes}\n- End nodes: ${result.stats.endNodes}`)
      } else {
        const issuesText = result.issues.length > 0
          ? `\n\nIssues:\n${result.issues.map((i: string) => `- ${i}`).join('\n')}`
          : ''
        alert(`⚠ Test found issues:\n\n${result.message}${issuesText}`)
      }
    } catch (error: any) {
      alert(`Test failed: ${error?.message || 'Unknown error'}`)
    }
  }

  const handleOpenConfig = (node: WorkflowNode) => {
    setSelectedNode(node)
    setConfigModalOpen(true)
  }

  const handleUpdateConfig = () => {
    setConfigModalOpen(false)
    setSelectedNode(null)
  }

  const handleCancelConfig = () => {
    setConfigModalOpen(false)
    setSelectedNode(null)
  }

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes(nodes.filter((n) => n.id !== nodeId))
    setEdges(edges.filter((e) => e.source !== nodeId && e.target !== nodeId))
  }, [nodes, edges, setNodes, setEdges])

  const filteredActions = ACTION_TYPES.filter((action) => {
    const matchesSearch = action.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || action.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading && !isNew) return <div className="flex items-center justify-center h-96">Loading...</div>

  const errors = validationIssues.filter((i) => i.type === 'error')
  const warnings = validationIssues.filter((i) => i.type === 'warning')

  return (
    <ReactFlowProvider>
      <div className="fixed left-64 top-16 right-0 bottom-0 flex flex-col">
        {/* Header */}
        <div className="border-b bg-background px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/workflows')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xl font-semibold bg-transparent border-0 border-b-2 border-transparent hover:border-primary focus:border-primary focus:outline-none px-2"
            />
            <Badge variant="outline">{nodes.length} nodes</Badge>
            {errors.length > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.length} errors
              </Badge>
            )}
            {warnings.length > 0 && errors.length === 0 && (
              <Badge variant="outline" className="gap-1">
                <AlertCircle className="w-3 h-3" /> {warnings.length} warnings
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleValidate}>
              <CheckCircle className="mr-2 h-4 w-4" /> Validate
            </Button>
            <Button variant="outline" size="sm" onClick={handleTest} disabled={isNew || loading}>
              <Play className="mr-2 h-4 w-4" /> Test
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar - Node Library */}
          <div className="w-72 border-r bg-card overflow-hidden flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center gap-2 mb-3">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold">Node Library</h3>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search nodes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="border-b px-4 py-2 flex gap-1 overflow-x-auto">
              {NODE_CATEGORIES.map((cat) => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs whitespace-nowrap ${selectedCategory === cat.id ? cat.color : 'hover:bg-accent'
                      }`}
                  >
                    <Icon className="w-3 h-3" />
                    {cat.label}
                  </button>
                )
              })}
            </div>

            {/* Node list */}
            <div className="flex-1 overflow-y-auto p-2">
              <div className="grid grid-cols-1 gap-1">
                {filteredActions.map((action) => {
                  const Icon = action.icon
                  return (
                    <div
                      key={action.id}
                      draggable
                      onDragStart={(e) => handleOnDragStart(e, action)}
                      className="flex items-center gap-2 p-3 rounded-lg border border-border bg-background hover:bg-accent cursor-grab active:cursor-grabbing transition-colors"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-foreground">{action.label}</div>
                        <div className="text-xs text-muted-foreground truncate">{action.description}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChangeHandler}
              onEdgesChange={onEdgesChangeHandler}
              onConnect={onConnectHandler}
              onDrop={handleOnDrop}
              onDragOver={handleDragOver}
              nodeTypes={nodeTypes}
              onNodeClick={(_, node) => setSelectedNode(node as WorkflowNode)}
              onPaneClick={() => setSelectedNode(null)}
              connectionMode={ConnectionMode.Loose}
              fitView
              snapToGrid
              snapGrid={[20, 20]}
              deleteKeyCode="Delete"
            >
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
              <Controls />
              <MiniMap />

              <Panel position="top-right" className="bg-background/90 backdrop-blur-sm border rounded-lg shadow p-2">
                <div className="text-xs text-muted-foreground">
                  {nodes.length} nodes · {edges.length} connections
                </div>
              </Panel>

              {/* Validation issues panel */}
              {(errors.length > 0 || warnings.length > 0) && (
                <Panel position="bottom-right" className="bg-background/90 backdrop-blur-sm border rounded-lg shadow max-w-md">
                  <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                    <div className="text-xs font-semibold mb-2">Validation Issues</div>
                    {errors.map((issue, idx) => (
                      <Alert key={idx} variant="destructive" className="py-2">
                        <AlertCircle className="h-3 w-3" />
                        <AlertDescription className="text-xs">{issue.message}</AlertDescription>
                      </Alert>
                    ))}
                    {warnings.map((issue, idx) => (
                      <Alert key={idx} variant="outline" className="py-2">
                        <AlertCircle className="h-3 w-3" />
                        <AlertDescription className="text-xs">{issue.message}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </Panel>
              )}
            </ReactFlow>

            {/* Node context menu */}
            {selectedNode && !configModalOpen && (
              <div className="absolute top-4 left-4 bg-background border rounded-lg shadow-lg p-1 space-y-0.5">
                <button
                  onClick={() => handleOpenConfig(selectedNode)}
                  className="w-full px-3 py-2 text-left hover:bg-accent rounded flex items-center gap-2 text-sm"
                >
                  <Settings className="w-4 h-4" /> Configure
                </button>
                <button
                  onClick={() => handleDeleteNode(selectedNode.id)}
                  className="w-full px-3 py-2 text-left hover:bg-destructive/10 rounded text-destructive flex items-center gap-2 text-sm"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>

          {/* Right Inspector */}
          <RightInspector selectedNode={selectedNode} onUpdate={updateNode} />
        </div>

        {/* Config modal */}
        {configModalOpen && selectedNode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg shadow-lg w-[500px] p-6 border">
              <h3 className="text-lg font-semibold mb-4">Configure: {selectedNode.data.label}</h3>
              <div className="space-y-4">
                {Object.entries(selectedNode.data.config || {}).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium mb-1">{key}</label>
                    <input
                      type="text"
                      value={String(value)}
                      onChange={(e) => updateNode(selectedNode.id, { config: { ...selectedNode.data.config, [key]: e.target.value } })}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={handleCancelConfig}>Cancel</Button>
                <Button onClick={handleUpdateConfig}>Save</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ReactFlowProvider>
  )
}