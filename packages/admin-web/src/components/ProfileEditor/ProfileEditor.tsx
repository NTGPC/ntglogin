import { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ProfileEditorData, TabType } from './types'
import GeneralTab from './GeneralTab'
import ProxyTab from './ProxyTab'
import AdvancedTab from './AdvancedTab'
import FingerprintTab from './FingerprintTab'
import OverviewPanel from './OverviewPanel'
import { Proxy, api } from '@/lib/api'

interface ProfileEditorProps {
  initialData?: Partial<ProfileEditorData>
  proxies?: Proxy[]
  onSave?: (data: ProfileEditorData) => void | Promise<void>
  onCancel?: () => void
}

export default function ProfileEditor({
  initialData,
  proxies = [],
  onSave,
  onCancel,
}: ProfileEditorProps) {
  const [activeTab, setActiveTab] = useState<TabType>('general')
  const [data, setData] = useState<ProfileEditorData>({
    name: '',
    proxyMode: 'manual',
    ...initialData,
  })

  // Update data when initialData changes
  useEffect(() => {
    if (initialData) {
      setData((prev) => ({ ...prev, ...initialData }))
    }
  }, [initialData])

  const handleChange = (updates: Partial<ProfileEditorData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }

  const handleGenerateUA = async () => {
    try {
      const ua = await api.getUserAgent()
      if (ua) {
        handleChange({ userAgent: typeof ua === 'string' ? ua : ua.userAgent || ua })
      }
    } catch (error) {
      console.error('Failed to generate User Agent:', error)
    }
  }

  const handleSave = async () => {
    if (onSave) {
      await onSave(data)
    }
  }

  return (
    <div className="flex gap-6 h-full">
      {/* Left Panel: Tabs */}
      <div className="flex-1 space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="proxy">Proxy</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="fingerprint">Fingerprint</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <GeneralTab
              data={data}
              onChange={handleChange}
              onGenerateUA={handleGenerateUA}
            />
          </TabsContent>

          <TabsContent value="proxy" className="mt-4">
            <ProxyTab
              data={data}
              onChange={handleChange}
              proxies={proxies}
            />
          </TabsContent>

          <TabsContent value="advanced" className="mt-4">
            <AdvancedTab
              data={data}
              onChange={handleChange}
            />
          </TabsContent>

          <TabsContent value="fingerprint" className="mt-4">
            <FingerprintTab
              data={data}
              onChange={handleChange}
            />
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          {onSave && (
            <button
              onClick={handleSave}
              disabled={!data.name}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          )}
        </div>
      </div>

      {/* Right Panel: Overview */}
      <div className="w-80 flex-shrink-0">
        <div className="sticky top-4">
          <OverviewPanel data={data} />
        </div>
      </div>
    </div>
  )
}

