import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api, Stats } from '@/lib/api'
import { Users, Network, Monitor, Briefcase, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getStats()
      setStats(data)
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Stats endpoint not found - this is expected if backend does not implement /api/stats')
      } else {
        setError('Failed to load stats')
      }
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Profiles',
      value: stats.profiles ?? '-',
      description: 'Total browser profiles',
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Proxies',
      value: stats.proxies ?? '-',
      description: 'Active proxy servers',
      icon: Network,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Sessions',
      value: stats.sessions ?? '-',
      description: 'Active sessions',
      icon: Monitor,
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Jobs',
      value: stats.jobs ?? '-',
      description: 'Total jobs',
      icon: Briefcase,
      color: 'text-orange-600 dark:text-orange-400',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of NTG Login system</p>
      </div>

      {error && (
        <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : card.value}</div>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

