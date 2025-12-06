import { useEffect, useState } from 'react'
import { api, Proxy } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus, Edit, Trash2, Search, CheckCircle, AlertCircle, Zap } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { parseProxyString } from '@/lib/utils'

const proxySchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.number().min(1).max(65535),
  username: z.string().optional(),
  password: z.string().optional(),
  type: z.enum(['http', 'socks5']),
  active: z.boolean().optional(),
})

type ProxyFormData = z.infer<typeof proxySchema>

export default function Proxies() {
  const [proxies, setProxies] = useState<Proxy[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProxy, setEditingProxy] = useState<Proxy | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [changePassword, setChangePassword] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [feedback, setFeedback] = useState<null | { type: 'success' | 'error'; message: string }>(null)
  const [proxyString, setProxyString] = useState('')
  const [loadingIds, setLoadingIds] = useState<number[]>([])
  const itemsPerPage = 10

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProxyFormData>({
    resolver: zodResolver(proxySchema),
    defaultValues: {
      host: '',
      port: 8080,
      username: '',
      password: '',
      type: 'http',
      active: true,
    },
  })

  useEffect(() => {
    loadProxies()
  }, [])

  useEffect(() => {
    if (editingProxy) {
      reset({
        host: editingProxy.host,
        port: editingProxy.port,
        username: editingProxy.username || '',
        password: '', // Don't populate password for security
        type: editingProxy.type as 'http' | 'socks5',
        active: editingProxy.active,
      })
      setChangePassword(false)
      setShowPassword(false)
      setProxyString('') // Clear proxy string when editing
    } else {
      reset({
        host: '',
        port: 8080,
        username: '',
        password: '',
        type: 'http',
        active: true,
      })
      setChangePassword(true)
      setShowPassword(false)
      setProxyString('') // Clear proxy string for new proxy
    }
  }, [editingProxy, reset])

  const loadProxies = async () => {
    try {
      setLoading(true)
      const data = await api.getProxies()
      setProxies(data)
    } catch (error) {
      console.error('Failed to load proxies:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: ProxyFormData) => {
    try {
      const payload: any = {
        host: data.host,
        port: data.port,
        type: data.type,
        active: data.active ?? true,
      }
      
      // Only include username/password if provided (send raw, backend will encrypt)
      if (data.username) payload.username = data.username
      if (changePassword && data.password) payload.password = data.password

      if (editingProxy) {
        await api.updateProxy(editingProxy.id, payload)
        setFeedback({ type: 'success', message: 'Proxy updated successfully' })
      } else {
        const created = await api.createProxy(payload)
        setFeedback({ type: 'success', message: 'Proxy created successfully. Checking live…' })
        // Auto check liveness after create
        try {
          const updatedProxy = await api.checkProxy(created.id)
          setProxies(prev => prev.map(p => p.id === created.id ? updatedProxy : p))
        } catch {}
      }
      setDialogOpen(false)
      setEditingProxy(null)
      setProxyString('')
      reset()
      loadProxies()
      setTimeout(() => setFeedback(null), 3000)
    } catch (error: any) {
      console.error('Failed to save proxy:', error)
      let errorMessage = 'Failed to save proxy'
      
      // Provide more specific error messages
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error?.message) {
        errorMessage = error.message
      } else if (error?.code === 'ECONNREFUSED' || error?.message?.includes('Network Error')) {
        errorMessage = 'Cannot connect to backend server. Please ensure backend is running on port 3000.'
      }
      
      setFeedback({ type: 'error', message: errorMessage })
      setTimeout(() => setFeedback(null), 5000)
    }
  }
  // Hàm render trạng thái (Hiển thị dựa trên DB)
  const renderStatus = (status?: string) => {
    if (status === 'live') {
      return <span className="px-2 py-1 rounded bg-green-100 text-green-800 font-bold dark:bg-green-900 dark:text-green-200">Live 🟢</span>;
    }
    if (status === 'die') {
      return <span className="px-2 py-1 rounded bg-red-100 text-red-800 font-bold dark:bg-red-900 dark:text-red-200">Not Live 🔴</span>;
    }
    if (status === 'checking') {
      return <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Checking... ⏳</span>;
    }
    return <span className="text-gray-400">-</span>;
  };

  // Hàm xử lý nút Check
  const handleCheckProxy = async (id: number) => {
    // Cập nhật tạm UI sang 'checking'
    setProxies(prev => prev.map(p => p.id === id ? { ...p, status: 'checking' } : p));
    setLoadingIds(prev => [...prev, id]);

    try {
      // Gọi API check (Server sẽ check và lưu DB)
      const res = await api.checkProxy(id);
      
      // Server trả về proxy với status mới (Live/Die) -> Cập nhật vào List
      const updatedProxy = res;
      setProxies(prev => prev.map(p => p.id === id ? updatedProxy : p));
    } catch (error) {
      console.error("Check failed", error);
      // Nếu lỗi mạng thì trả về status cũ hoặc die
      setProxies(prev => prev.map(p => p.id === id ? { ...p, status: 'die' } : p));
    } finally {
      setLoadingIds(prev => prev.filter(pid => pid !== id));
    }
  };


  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this proxy?')) return
    try {
      await api.deleteProxy(id)
      loadProxies()
    } catch (error) {
      console.error('Failed to delete proxy:', error)
      alert('Failed to delete proxy')
    }
  }

  const handleProxyStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProxyString(e.target.value)
  }

  const parseProxyInput = (value?: string) => {
    const inputValue = value ?? proxyString
    if (!inputValue.trim()) return

    const parsed = parseProxyString(inputValue)
    if (parsed) {
      setValue('host', parsed.host)
      setValue('port', parsed.port)
      setValue('username', parsed.username)
      setValue('password', parsed.password)
      setChangePassword(true) // Enable password field
      setProxyString('') // Clear input after parsing
      setFeedback({ type: 'success', message: 'Proxy parsed successfully!' })
      setTimeout(() => setFeedback(null), 2000)
    } else if (inputValue.trim() && inputValue.includes(':')) {
      // Show error if format seems wrong
      setFeedback({ type: 'error', message: 'Invalid proxy format. Expected: host:port:username:password' })
      setTimeout(() => setFeedback(null), 3000)
    }
  }

  const handleProxyStringKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      // Use current value from input to ensure we have the latest
      const value = (e.target as HTMLInputElement).value
      parseProxyInput(value)
    }
  }

  const filteredProxies = proxies.filter((p) =>
    `${p.host}:${p.port}`.toLowerCase().includes(search.toLowerCase()) ||
    p.type.toLowerCase().includes(search.toLowerCase())
  )

  const paginatedProxies = filteredProxies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredProxies.length / itemsPerPage)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Proxies</h1>
          <p className="text-muted-foreground">Manage proxy servers</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Proxy
        </Button>
      </div>

      {feedback && (
        <Alert
          variant={feedback.type === 'error' ? 'destructive' : 'default'}
          className={
            feedback.type === 'error'
              ? ''
              : 'border-green-500 bg-green-50 dark:bg-green-950'
          }
        >
          {feedback.type === 'error' ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          )}
          <AlertDescription>{feedback.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search proxies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table className="w-full text-left border-collapse whitespace-nowrap">
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Host:Port</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
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
            ) : paginatedProxies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No proxies found
                </TableCell>
              </TableRow>
            ) : (
              paginatedProxies.map((proxy) => (
                <TableRow key={proxy.id}>
                  <TableCell>{proxy.id}</TableCell>
                  <TableCell className="font-medium">{proxy.host}:{proxy.port}</TableCell>
                  <TableCell>{proxy.type}</TableCell>
                  <TableCell>{proxy.username || '-'}</TableCell>
                  <TableCell>
                    {renderStatus(proxy.status)}
                  </TableCell>
                  <TableCell>
                    {new Date(proxy.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingProxy(proxy)
                          setDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCheckProxy(proxy.id)}
                        title="Check live"
                        disabled={loadingIds.includes(proxy.id)}
                      >
                        {loadingIds.includes(proxy.id) ? (
                          <span className="animate-spin">⏳</span>
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(proxy.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => {
          setDialogOpen(false)
          setEditingProxy(null)
          setProxyString('')
          reset()
        }}>
          <DialogHeader>
            <DialogTitle>{editingProxy ? 'Edit Proxy' : 'Create Proxy'}</DialogTitle>
            <DialogDescription>
              {editingProxy ? 'Update proxy details' : 'Create a new proxy server'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              {/* Quick Proxy Input - Parse from string format */}
              <div className="space-y-2 rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <Label htmlFor="proxyString" className="font-semibold text-base">
                    Quick Proxy Input
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Format: <code className="bg-background px-1 py-0.5 rounded text-xs font-mono">host:port:username:password</code>
                </p>
                <div className="flex gap-2">
                  <Input
                    id="proxyString"
                    type="text"
                    placeholder="130.180.239.158:6797:rdrokwko:9bkvu1hxau7g"
                    value={proxyString}
                    onChange={handleProxyStringChange}
                    onKeyDown={handleProxyStringKeyDown}
                    onBlur={parseProxyInput}
                    className="font-mono text-sm flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => parseProxyInput()}
                    disabled={!proxyString.trim()}
                    className="whitespace-nowrap"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Parse
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Paste proxy string và nhấn Enter hoặc nút Parse để tự động điền form
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Hoặc điền thủ công</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="host">Host *</Label>
                <Input id="host" {...register('host')} />
                {errors.host && (
                  <p className="text-sm text-destructive">{errors.host.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Port *</Label>
                <Input
                  id="port"
                  type="number"
                  {...register('port', { valueAsNumber: true })}
                />
                {errors.port && (
                  <p className="text-sm text-destructive">{errors.port.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <select
                  id="type"
                  {...register('type')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="http">HTTP</option>
                  <option value="socks5">SOCKS5</option>
                </select>
                {errors.type && (
                  <p className="text-sm text-destructive">{errors.type.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" {...register('username')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                {editingProxy && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      id="change_password"
                      type="checkbox"
                      checked={changePassword}
                      onChange={(e) => setChangePassword(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="change_password" className="cursor-pointer">
                      Change password
                    </label>
                  </div>
                )}
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder={editingProxy ? 'Leave empty to keep current' : ''}
                    disabled={editingProxy ? !changePassword : false}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {editingProxy
                    ? 'Leave empty to keep current password. Password will be encrypted by the backend.'
                    : 'Password will be encrypted by the backend'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="active"
                  {...register('active')}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="active" className="cursor-pointer">
                  Active
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false)
                  setEditingProxy(null)
                  setProxyString('')
                  reset()
                }}
              >
                Cancel
              </Button>
              <Button type="submit">{editingProxy ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

