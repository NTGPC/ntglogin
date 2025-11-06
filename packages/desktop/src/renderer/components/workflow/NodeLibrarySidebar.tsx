import React, { useMemo, useState } from 'react'
import clsx from 'clsx'
import { LuPlay, LuX, LuGitMerge, LuGlobe, LuTimer, LuMousePointerClick, LuType, LuImage, LuWorkflow, LuWebhook, LuSearch } from 'react-icons/lu'

type LibraryItem = {
  id: string
  type: string
  title: string
  subtitle?: string
  icon: React.ReactNode
  initialData?: any
  category: 'control' | 'navigation' | 'interaction' | 'data' | 'n8n'
}

const ITEMS: LibraryItem[] = [
  { id: 'start', type: 'start', title: 'Start', subtitle: 'Entry point', icon: <LuPlay />, category: 'control', initialData: { label: 'Start' } },
  { id: 'end', type: 'end', title: 'End', subtitle: 'Finish execution', icon: <LuX />, category: 'control', initialData: { label: 'End' } },
  { id: 'merge', type: 'merge', title: 'Merge', subtitle: 'Join branches', icon: <LuGitMerge />, category: 'control', initialData: { label: 'Merge' } },

  { id: 'openPage', type: 'openPage', title: 'Open Page', subtitle: 'Navigate to URL', icon: <LuGlobe />, category: 'navigation', initialData: { config: { url: 'https://example.com' } } },
  { id: 'closePage', type: 'closePage', title: 'Close Page', subtitle: 'Close current tab', icon: <LuX />, category: 'navigation' },

  { id: 'waitSelector', type: 'waitSelector', title: 'Wait Selector', subtitle: 'Wait for element', icon: <LuTimer />, category: 'interaction', initialData: { config: { selector: 'body', timeout: 5000 } } },
  { id: 'click', type: 'click', title: 'Click', subtitle: 'Click element', icon: <LuMousePointerClick />, category: 'interaction', initialData: { config: { selector: 'button' } } },
  { id: 'typeText', type: 'typeText', title: 'Type Text', subtitle: 'Fill input', icon: <LuType />, category: 'interaction', initialData: { config: { selector: 'input', text: '' } } },

  { id: 'screenshot', type: 'screenshot', title: 'Screenshot', subtitle: 'Capture page', icon: <LuImage />, category: 'data' },

  // n8n base nodes
  { id: 'n8nExecuteWorkflow', type: 'n8nExecuteWorkflow', title: 'n8n Execute Workflow', subtitle: 'Trigger workflow, poll result', icon: <LuWorkflow />, category: 'n8n', initialData: { config: { workflowId: '', payload: {}, pollIntervalMs: 1000, timeoutMs: 120000 } } },
  { id: 'n8nCallWebhook', type: 'n8nCallWebhook', title: 'n8n Call Webhook', subtitle: 'POST to webhook', icon: <LuWebhook />, category: 'n8n', initialData: { config: { path: '/webhook/test', payload: {}, headers: {} } } },
  // Templates
  { id: 'tplTelegram', type: 'n8nExecuteWorkflow', title: 'Telegram Send Message', subtitle: 'n8n template', icon: <LuWorkflow />, category: 'n8n', initialData: { config: { workflowId: 'replace-workflow-id', payload: { chatId: '123456', text: 'Hi from NTG!' }, pollIntervalMs: 1000, timeoutMs: 120000 } } },
  { id: 'tplSheets', type: 'n8nExecuteWorkflow', title: 'Google Sheets Append Row', subtitle: 'n8n template', icon: <LuWorkflow />, category: 'n8n', initialData: { config: { workflowId: 'replace-workflow-id', payload: { sheetId: '', values: ['A','B','C'] }, pollIntervalMs: 1000, timeoutMs: 120000 } } },
  { id: 'tplWebhook', type: 'n8nCallWebhook', title: 'HTTP Generic Webhook', subtitle: 'n8n template', icon: <LuWebhook />, category: 'n8n', initialData: { config: { path: '/webhook/my-flow', payload: {}, headers: {} } } },
]

const TABS = [
  { id: 'control', label: 'Control' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'interaction', label: 'Interaction' },
  { id: 'data', label: 'Data' },
  { id: 'n8n', label: 'Integrations (n8n)' },
]

export const NodeLibrarySidebar: React.FC = () => {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<string>('control')

  const items = useMemo(() => {
    return ITEMS.filter((i) => i.category === tab && (
      i.title.toLowerCase().includes(query.toLowerCase()) ||
      (i.subtitle || '').toLowerCase().includes(query.toLowerCase())
    ))
  }, [query, tab])

  return (
    <div className="w-80 border-r bg-card h-full flex flex-col">
      <div className="p-3 border-b">
        <div className="relative">
          <LuSearch className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search nodes..."
            className="pl-8 h-9 w-full text-sm border rounded-md px-2"
          />
        </div>
        <div className="flex gap-1 mt-3 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx('px-3 py-1 rounded-md text-xs whitespace-nowrap border', tab === t.id ? 'bg-blue-100 text-blue-700 border-blue-300' : 'hover:bg-accent')}
            >{t.label}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-1 gap-1">
          {items.map(item => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => {
                const payload = { type: item.type, initialData: item.initialData || {} }
                e.dataTransfer.setData('application/reactflow', JSON.stringify(payload))
                e.dataTransfer.effectAllowed = 'move'
              }}
              className="flex items-center gap-2 p-3 rounded-lg border border-border bg-background hover:bg-accent cursor-grab active:cursor-grabbing transition-colors"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-600">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-foreground">{item.title}</div>
                <div className="text-xs text-muted-foreground truncate">{item.subtitle}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


