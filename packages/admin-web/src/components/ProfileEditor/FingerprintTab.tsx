import { ProfileEditorData } from './types'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface FingerprintTabProps {
  data: ProfileEditorData
  onChange: (data: Partial<ProfileEditorData>) => void
}

export default function FingerprintTab({ data, onChange }: FingerprintTabProps) {
  return (
    <div className="space-y-6">
      {/* Canvas */}
      <div className="space-y-2">
        <Label>Canvas Fingerprint</Label>
        <RadioGroup
          value={data.canvasMode || 'Noise'}
          onValueChange={(value) => onChange({ canvasMode: value as 'Noise' | 'Off' | 'Block' })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Noise" id="canvas-noise" />
            <Label htmlFor="canvas-noise" className="cursor-pointer font-normal">
              Noise (deterministic)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Off" id="canvas-off" />
            <Label htmlFor="canvas-off" className="cursor-pointer font-normal">
              Off
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Block" id="canvas-block" />
            <Label htmlFor="canvas-block" className="cursor-pointer font-normal">
              Block
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Client Rects */}
      <div className="space-y-2">
        <Label>Client Rects</Label>
        <RadioGroup
          value={data.clientRectsMode || 'Off'}
          onValueChange={(value) => onChange({ clientRectsMode: value as 'Off' | 'Noise' })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Off" id="rects-off" />
            <Label htmlFor="rects-off" className="cursor-pointer font-normal">
              Off
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Noise" id="rects-noise" />
            <Label htmlFor="rects-noise" className="cursor-pointer font-normal">
              Noise
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Audio Context */}
      <div className="space-y-2">
        <Label>Audio Context</Label>
        <RadioGroup
          value={data.audioCtxMode || 'Off'}
          onValueChange={(value) => onChange({ audioCtxMode: value as 'Off' | 'Noise' })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Off" id="audio-off" />
            <Label htmlFor="audio-off" className="cursor-pointer font-normal">
              Off
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Noise" id="audio-noise" />
            <Label htmlFor="audio-noise" className="cursor-pointer font-normal">
              Noise (deterministic)
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* WebGL Image */}
      <div className="space-y-2">
        <Label>WebGL Image</Label>
        <RadioGroup
          value={data.webglImageMode || 'Off'}
          onValueChange={(value) => onChange({ webglImageMode: value as 'Off' | 'Noise' })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Off" id="webgl-img-off" />
            <Label htmlFor="webgl-img-off" className="cursor-pointer font-normal">
              Off
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Noise" id="webgl-img-noise" />
            <Label htmlFor="webgl-img-noise" className="cursor-pointer font-normal">
              Noise
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* WebGL Metadata */}
      <div className="space-y-2">
        <Label>WebGL Metadata</Label>
        <RadioGroup
          value={data.webglMetaMode || 'Mask'}
          onValueChange={(value) => onChange({ webglMetaMode: value as 'Mask' | 'Real' })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Mask" id="webgl-meta-mask" />
            <Label htmlFor="webgl-meta-mask" className="cursor-pointer font-normal">
              Mask
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Real" id="webgl-meta-real" />
            <Label htmlFor="webgl-meta-real" className="cursor-pointer font-normal">
              Real
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Geolocation */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="geoEnabled"
            checked={data.geoEnabled || false}
            onChange={(e) => onChange({ geoEnabled: e.target.checked })}
            className="h-4 w-4"
          />
          <Label htmlFor="geoEnabled" className="cursor-pointer font-normal">
            Geolocation (Using fake - hide original)
          </Label>
        </div>
      </div>

      {/* WebRTC */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="webrtcMainIP"
            checked={data.webrtcMainIP || false}
            onChange={(e) => onChange({ webrtcMainIP: e.target.checked })}
            className="h-4 w-4"
          />
          <Label htmlFor="webrtcMainIP" className="cursor-pointer font-normal">
            WebRTC IP (Using main IP - hide original)
          </Label>
        </div>
      </div>

      {/* SwiftShader */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="useSwiftShader"
            checked={data.useSwiftShader || false}
            onChange={(e) => onChange({ useSwiftShader: e.target.checked })}
            className="h-4 w-4"
          />
          <Label htmlFor="useSwiftShader" className="cursor-pointer font-normal">
            Use SwiftShader (GPU masking at system level)
          </Label>
        </div>
      </div>
    </div>
  )
}

