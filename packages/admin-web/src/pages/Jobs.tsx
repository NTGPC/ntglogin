import { useEffect, useState } from 'react'
import { api, Job, Profile } from '@/lib/api'
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
import { Plus, Search } from 'lucide-react'

const jobSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  payload: z.any().optional(),
  profile_ids: z.array(z.number()).optional(),
  workflow_id: z.number().optional(),
})

type JobFormData = z.infer<typeof jobSchema>

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [workflows, setWorkflows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProfiles, setSelectedProfiles] = useState<number[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      type: '',
      payload: {},
      profile_ids: [],
      workflow_id: undefined,
    },
  })

  useEffect(() => {
    loadJobs()
    loadProfiles()
    loadWorkflows()
  }, [])

  const loadJobs = async () => {
    try {
      setLoading(true)
      const data = await api.getJobs()
      setJobs(data)
    } catch (error) {
      console.error('Failed to load jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProfiles = async () => {
    try {
      const data = await api.getProfiles()
      setProfiles(data)
    } catch (error) {
      console.error('Failed to load profiles:', error)
    }
  }

  const loadWorkflows = async () => {
    try {
      const data = await api.getWorkflows()
      setWorkflows(data)
    } catch (error) {
      console.warn('Workflows endpoint not found, continuing without workflows')
    }
  }

  const onSubmit = async (data: JobFormData) => {
    try {
      // Build payload - include workflow_id inside payload if present
      const jobPayload: any = data.payload || {}
      if (data.workflow_id) {
        jobPayload.workflow_id = data.workflow_id
      }

      const payload: any = {
        type: data.type,
        payload: jobPayload,
      }

      if (selectedProfiles.length > 0) {
        payload.profile_ids = selectedProfiles
      }

      await api.createJob(payload)
      setDialogOpen(false)
      setSelectedProfiles([])
      reset()
      loadJobs()
    } catch (error) {
      console.error('Failed to create job:', error)
      alert('Failed to create job')
    }
  }

  const toggleProfile = (profileId: number) => {
    setSelectedProfiles((prev) =>
      prev.includes(profileId)
        ? prev.filter((id) => id !== profileId)
        : [...prev, profileId]
    )
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'queued':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'done':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const filteredJobs = jobs.filter(
    (j) =>
      j.type.toLowerCase().includes(search.toLowerCase()) ||
      j.status.toLowerCase().includes(search.toLowerCase())
  )

  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Jobs</h1>
          <p className="text-muted-foreground">Manage background jobs</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Job
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Attempts</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : paginatedJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No jobs found
                </TableCell>
              </TableRow>
            ) : (
              paginatedJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>{job.id}</TableCell>
                  <TableCell className="font-medium">{job.type}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                        job.status
                      )}`}
                    >
                      {job.status}
                    </span>
                  </TableCell>
                  <TableCell>{job.attempts}</TableCell>
                  <TableCell>
                    {new Date(job.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
          setSelectedProfiles([])
          reset()
        }} className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Job</DialogTitle>
            <DialogDescription>Create a new background job</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <select
                  id="type"
                  {...register('type')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select job type</option>
                  <option value="run_workflow">Run Workflow</option>
                  <option value="run_automation">Run Automation</option>
                  <option value="test_task">Test Task</option>
                </select>
                {errors.type && (
                  <p className="text-sm text-destructive">{errors.type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Select Profiles (Multiple)</Label>
                <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
                  {profiles.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No profiles available</p>
                  ) : (
                    profiles.map((profile) => (
                      <label
                        key={profile.id}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-accent p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedProfiles.includes(profile.id)}
                          onChange={() => toggleProfile(profile.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <span className="text-sm">
                          {profile.name} (ID: {profile.id})
                        </span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selected: {selectedProfiles.length} profile(s)
                </p>
              </div>

              {workflows.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="workflow_id">Workflow</Label>
                  <select
                    id="workflow_id"
                    {...register('workflow_id', { valueAsNumber: true })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">None</option>
                    {workflows.map((workflow) => (
                      <option key={workflow.id} value={workflow.id}>
                        {workflow.name || `Workflow ${workflow.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="payload">Payload (JSON)</Label>
                <textarea
                  id="payload"
                  {...register('payload', {
                    setValueAs: (v) => {
                      if (!v) return {}
                      try {
                        return typeof v === 'string' ? JSON.parse(v) : v
                      } catch {
                        return {}
                      }
                    },
                  })}
                  className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder='{"url": "https://example.com", ...}'
                  defaultValue="{}"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false)
                  setSelectedProfiles([])
                  reset()
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Create Job</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

