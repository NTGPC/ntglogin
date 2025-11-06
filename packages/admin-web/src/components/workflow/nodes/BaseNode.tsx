import { Handle, Position } from 'reactflow'
import { LucideIcon } from 'lucide-react'

interface BaseNodeProps {
  label: string
  description?: string
  icon?: LucideIcon
  selected?: boolean
  inputHandles?: number
  outputHandles?: number
}

export function BaseNode({ label, description, icon: Icon, selected = false, inputHandles = 1, outputHandles = 1 }: BaseNodeProps) {
  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 shadow-sm transition-all bg-white ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
      style={{ minWidth: '180px' }}
    >
      {inputHandles > 0 && (
        <Handle type="target" position={Position.Left} className="w-3 h-3 bg-gray-400" />
      )}
      
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="w-4 h-4 text-blue-600" />}
        <div className="font-semibold text-sm text-gray-900">{label}</div>
      </div>
      {description && <div className="text-xs text-gray-600">{description}</div>}
      
      {outputHandles > 0 && (
        <Handle type="source" position={Position.Right} className="w-3 h-3 bg-gray-400" />
      )}
    </div>
  )
}

