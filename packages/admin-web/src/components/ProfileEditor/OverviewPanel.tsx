import { ProfileEditorData } from './types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Monitor, Globe, Shield, Fingerprint } from 'lucide-react'

interface OverviewPanelProps {
  data: ProfileEditorData
}

export default function OverviewPanel({ data }: OverviewPanelProps) {
  const getProxyDisplay = () => {
    if (data.proxyMode === 'manual' && data.proxyManual?.host) {
      return `${data.proxyManual.host}:${data.proxyManual.port || 'N/A'}`
    }
    if (data.proxyMode === 'library' && data.proxyRefId) {
      return `Library Proxy #${data.proxyRefId}`
    }
    return 'No proxy'
  }

  const getScreenDisplay = () => {
    if (data.screenWidth && data.screenHeight) {
      return `${data.screenWidth}x${data.screenHeight}`
    }
    return 'Not set'
  }

  const getFingerprintSummary = () => {
    const active: string[] = []
    if (data.canvasMode && data.canvasMode !== 'Off') active.push(`Canvas: ${data.canvasMode}`)
    if (data.clientRectsMode && data.clientRectsMode !== 'Off') active.push('ClientRects')
    if (data.audioCtxMode && data.audioCtxMode !== 'Off') active.push('AudioContext')
    if (data.webglImageMode && data.webglImageMode !== 'Off') active.push('WebGL Image')
    if (data.webglMetaMode) active.push(`WebGL Meta: ${data.webglMetaMode}`)
    if (data.geoEnabled) active.push('Geolocation')
    if (data.webrtcMainIP) active.push('WebRTC')
    if (data.useSwiftShader) active.push('SwiftShader')
    return active.length > 0 ? active.join(', ') : 'No fingerprinting'
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Profile Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* General Info */}
          <div>
            <h3 className="text-sm font-semibold mb-2">General</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{data.name || 'Untitled'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">User Agent:</span>
                <span className="font-mono text-xs truncate max-w-[200px]" title={data.userAgent}>
                  {data.userAgent ? 'Set' : 'Auto'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">MAC Address:</span>
                <span className="font-mono text-xs">
                  {data.macAddress || 'Auto random'}
                </span>
              </div>
            </div>
          </div>

          {/* Proxy Info */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Proxy
            </h3>
            <div className="text-sm">
              <Badge variant={data.proxyMode === 'manual' && data.proxyManual?.host ? 'default' : 'secondary'}>
                {getProxyDisplay()}
              </Badge>
            </div>
          </div>

          {/* Advanced Info */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Advanced
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">OS:</span>
                <span>{data.osName || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Architecture:</span>
                <span>{data.osArch || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Browser:</span>
                <span>{data.browserVersion || 'Auto'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Screen:</span>
                <span>{getScreenDisplay()}</span>
              </div>
            </div>
          </div>

          {/* Fingerprint Summary */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Fingerprint className="h-4 w-4" />
              Fingerprint
            </h3>
            <div className="text-sm text-muted-foreground">
              {getFingerprintSummary()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

