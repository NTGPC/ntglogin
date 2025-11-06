import React, { useEffect, useMemo, useState } from 'react'
import Editor from '@monaco-editor/react'

type Props = {
  selectedNode: any | null
  onUpdate: (nodeId: string, data: any) => void
}

export const RightInspector: React.FC<Props> = ({ selectedNode, onUpdate }) => {
  const [text, setText] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedNode) return setText('')
    setError(null)
    const json = JSON.stringify(selectedNode.data || {}, null, 2)
    setText(json)
  }, [selectedNode])

  const parsed = useMemo(() => {
    if (!text) return null
    try {
      const obj = JSON.parse(text)
      setError(null)
      return obj
    } catch (e: any) {
      setError(e?.message || 'Invalid JSON')
      return null
    }
  }, [text])

  if (!selectedNode) {
    return (
      <div className="w-96 border-l bg-card h-full p-4 text-sm text-muted-foreground">
        Select a node to edit JSON.
      </div>
    )
  }

  return (
    <div className="w-96 border-l bg-card h-full flex flex-col">
      <div className="p-3 border-b">
        <div className="text-sm font-semibold">Inspector (JSON)</div>
        <div className="text-xs text-muted-foreground">id: {selectedNode.id} · type: {selectedNode.type}</div>
        {error && <div className="mt-2 text-xs text-red-600">Invalid JSON: {error}</div>}
        {!error && <div className="mt-2 text-xs text-green-600">JSON valid</div>}
        <div className="mt-2 flex gap-2">
          <button
            className="px-2 py-1 text-xs border rounded"
            onClick={() => {
              setText(JSON.stringify(selectedNode.data || {}, null, 2))
            }}
          >Reset to defaults</button>
          <button
            className="px-2 py-1 text-xs border rounded"
            onClick={() => setText((t) => {
              try { return JSON.stringify(JSON.parse(t), null, 2) } catch { return t }
            })}
          >Format JSON</button>
          <button
            className="px-2 py-1 text-xs border rounded bg-blue-600 text-white"
            onClick={() => {
              if (!error && parsed) {
                onUpdate(selectedNode.id, parsed)
              }
            }}
            disabled={!!error}
          >Apply</button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="json"
          language="json"
          value={text}
          onChange={(v) => setText(v || '')}
          options={{ minimap: { enabled: false }, fontSize: 12 }}
        />
      </div>
    </div>
  )
}


