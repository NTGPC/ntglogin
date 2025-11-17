import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

interface GPUEntry {
  brand: string
  series: string
  model: string
  device_id: string
  device_id_decimal: number
  architecture: string
  directx: string
  shader_model: string
  angle: string
}

interface GPUSelectProps {
  value: string
  onChange: (angle: string, vendor: string) => void
}

export default function GPUSelect({ value, onChange }: GPUSelectProps) {
  const [gpus, setGpus] = useState<GPUEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadGPUs = async () => {
      try {
        setLoading(true)
        const gpuList = await api.getGPUList()
        setGpus(gpuList)
      } catch (error) {
        console.error('[GPUSelect] Failed to load GPU list:', error)
      } finally {
        setLoading(false)
      }
    }
    loadGPUs()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const angle = e.target.value
    if (!angle) {
      onChange('', '')
      return
    }

    const selectedGpu = gpus.find(gpu => gpu.angle === angle)
    if (selectedGpu) {
      const vendor = selectedGpu.angle.includes('ANGLE') ? 'Google Inc. (NVIDIA)' : 
                     selectedGpu.brand === 'Apple' ? 'Apple Inc.' : 
                     selectedGpu.brand === 'Intel' ? 'Intel Inc.' : 
                     'Google Inc. (NVIDIA)'
      onChange(angle, vendor)
    }
  }

  return (
    <select
      value={value || ''}
      onChange={handleChange}
      disabled={loading}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
    >
      <option value="">-- Chọn card đồ họa --</option>
      {loading ? (
        <option disabled>Đang tải danh sách GPU...</option>
      ) : (
        gpus.map((gpu, index) => (
          <option key={index} value={gpu.angle}>
            {gpu.model} ({gpu.brand}) - {gpu.series}
          </option>
        ))
      )}
    </select>
  )
}

