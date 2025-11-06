import React from 'react'

export const N8nExecuteWorkflowNode: React.FC<any> = ({ data }) => {
  return (
    <div className="border rounded px-2 py-1 bg-white">
      <div className="text-xs font-medium">n8n: Execute Workflow</div>
      <div className="text-[10px] text-gray-500">{data?.config?.workflowId || 'workflow-id'}</div>
    </div>
  )
}


