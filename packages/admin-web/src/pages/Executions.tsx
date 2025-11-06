import { useEffect, useState, useRef } from 'react'
import { api, JobExecution } from '@/lib/api'
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
import { Download, Eye, RefreshCw, ExternalLink } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000'

export default function Executions() {
  const [executions, setExecutions] = useState<JobExecution[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJobId, setSelectedJobId] = useState<string>('')
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    loadExecutions()
    connectSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [selectedJobId])

  const loadExecutions = async () => {
    try {
      setLoading(true)
      const jobId = selectedJobId ? parseInt(selectedJobId) : undefined
      const data = await api.getJobExecutions(jobId)
      setExecutions(data)
    } catch (error) {
      console.error('Failed to load executions:', error)
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

      socket.on('jobExecution:update', (data: JobExecution) => {
        console.log('Job execution update:', data)
        setExecutions((prev) => {
          const existing = prev.find((e) => e.id === data.id)
          if (existing) {
            return prev.map((e) => (e.id === data.id ? { ...e, ...data } : e))
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

  const getScreenshotUrl = (result: any): string | null => {
    if (!result?.screenshot) return null
    if (result.screenshot.startsWith('http')) {
      return result.screenshot
    }
    // Assume relative path
    return `${API_BASE_URL}/${result.screenshot}`
  }

  const downloadScreenshot = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename || 'screenshot.png'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Job Executions</h1>
          <p className="text-muted-foreground">
            Monitor job executions with realtime status updates
          </p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="number"
            placeholder="Filter by Job ID"
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="flex h-10 w-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <Button onClick={loadExecutions} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Job ID</TableHead>
              <TableHead>Profile ID</TableHead>
              <TableHead>Session ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Started At</TableHead>
              <TableHead>Completed At</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : executions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  No executions found
                </TableCell>
              </TableRow>
            ) : (
              executions.map((execution) => {
                const screenshotUrl = getScreenshotUrl(execution.result)
                return (
                  <TableRow key={execution.id}>
                    <TableCell>{execution.id}</TableCell>
                    <TableCell>{execution.job_id}</TableCell>
                    <TableCell>{execution.profile_id}</TableCell>
                    <TableCell>{execution.session_id || '-'}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                          execution.status
                        )}`}
                      >
                        {execution.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {execution.started_at
                        ? new Date(execution.started_at).toLocaleString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {execution.completed_at
                        ? new Date(execution.completed_at).toLocaleString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {screenshotUrl ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(screenshotUrl, '_blank')}
                            title="View Screenshot"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              downloadScreenshot(
                                screenshotUrl,
                                `screenshot-${execution.id}.png`
                              )
                            }
                            title="Download Screenshot"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : execution.result ? (
                        <span className="text-xs text-muted-foreground">Has result</span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {execution.error ? (
                        <span
                          className="text-xs text-destructive"
                          title={execution.error}
                        >
                          {execution.error.slice(0, 50)}...
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

