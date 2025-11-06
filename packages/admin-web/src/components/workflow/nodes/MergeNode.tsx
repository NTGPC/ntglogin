import { Handle, Position } from 'reactflow'
import { GitMerge } from 'lucide-react'

export function MergeNode({ selected }: any) {
  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 shadow-sm transition-all bg-white ${
        selected ? 'border-orange-500 bg-orange-50' : 'border-orange-300'
      }`}
      style={{ minWidth: '150px' }}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-orange-600" />
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-orange-600" />
      
      <div className="flex items-center gap-2">
        <GitMerge className="w-4 h-4 text-orange-600" />
        <div className="font-semibold text-sm text-gray-900">Merge</div>
      </div>
      <div className="text-xs text-gray-600 mt-1">Wait for all inputs</div>
      
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-orange-600" />
    </div>
  )
}

