import { Handle, Position } from 'reactflow'
import { Play } from 'lucide-react'

export function StartNode({ selected }: any) {
  return (
    <div
      className={`px-4 py-3 rounded-full border-2 shadow-sm transition-all bg-white ${
        selected ? 'border-green-500 bg-green-50' : 'border-green-300'
      }`}
      style={{ minWidth: '120px', textAlign: 'center' }}
    >
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-green-600" />
      <div className="flex items-center justify-center gap-2">
        <Play className="w-4 h-4 text-green-600" />
        <div className="font-semibold text-sm text-gray-900">Start</div>
      </div>
    </div>
  )
}

