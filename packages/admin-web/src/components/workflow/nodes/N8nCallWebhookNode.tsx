import { Handle, Position } from 'reactflow'
import { BaseNode } from './BaseNode'

export function N8nCallWebhookNode({ data }: any) {
  const cfg = data?.config || {}
  return (
    <div className="bg-white border rounded-md shadow-sm px-3 py-2 min-w-[200px]">
      <div className="text-sm font-medium">n8n: Call Webhook</div>
      <div className="text-xs text-muted-foreground break-all">
        {cfg.path || '/webhook/...'}
      </div>
      <Handle type="target" position={Position.Left} id="in" />
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  )
}


