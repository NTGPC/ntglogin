import { Handle, Position } from 'reactflow'
import { MousePointer, Type, Clock } from 'lucide-react'

export function ClickNode({ data, selected }: any) {
  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 shadow-sm transition-all bg-white ${
        selected ? 'border-green-500 bg-green-50' : 'border-green-300'
      }`}
      style={{ minWidth: '180px' }}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-green-600" />
      
      <div className="flex items-center gap-2 mb-1">
        <MousePointer className="w-4 h-4 text-green-600" />
        <div className="font-semibold text-sm text-gray-900">Click</div>
      </div>
      <div className="text-xs text-gray-600">Click element</div>
      
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-green-600" />
    </div>
  )
}

export function WaitSelectorNode({ data, selected }: any) {
  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 shadow-sm transition-all bg-white ${
        selected ? 'border-green-500 bg-green-50' : 'border-green-300'
      }`}
      style={{ minWidth: '180px' }}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-green-600" />
      
      <div className="flex items-center gap-2 mb-1">
        <Clock className="w-4 h-4 text-green-600" />
        <div className="font-semibold text-sm text-gray-900">Wait</div>
      </div>
      <div className="text-xs text-gray-600">Wait for element</div>
      
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-green-600" />
    </div>
  )
}

export function TypeTextNode({ data, selected }: any) {
  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 shadow-sm transition-all bg-white ${
        selected ? 'border-purple-500 bg-purple-50' : 'border-purple-300'
      }`}
      style={{ minWidth: '180px' }}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-purple-600" />
      
      <div className="flex items-center gap-2 mb-1">
        <Type className="w-4 h-4 text-purple-600" />
        <div className="font-semibold text-sm text-gray-900">Type Text</div>
      </div>
      <div className="text-xs text-gray-600">Fill input field</div>
      
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-purple-600" />
    </div>
  )
}

