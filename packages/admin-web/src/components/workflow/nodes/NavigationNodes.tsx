import { Handle, Position } from 'reactflow'
import { Globe, XCircle } from 'lucide-react'

export function OpenPageNode({ data, selected }: any) {
  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 shadow-sm transition-all bg-white ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-blue-300'
      }`}
      style={{ minWidth: '180px' }}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-600" />
      
      <div className="flex items-center gap-2 mb-1">
        <Globe className="w-4 h-4 text-blue-600" />
        <div className="font-semibold text-sm text-gray-900">Open Page</div>
      </div>
      <div className="text-xs text-gray-600 truncate">Navigate to URL</div>
      
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-600" />
    </div>
  )
}

export function ClosePageNode({ data, selected }: any) {
  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 shadow-sm transition-all bg-white ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-blue-300'
      }`}
      style={{ minWidth: '180px' }}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-600" />
      
      <div className="flex items-center gap-2 mb-1">
        <XCircle className="w-4 h-4 text-blue-600" />
        <div className="font-semibold text-sm text-gray-900">Close Page</div>
      </div>
      <div className="text-xs text-gray-600">Close current page</div>
      
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-600" />
    </div>
  )
}

