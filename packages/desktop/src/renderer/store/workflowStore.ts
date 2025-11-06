import { create } from 'zustand'
import { Node, Edge, Connection } from 'reactflow'

export interface WorkflowNode extends Node {
  data: {
    label: string
    action: string
    config?: any
  }
}

interface WorkflowState {
  nodes: WorkflowNode[]
  edges: Edge[]
  selectedNode: WorkflowNode | null
  setNodes: (nodes: WorkflowNode[]) => void
  setEdges: (edges: Edge[]) => void
  addNode: (node: WorkflowNode) => void
  updateNode: (id: string, data: Partial<WorkflowNode['data']>) => void
  deleteNode: (id: string) => void
  onConnect: (connection: Connection) => void
  setSelectedNode: (node: WorkflowNode | null) => void
  onNodesChange: (changes: any[]) => void
  onEdgesChange: (changes: any[]) => void
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  updateNode: (id, data) => set((state) => ({
    nodes: state.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } } : n)),
  })),
  deleteNode: (id) => set((state) => ({
    nodes: state.nodes.filter((n) => n.id !== id),
    edges: state.edges.filter((e) => e.source !== id && e.target !== id),
  })),
  onConnect: (connection) => set((state) => ({
    edges: [...state.edges, { ...connection, id: `edge-${connection.source}-${connection.target}` }],
  })),
  setSelectedNode: (node) => set({ selectedNode: node }),
  onNodesChange: (changes) => {
    set((state) => {
      const newNodes = [...state.nodes]
      changes.forEach((change) => {
        if (change.type === 'remove') {
          const index = newNodes.findIndex((n) => n.id === change.id)
          if (index !== -1) newNodes.splice(index, 1)
        } else if (change.type === 'position') {
          const index = newNodes.findIndex((n) => n.id === change.id)
          if (index !== -1) newNodes[index].position = change.position
        }
      })
      return { nodes: newNodes }
    })
  },
  onEdgesChange: (changes) => {
    set((state) => {
      const newEdges = [...state.edges]
      changes.forEach((change) => {
        if (change.type === 'remove') {
          const index = newEdges.findIndex((e) => e.id === change.id)
          if (index !== -1) newEdges.splice(index, 1)
        }
      })
      return { edges: newEdges }
    })
  },
}))

