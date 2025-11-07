import { ProfileEditorData } from './types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Wand2 } from 'lucide-react'

interface GeneralTabProps {
  data: ProfileEditorData
  onChange: (data: Partial<ProfileEditorData>) => void
  onGenerateUA?: () => void
}

export default function GeneralTab({ data, onChange, onGenerateUA }: GeneralTabProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Profile Name *</Label>
        <Input
          id="name"
          value={data.name || ''}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Enter profile name"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="userAgent">User Agent</Label>
          {onGenerateUA && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onGenerateUA}
              className="flex items-center gap-1"
            >
              <Wand2 className="h-3 w-3" />
              Generate
            </Button>
          )}
        </div>
        <Input
          id="userAgent"
          value={data.userAgent || ''}
          onChange={(e) => onChange({ userAgent: e.target.value })}
          placeholder="Auto via provider"
          className="font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground">
          Leave empty to auto-generate a unique User Agent
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="macAddress">MAC Address</Label>
        <Input
          id="macAddress"
          value={data.macAddress || ''}
          onChange={(e) => onChange({ macAddress: e.target.value })}
          placeholder="Auto random (unique)"
          className="font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground">
          Leave empty to auto-generate a unique MAC address
        </p>
      </div>
    </div>
  )
}

