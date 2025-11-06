import { Handle, Position } from 'reactflow'

export function N8nExecuteWorkflowNode({ data }: any) {
  const cfg = data?.config || {}
  return (
    <div className="bg-white border rounded-md shadow-sm px-3 py-2 min-w-[220px]">
      <div className="text-sm font-medium">n8n: Execute Workflow</div>
      <div className="text-xs text-muted-foreground break-all">
        {cfg.workflowId || 'workflow-id'}
      </div>
      <Handle type="target" position={Position.Left} id="in" />
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  )
}


