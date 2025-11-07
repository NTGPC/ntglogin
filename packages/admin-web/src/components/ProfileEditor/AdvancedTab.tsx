import { ProfileEditorData } from './types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface AdvancedTabProps {
  data: ProfileEditorData
  onChange: (data: Partial<ProfileEditorData>) => void
}

export default function AdvancedTab({ data, onChange }: AdvancedTabProps) {
  const screenResolutions = [
    '1920x1080',
    '1366x768',
    '1536x864',
    '1440x900',
    '1280x720',
    '1600x900',
  ]

  const handleScreenResChange = (value: string) => {
    const [width, height] = value.split('x').map(Number)
    if (width && height) {
      onChange({ screenWidth: width, screenHeight: height })
    }
  }

  const currentScreenRes = data.screenWidth && data.screenHeight
    ? `${data.screenWidth}x${data.screenHeight}`
    : ''

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="osName">OS Name</Label>
          <select
            id="osName"
            className="w-full px-3 py-2 border rounded-md text-sm"
            value={data.osName || 'Windows 10'}
            onChange={(e) => onChange({ osName: e.target.value })}
          >
            <option value="Windows 10">Windows 10</option>
            <option value="Windows 11">Windows 11</option>
            <option value="macOS">macOS</option>
            <option value="Linux">Linux</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="osArch">Architecture</Label>
          <select
            id="osArch"
            className="w-full px-3 py-2 border rounded-md text-sm"
            value={data.osArch || 'x64'}
            onChange={(e) => onChange({ osArch: e.target.value as 'x86' | 'x64' })}
          >
            <option value="x64">x64</option>
            <option value="x86">x86</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="browserVersion">Browser Version</Label>
        <select
          id="browserVersion"
          className="w-full px-3 py-2 border rounded-md text-sm"
          value={data.browserVersion || 'Auto'}
          onChange={(e) => onChange({ browserVersion: e.target.value })}
        >
          <option value="Auto">Auto</option>
          {Array.from({ length: 11 }, (_, i) => 140 - i).map((v) => (
            <option key={v} value={v.toString()}>
              Chrome {v}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="screenRes">Screen Resolution</Label>
        <select
          id="screenRes"
          className="w-full px-3 py-2 border rounded-md text-sm"
          value={currentScreenRes}
          onChange={(e) => handleScreenResChange(e.target.value)}
        >
          <option value="">Custom</option>
          {screenResolutions.map((res) => (
            <option key={res} value={res}>
              {res}
            </option>
          ))}
        </select>
      </div>

      {currentScreenRes === '' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="screenWidth">Width</Label>
            <Input
              id="screenWidth"
              type="number"
              value={data.screenWidth || ''}
              onChange={(e) =>
                onChange({ screenWidth: parseInt(e.target.value) || undefined })
              }
              placeholder="1920"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="screenHeight">Height</Label>
            <Input
              id="screenHeight"
              type="number"
              value={data.screenHeight || ''}
              onChange={(e) =>
                onChange({ screenHeight: parseInt(e.target.value) || undefined })
              }
              placeholder="1080"
            />
          </div>
        </div>
      )}
    </div>
  )
}

