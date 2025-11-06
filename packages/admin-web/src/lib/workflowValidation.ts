interface RFNode {
  id: string
  type: string
  data: any
}

interface RFEdge {
  id: string
  source: string
  target: string
}

export interface ValidationIssue {
  type: 'error' | 'warning'
  message: string
  nodeId?: string
  edgeId?: string
}

export function validateWorkflow(nodes: RFNode[], edges: RFEdge[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // Check for Start nodes
  const startNodes = nodes.filter((n) => n.type === 'start')
  if (startNodes.length === 0) {
    issues.push({ type: 'error', message: 'Workflow must have at least one Start node' })
  } else if (startNodes.length > 1) {
    issues.push({ type: 'error', message: 'Workflow can only have one Start node' })
  }

  // Check for End nodes
  const endNodes = nodes.filter((n) => n.type === 'end')
  if (endNodes.length === 0) {
    issues.push({ type: 'warning', message: 'Workflow should have at least one End node' })
  }

  // Build adjacency map
  const inDegree: Record<string, number> = {}
  const adjacency: Record<string, string[]> = {}

  nodes.forEach((node) => {
    inDegree[node.id] = 0
    adjacency[node.id] = []
  })

  edges.forEach((edge) => {
    inDegree[edge.target]++
    adjacency[edge.source]?.push(edge.target)
  })

  // Check for orphaned nodes (nodes without inputs except Start)
  nodes.forEach((node) => {
    if (node.type !== 'start' && inDegree[node.id] === 0) {
      issues.push({
        type: 'warning',
        message: `Node "${node.data.label}" is orphaned (no inputs)`,
        nodeId: node.id,
      })
    }
  })

  // Check for End nodes with no outputs
  endNodes.forEach((end) => {
    const hasOutgoing = adjacency[end.id] && adjacency[end.id].length > 0
    if (hasOutgoing) {
      issues.push({
        type: 'warning',
        message: `End node has outgoing connections`,
        nodeId: end.id,
      })
    }
  })

  // Cycle detection using DFS
  const hasCycle = detectCycles(nodes, edges)
  if (hasCycle) {
    issues.push({ type: 'error', message: 'Workflow contains cycles' })
  }

  return issues
}

function detectCycles(nodes: RFNode[], edges: RFEdge[]): boolean {
  const WHITE = 0
  const GRAY = 1
  const BLACK = 2

  const color: Record<string, number> = {}
  const adjacency: Record<string, string[]> = {}

  nodes.forEach((node) => {
    color[node.id] = WHITE
    adjacency[node.id] = []
  })

  edges.forEach((edge) => {
    adjacency[edge.source]?.push(edge.target)
  })

  const dfs = (nodeId: string): boolean => {
    if (color[nodeId] === GRAY) return true // Cycle found
    if (color[nodeId] === BLACK) return false // Already processed

    color[nodeId] = GRAY
    for (const neighbor of adjacency[nodeId] || []) {
      if (dfs(neighbor)) return true
    }
    color[nodeId] = BLACK
    return false
  }

  for (const node of nodes) {
    if (color[node.id] === WHITE && dfs(node.id)) {
      return true
    }
  }

  return false
}

export function topologicalSort(nodes: RFNode[], edges: RFEdge[]): string[] {
  const inDegree: Record<string, number> = {}
  const adjacency: Record<string, string[]> = {}
  const queue: string[] = []
  const result: string[] = []

  // Initialize
  nodes.forEach((node) => {
    inDegree[node.id] = 0
    adjacency[node.id] = []
  })

  edges.forEach((edge) => {
    inDegree[edge.target]++
    adjacency[edge.source]?.push(edge.target)
  })

  // Find all nodes with no incoming edges
  nodes.forEach((node) => {
    if (inDegree[node.id] === 0) {
      queue.push(node.id)
    }
  })

  // Process queue
  while (queue.length > 0) {
    const nodeId = queue.shift()!
    result.push(nodeId)

    for (const neighbor of adjacency[nodeId] || []) {
      inDegree[neighbor]--
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor)
      }
    }
  }

  // Check if all nodes were processed (should equal nodes.length if no cycle)
  if (result.length !== nodes.length) {
    throw new Error('Cannot sort: workflow contains cycles')
  }

  return result
}

