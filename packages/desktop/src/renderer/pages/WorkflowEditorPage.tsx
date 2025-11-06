import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactFlow, { Background, Controls, MiniMap, BackgroundVariant, addEdge, applyEdgeChanges, applyNodeChanges, ConnectionMode } from 'reactflow'
import 'reactflow/dist/style.css'
import { workflowsApi } from '@/renderer/api/workflows'
import { NodeLibrarySidebar } from '@/renderer/components/workflow/NodeLibrarySidebar'
import { nodeTypes } from '@/renderer/components/workflow/nodeTypes'
import { RightInspector } from '@/renderer/components/workflow/RightInspector'
import dagre from 'dagre'
import { LuCheckCircle, LuDownload, LuPlay, LuSave, LuLayout, LuAlertCircle, LuArrowLeft } from 'react-icons/lu'

type RFNode = any
type RFEdge = any

export default function WorkflowEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'
  const [name, setName] = useState('Untitled Workflow')
  const [loading, setLoading] = useState(false)
  const [nodes, setNodes] = useState<RFNode[]>([])
  const [edges, setEdges] = useState<RFEdge[]>([])
  const [selectedNode, setSelectedNode] = useState<RFNode | null>(null)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isNew && id) loadWorkflow(Number(id))
  }, [id, isNew])

  async function loadWorkflow(workflowId: number) {
    try {
      setLoading(true)
      const w = await workflowsApi.get(workflowId)
      setName(w.name)
      setNodes((w.data?.nodes as any) || [])
      setEdges((w.data?.edges as any) || [])
    } finally {
      setLoading(false)
    }
  }

  const onNodesChange = (changes: any) => setNodes((nds) => applyNodeChanges(changes, nds))
  const onEdgesChange = (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds))
  const onConnect = (params: any) => setEdges((eds) => addEdge(params, eds))

  // DnD
  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }
  const onDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const raw = event.dataTransfer.getData('application/reactflow')
    if (!raw) return
    const { type, initialData } = JSON.parse(raw)
    const bounds = wrapperRef.current?.getBoundingClientRect()
    const position = bounds ? { x: event.clientX - bounds.left, y: event.clientY - bounds.top } : { x: 100, y: 100 }
    const newNode = {
      id: `node-${Date.now()}`,
      type,
      position,
      data: initialData || {},
    }
    setNodes((nds) => nds.concat(newNode))
  }

  // Inspector update
  const updateNodeData = (nodeId: string, data: any) => {
    setNodes((nds) => nds.map((n) => (n.id === nodeId ? { ...n, data } : n)))
  }

  // Toolbar actions
  function validate() {
    const typeCount = nodes.reduce<Record<string, number>>((acc, n) => { acc[n.type] = (acc[n.type] || 0) + 1; return acc }, {})
    const startCount = typeCount['start'] || 0
    const warnings: string[] = []
    if (startCount !== 1) warnings.push('Workflow must contain exactly 1 Start node')
    if (!typeCount['end']) warnings.push('Workflow has no End node')

    // Build graph
    const indeg: Record<string, number> = {}
    nodes.forEach((n) => indeg[n.id] = 0)
    edges.forEach((e) => { indeg[e.target] = (indeg[e.target] || 0) + 1 })
    nodes.forEach((n) => { if (n.type !== 'start' && (indeg[n.id] || 0) === 0) warnings.push(`Node ${n.id} has no incoming edge`) })

    // Cycle detection (Kahn)
    const adj: Record<string, string[]> = {}
    nodes.forEach((n) => { adj[n.id] = [] })
    edges.forEach((e) => adj[e.source].push(e.target))
    const q = Object.keys(indeg).filter((k) => indeg[k] === 0)
    let visited = 0
    const indegCopy = { ...indeg }
    while (q.length) {
      const u = q.shift() as string
      visited++
      for (const v of adj[u]) {
        indegCopy[v]--
        if (indegCopy[v] === 0) q.push(v)
      }
    }
    if (visited !== nodes.length && nodes.length > 0) warnings.push('Cycle detected in graph')
    return warnings
  }

  function autoLayout() {
    const g = new dagre.graphlib.Graph()
    g.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 60 })
    g.setDefaultEdgeLabel(() => ({}))
    nodes.forEach((n) => g.setNode(n.id, { width: 200, height: 60 }))
    edges.forEach((e) => g.setEdge(e.source, e.target))
    dagre.layout(g)
    const newNodes = nodes.map((n) => {
      const p = g.node(n.id)
      return { ...n, position: { x: p.x - 100, y: p.y - 30 } }
    })
    setNodes(newNodes)
  }

  async function handleSave() {
    try {
      setLoading(true)
      const payload = { name, data: { version: 1, nodes, edges } }
      if (isNew) {
        const w = await workflowsApi.create(payload as any)
        navigate(`/workflows/${w.id}`)
      } else if (id) {
        await workflowsApi.update(Number(id), payload as any)
        alert('Saved!')
      }
    } catch (e: any) {
      alert(e?.message || 'Save failed')
    } finally { setLoading(false) }
  }

  function handleTest() {
    const warnings = validate()
    if (warnings.length) alert(`Validation issues:\n- ${warnings.join('\n- ')}`)
    else alert('✓ Dry-run OK')
  }

  if (loading && !isNew) return <div className="flex items-center justify-center h-96">Loading...</div>

  const warnings = useMemo(() => validate(), [nodes, edges])

  return (
    <div className="fixed inset-0 flex flex-col">
      {/* Header */}
      <div className="border-b bg-background px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/workflows')} className="p-2 hover:bg-accent rounded">
            <LuArrowLeft className="w-5 h-5" />
          </button>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-lg font-semibold bg-transparent border-0 border-b-2 border-transparent hover:border-primary focus:border-primary focus:outline-none px-2"
          />
          <span className="text-xs text-muted-foreground">{nodes.length} nodes · {warnings.length} warnings</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { const w = validate(); alert(w.length ? `Issues:\n- ${w.join('\n- ')}` : '✓ Valid') }} className="h-8 px-3 rounded border flex items-center gap-2"><LuCheckCircle /> Validate</button>
          <button onClick={autoLayout} className="h-8 px-3 rounded border flex items-center gap-2"><LuLayout /> Auto-layout</button>
          <button onClick={handleSave} disabled={loading} className="h-8 px-3 rounded border flex items-center gap-2"><LuSave /> Save</button>
          <button onClick={handleTest} className="h-8 px-3 rounded border flex items-center gap-2"><LuPlay /> Test</button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        <NodeLibrarySidebar />

        <div className="flex-1 relative" ref={wrapperRef} onDrop={onDrop} onDragOver={onDragOver}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeClick={(_, n) => setSelectedNode(n as any)}
            onPaneClick={() => setSelectedNode(null)}
            connectionMode={ConnectionMode.Loose}
            fitView
            snapToGrid
            snapGrid={[20, 20]}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        <RightInspector selectedNode={selectedNode} onUpdate={(id, data) => updateNodeData(id, data)} />
      </div>
    </div>
  )
}

