import { Handle, Position } from 'reactflow'
import { XCircle } from 'lucide-react'

export function EndNode({ selected }: any) {
  return (
    <div
      className={`px-4 py-3 rounded-full border-2 shadow-sm transition-all bg-white ${
        selected ? 'border-red-500 bg-red-50' : 'border-red-300'
      }`}
      style={{ minWidth: '120px', textAlign: 'center' }}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-red-600" />
      <div className="flex items-center justify-center gap-2">
        <XCircle className="w-4 h-4 text-red-600" />
        <div className="font-semibold text-sm text-gray-900">End</div>
      </div>
    </div>
  )
}

