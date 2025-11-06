import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface RightInspectorProps {
  selectedNode: any
  onUpdate: (id: string, data: any) => void
}

export function RightInspector({ selectedNode, onUpdate }: RightInspectorProps) {
  if (!selectedNode) {
    return (
      <div className="w-80 border-l bg-card p-4">
        <p className="text-sm text-muted-foreground">Select a node to edit</p>
      </div>
    )
  }

  const handleChange = (key: string, value: string) => {
    const finalValue = key === 'timeout' ? Number(value) || 5000 : value
    onUpdate(selectedNode.id, {
      config: { ...selectedNode.data.config, [key]: finalValue },
    })
  }

  const renderConfigField = (key: string) => {
    const value = selectedNode.data.config?.[key] || ''
    const inputType = key === 'timeout' ? 'number' : 'text'
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium">
          {key}
        </Label>
        <Input
          id={key}
          type={inputType}
          value={value}
          onChange={(e) => handleChange(key, e.target.value)}
          className="h-9"
        />
      </div>
    )
  }

  const configKeys = Object.keys(selectedNode.data.config || {})

  return (
    <div className="w-80 border-l bg-card overflow-y-auto">
      <div className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold mb-1">{selectedNode.data.label}</h3>
          <p className="text-xs text-muted-foreground">{selectedNode.data.action}</p>
        </div>

        <div className="space-y-4">
          {configKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground">No configuration needed</p>
          ) : (
            configKeys.map(renderConfigField)
          )}
        </div>
      </div>
    </div>
  )
}

