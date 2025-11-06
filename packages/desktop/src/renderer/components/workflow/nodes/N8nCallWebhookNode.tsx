import React from 'react'

export const N8nCallWebhookNode: React.FC<any> = ({ data }) => {
  return (
    <div className="border rounded px-2 py-1 bg-white">
      <div className="text-xs font-medium">n8n: Call Webhook</div>
      <div className="text-[10px] text-gray-500">{data?.config?.path || '/webhook/...'} </div>
    </div>
  )
}


