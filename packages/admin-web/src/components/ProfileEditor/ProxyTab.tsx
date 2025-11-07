import { ProfileEditorData } from './types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Proxy } from '@/lib/api'

interface ProxyTabProps {
  data: ProfileEditorData
  onChange: (data: Partial<ProfileEditorData>) => void
  proxies?: Proxy[]
}

export default function ProxyTab({ data, onChange, proxies = [] }: ProxyTabProps) {
  return (
    <div className="space-y-6">
      <RadioGroup
        value={data.proxyMode || 'manual'}
        onValueChange={(value) => onChange({ proxyMode: value as 'manual' | 'library' })}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="manual" id="proxy-manual" />
          <Label htmlFor="proxy-manual" className="cursor-pointer">
            Manual Proxy
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="library" id="proxy-library" />
          <Label htmlFor="proxy-library" className="cursor-pointer">
            From Library
          </Label>
        </div>
      </RadioGroup>

      {data.proxyMode === 'manual' ? (
        <div className="space-y-4 pl-6 border-l-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="proxy-host">Host</Label>
              <Input
                id="proxy-host"
                value={data.proxyManual?.host || ''}
                onChange={(e) =>
                  onChange({
                    proxyManual: { ...data.proxyManual, host: e.target.value },
                  })
                }
                placeholder="192.168.1.100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proxy-port">Port</Label>
              <Input
                id="proxy-port"
                type="number"
                value={data.proxyManual?.port || ''}
                onChange={(e) =>
                  onChange({
                    proxyManual: {
                      ...data.proxyManual,
                      port: parseInt(e.target.value) || undefined,
                    },
                  })
                }
                placeholder="8080"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="proxy-username">Username (optional)</Label>
              <Input
                id="proxy-username"
                value={data.proxyManual?.username || ''}
                onChange={(e) =>
                  onChange({
                    proxyManual: { ...data.proxyManual, username: e.target.value },
                  })
                }
                placeholder="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proxy-password">Password (optional)</Label>
              <Input
                id="proxy-password"
                type="password"
                value={data.proxyManual?.password || ''}
                onChange={(e) =>
                  onChange({
                    proxyManual: { ...data.proxyManual, password: e.target.value },
                  })
                }
                placeholder="password"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2 pl-6 border-l-2">
          <Label htmlFor="proxy-ref-id">Proxy ID</Label>
          <Input
            id="proxy-ref-id"
            value={data.proxyRefId || ''}
            onChange={(e) => onChange({ proxyRefId: e.target.value })}
            placeholder="Select proxy from library"
          />
          {proxies.length > 0 && (
            <select
              className="w-full mt-2 px-3 py-2 border rounded-md text-sm"
              value={data.proxyRefId || ''}
              onChange={(e) => onChange({ proxyRefId: e.target.value })}
            >
              <option value="">Select a proxy...</option>
              {proxies.map((proxy) => (
                <option key={proxy.id} value={proxy.id.toString()}>
                  {proxy.host}:{proxy.port} ({proxy.type})
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  )
}

