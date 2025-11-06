import { useEffect, useState, useRef } from 'react'
import { api, Session } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { io, Socket } from 'socket.io-client'
import { StopCircle, RefreshCw, Save } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000'

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    loadSessions()
    connectSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  const loadSessions = async () => {
    try {
      setLoading(true)
      const data = await api.getSessions()
      setSessions(data)
    } catch (error) {
      console.error('Failed to load sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const connectSocket = () => {
    try {
      const socket = io(API_BASE_URL, {
        transports: ['websocket', 'polling'],
      })

      socket.on('connect', () => {
        console.log('Socket connected')
      })

      socket.on('session:update', (data: Session) => {
        console.log('Session update:', data)
        setSessions((prev) => {
          const existing = prev.find((s) => s.id === data.id)
          if (existing) {
            return prev.map((s) => (s.id === data.id ? { ...s, ...data } : s))
          }
          return [...prev, data]
        })
      })

      socket.on('disconnect', () => {
        console.log('Socket disconnected')
      })

      socket.on('connect_error', (error) => {
        console.warn('Socket connection error:', error)
        // Socket.IO might not be available, continue without realtime updates
      })

      socketRef.current = socket
    } catch (error) {
      console.warn('Failed to connect socket:', error)
      // Continue without realtime updates
    }
  }

  const handleStop = async (id: number) => {
    if (!confirm('Are you sure you want to stop this session?')) return
    try {
      await api.stopSession(id)
      loadSessions()
    } catch (error) {
      console.error('Failed to stop session:', error)
      alert('Failed to stop session')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'running':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'stopped':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      case 'idle':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sessions</h1>
          <p className="text-muted-foreground">Monitor active browser sessions (realtime updates)</p>
        </div>
        <Button onClick={loadSessions} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Profile ID</TableHead>
              <TableHead>Proxy ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Started At</TableHead>
              <TableHead>Stopped At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No sessions found
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>{session.id}</TableCell>
                  <TableCell>{session.profile_id}</TableCell>
                  <TableCell>{session.proxy_id || '-'}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                        session.status
                      )}`}
                    >
                      {session.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {session.started_at
                      ? new Date(session.started_at).toLocaleString()
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {session.stopped_at
                      ? new Date(session.stopped_at).toLocaleString()
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {session.status === 'running' && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStop(session.id)}
                            title="Stop Session"
                          >
                            <StopCircle className="h-4 w-4 text-destructive" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={async ()=>{
                              try {
                                const base = (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:3000'
                                await fetch(`${base}/api/sessions/${session.id}/capture-tabs`, { method: 'POST' })
                                alert('Saved open tabs to profile')
                              } catch (e) {
                                alert('Failed to save tabs')
                              }
                            }}
                            title="Save Tabs to Profile"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

