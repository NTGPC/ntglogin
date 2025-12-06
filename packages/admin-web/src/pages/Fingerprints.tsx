import { useEffect, useState } from 'react'
import { api, Fingerprint } from '@/lib/api'
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
import { Plus, Edit, Trash2, Search, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

const fingerprintSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  data: z.any(),
})

type FingerprintFormData = z.infer<typeof fingerprintSchema>

export default function Fingerprints() {
  const [fingerprints, setFingerprints] = useState<Fingerprint[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFingerprint, setEditingFingerprint] = useState<Fingerprint | null>(null)
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FingerprintFormData>({
    resolver: zodResolver(fingerprintSchema),
    defaultValues: {
      name: '',
      data: {},
    },
  })

  const jsonInput = watch('data')

  useEffect(() => {
    loadFingerprints()
  }, [])

  useEffect(() => {
    if (editingFingerprint) {
      reset({
        name: editingFingerprint.name,
        data: editingFingerprint.data || {},
      })
    } else {
      reset({
        name: '',
        data: {},
      })
    }
    setJsonError(null)
  }, [editingFingerprint, reset])

  const loadFingerprints = async () => {
    try {
      setLoading(true)
      const data = await api.getFingerprints()
      setFingerprints(data)
    } catch (error) {
      console.error('Failed to load fingerprints:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateJson = (value: string): boolean => {
    try {
      if (!value.trim()) {
        setJsonError(null)
        setValue('data', {})
        return true
      }
      const parsed = JSON.parse(value)
      setJsonError(null)
      setValue('data', parsed, { shouldValidate: true })
      return true
    } catch (err) {
      setJsonError('Invalid JSON format')
      return false
    }
  }

  const onSubmit = async (data: FingerprintFormData) => {
    if (jsonError) {
      alert('Please fix JSON errors before submitting')
      return
    }

    try {
      if (editingFingerprint) {
        await api.updateFingerprint(editingFingerprint.id, data)
      } else {
        await api.createFingerprint(data)
      }
      setDialogOpen(false)
      setEditingFingerprint(null)
      reset()
      setJsonError(null)
      loadFingerprints()
    } catch (error: any) {
      if (error.response?.status === 404) {
        alert('Fingerprints endpoint not found - this is expected if backend does not implement /api/fingerprints')
      } else {
        console.error('Failed to save fingerprint:', error)
        alert('Failed to save fingerprint')
      }
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this fingerprint?')) return
    try {
      await api.deleteFingerprint(id)
      loadFingerprints()
    } catch (error) {
      console.error('Failed to delete fingerprint:', error)
      alert('Failed to delete fingerprint')
    }
  }

  const filteredFingerprints = fingerprints.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  const paginatedFingerprints = filteredFingerprints.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredFingerprints.length / itemsPerPage)

  const getFingerprintPreview = (data: any): string => {
    if (!data || typeof data !== 'object') return '-'
    try {
      return JSON.stringify(data, null, 2).slice(0, 100) + '...'
    } catch {
      return '-'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fingerprints</h1>
          <p className="text-muted-foreground">Manage browser fingerprints</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Fingerprint
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search fingerprints..."
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
                <TableHead>Name</TableHead>
                <TableHead>Data Preview</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : paginatedFingerprints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No fingerprints found
                </TableCell>
              </TableRow>
            ) : (
              paginatedFingerprints.map((fingerprint) => (
                <TableRow key={fingerprint.id}>
                  <TableCell>{fingerprint.id}</TableCell>
                  <TableCell className="font-medium">{fingerprint.name}</TableCell>
                  <TableCell className="max-w-md">
                    <pre className="text-xs overflow-auto text-muted-foreground">
                      {getFingerprintPreview(fingerprint.data)}
                    </pre>
                  </TableCell>
                  <TableCell>
                    {new Date(fingerprint.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingFingerprint(fingerprint)
                          setDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(fingerprint.id)}
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
          setEditingFingerprint(null)
          reset()
          setJsonError(null)
        }} className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFingerprint ? 'Edit Fingerprint' : 'Create Fingerprint'}
            </DialogTitle>
            <DialogDescription>
              {editingFingerprint ? 'Update fingerprint details' : 'Create a new browser fingerprint'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" {...register('name')} />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="data">Data (JSON) *</Label>
                <textarea
                  id="data"
                  {...register('data', {
                    setValueAs: (v) => {
                      if (!v) return {}
                      try {
                        return typeof v === 'string' ? JSON.parse(v) : v
                      } catch {
                        return {}
                      }
                    },
                  })}
                  onChange={(e) => validateJson(e.target.value)}
                  className="flex min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder='{"canvas": "abc123", "webgl": {...}, ...}'
                  defaultValue={
                    editingFingerprint?.data
                      ? JSON.stringify(editingFingerprint.data, null, 2)
                      : '{}'
                  }
                />
                {jsonError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{jsonError}</AlertDescription>
                  </Alert>
                )}
                {errors.data && (
                  <p className="text-sm text-destructive">{errors.data.message}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false)
                  setEditingFingerprint(null)
                  reset()
                  setJsonError(null)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!!jsonError}>
                {editingFingerprint ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

