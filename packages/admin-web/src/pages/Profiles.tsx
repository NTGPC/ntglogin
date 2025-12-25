import { useEffect, useState } from 'react'
import { api, apiClient, Profile, Proxy } from '@/lib/api'
import { Button } from '@/components/ui/button'
import ImportAccountModal from '@/components/ImportAccountModal'
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
import { Plus, Edit, Trash2, Play, Search } from 'lucide-react'
import RandomizeButton from '@/components/ProfileCreateModal/RandomFingerprint'
import GPUSelect from '@/components/GPUSelect'
import { USER_AGENT_LIBRARY } from '@/constants/user-agents'
import { getWebGLRenderersByOS } from '@/constants/webgl-renderers'
import { EUROPEAN_TIMEZONES } from '@/constants/european-timezones'
import '@/styles/profile-modal.css'

const fpSchema = z.object({
    userAgent: z.string().optional(),
    viewport: z
        .object({
            width: z.number().int().positive().default(1366),
            height: z.number().int().positive().default(768),
            deviceScaleFactor: z.number().min(0.5).max(5).default(1),
        })
        .optional(),
    locale: z.string().optional(),
    timezoneId: z.string().optional(),
    geolocation: z
        .object({
            longitude: z.number().min(-180).max(180),
            latitude: z.number().min(-90).max(90),
            accuracy: z.number().min(0).max(1000).optional(),
        })
        .optional(),
    colorScheme: z.enum(['light', 'dark']).optional(),
    isMobile: z.boolean().optional(),
    hasTouch: z.boolean().optional(),
    reducedMotion: z.enum(['no-preference', 'reduce']).optional(),
    permissions: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    proxyId: z.union([z.string(), z.number()]).optional(),
    notes: z.string().optional(),
    canvas: z
        .object({
            mode: z.enum(['real', 'noise', 'off', 'block']).default('real'),
            seed: z.string().optional(),
        })
        .optional(),
    clientRects: z
        .object({
            mode: z.enum(['off', 'noise']).default('off'),
        })
        .optional(),
    webgl: z
        .object({
            image: z.enum(['off', 'noise']).optional(),
            metadata: z.enum(['mask', 'real']).optional(),
            vendor: z.string().optional(),
            renderer: z.string().optional(),
        })
        .optional(),
    audioContext: z
        .object({
            mode: z.enum(['off', 'noise']).default('off'),
        })
        .optional(),
})

const profileSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    user_agent: z.string().optional(),
    fingerprint: fpSchema.optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function Profiles() {
    const SHOW_WORKFLOWS = false
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [proxies, setProxies] = useState<Proxy[]>([])
    const [workflows, setWorkflows] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [startDialogOpen, setStartDialogOpen] = useState(false)
    const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
    const [startingProfile, setStartingProfile] = useState<Profile | null>(null)
    const [selectedProxyId, setSelectedProxyId] = useState<number | undefined>(undefined)
    const [currentPage, setCurrentPage] = useState(1)
    const [fingerprintText, setFingerprintText] = useState('')
    const [runWorkflowDialogOpen, setRunWorkflowDialogOpen] = useState(false)
    const [runWorkflowProfileId, setRunWorkflowProfileId] = useState<number | null>(null)
    const [runWorkflowId, setRunWorkflowId] = useState<number | null>(null)
    const [runWorkflowVars, setRunWorkflowVars] = useState<{ email?: string; password?: string }>({})
    const [runWorkflowProfileIds, setRunWorkflowProfileIds] = useState<number[]>([])
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)
    const presets = [
        {
            label: 'Windows/Chrome US',
            value: {
                userAgent:
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                viewport: { width: 1366, height: 768, deviceScaleFactor: 1 },
                locale: 'en-US',
                timezoneId: 'America/Los_Angeles',
                languages: ['en-US', 'en'],
                colorScheme: 'light' as const,
                isMobile: false,
                hasTouch: false,
                reducedMotion: 'no-preference' as const,
            },
        },
        {
            label: 'Mac/Safari JP',
            value: {
                userAgent:
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
                viewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
                locale: 'ja-JP',
                timezoneId: 'Asia/Tokyo',
                languages: ['ja-JP', 'ja'],
                colorScheme: 'light' as const,
                isMobile: false,
                hasTouch: false,
                reducedMotion: 'no-preference' as const,
            },
        },
    ]

    // JSON preview only; not editing individual JSON fields anymore
    const [selectedIds, setSelectedIds] = useState<number[]>([])
    const [profileProxyMap, setProfileProxyMap] = useState<Record<number, number | undefined>>(() => {
        try {
            const raw = localStorage.getItem('profileProxyMap')
            return raw ? JSON.parse(raw) : {}
        } catch {
            return {}
        }
    })
    const [bulkProxyId, setBulkProxyId] = useState<number | undefined>(undefined)
    const [bulkWorkflowId, setBulkWorkflowId] = useState<number | undefined>(undefined)
    const [driverMap, setDriverMap] = useState<Record<number, string>>({})
    const [profileWorkflowsMap, setProfileWorkflowsMap] = useState<Record<number, any[]>>({})
    const itemsPerPage = 10

    // Extended create-profile configuration states (UI-only)
    const [uaEditable, setUaEditable] = useState(false)
    const [osName, setOsName] = useState<string>('Windows 10')
    const [osArch, setOsArch] = useState<'x86' | 'x64'>('x64')
    const [browserVersion, setBrowserVersion] = useState<string>('Auto')
    const [screenRes, setScreenRes] = useState<string>('1920x1080')
    const [canvasMode, setCanvasMode] = useState<'Noise' | 'Off' | 'Block'>('Noise')
    const [clientRectsMode, setClientRectsMode] = useState<'Off' | 'Noise'>('Noise')
    const [audioCtxMode, setAudioCtxMode] = useState<'Off' | 'Noise'>('Noise')
    const [webglImageMode, setWebglImageMode] = useState<'Off' | 'Noise'>('Noise')
    const [webglMetaMode, setWebglMetaMode] = useState<'Mask' | 'Real'>('Mask')
    const [webglVendor, setWebglVendor] = useState<string>('')
    const [webglRenderer, setWebglRenderer] = useState<string>('')
    const [geoEnabled, setGeoEnabled] = useState(true)
    const [userAgents, setUserAgents] = useState<any[]>([])
    const [webglRenderers, setWebglRenderers] = useState<any[]>([])
    const [webrtcMainIP, setWebrtcMainIP] = useState(true)
    const [fingerprintPresets, setFingerprintPresets] = useState<any[]>([])
    const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null)
    const [proxyMode, setProxyMode] = useState<'manual' | 'library'>('manual')
    const [proxyManual, setProxyManual] = useState<{ host?: string; port?: number; username?: string; password?: string }>({})
    const [proxyRefId, setProxyRefId] = useState<string>('')
    const [macAddr, setMacAddr] = useState<string>(() => {
        // Auto-generate MAC Address ngay khi component mount
        const b = new Uint8Array(6)
        for (let i = 0; i < 6; i++) b[i] = Math.floor(Math.random() * 256)
        b[0] = (b[0] | 0x02) & 0xfe // local-admin & unicast
        return Array.from(b).map((v) => v.toString(16).padStart(2, '0')).join(':')
    })
    // Navigator Object - Thông số còn thiếu (Auto Random)
    const [hardwareConcurrency, setHardwareConcurrency] = useState<number>(() => {
        // Random CPU cores: 2-32 (không theo quy luật)
        const cores = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32]
        return cores[Math.floor(Math.random() * cores.length)]
    })
    const [deviceMemory, setDeviceMemory] = useState<number>(() => {
        // Random RAM: 2-64 GB (không theo quy luật)
        const ram = [2, 4, 6, 8, 12, 16, 24, 32, 48, 64]
        return ram[Math.floor(Math.random() * ram.length)]
    })
    const [languages, setLanguages] = useState<string[]>(['en-US', 'en']) // Language array
    const [timezone, setTimezone] = useState<string>('Europe/London') // Timezone
    const [language, setLanguage] = useState<string>('en-US') // Primary language

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema as any),
        defaultValues: {
            name: '',
            user_agent: '',
            fingerprint: undefined,
        },
    })

    useEffect(() => {
        loadProfiles()
        loadProxies()
        loadWorkflows() // Luôn load workflows để hiển thị dropdown
        if (SHOW_WORKFLOWS) loadAssignments()
        loadUserAgents()
        loadWebglRenderers()
        loadFingerprintPresets()
    }, [])

    const loadFingerprintPresets = async () => {
        try {
            const data = await api.getFingerprintPresets()
            setFingerprintPresets(data)
        } catch (error) {
            console.error('Failed to load Fingerprint Presets:', error)
        }
    }

    const handlePresetChange = async (presetId: number | null) => {
        setSelectedPresetId(presetId)
        if (!presetId) return

        try {
            const preset = await api.getFingerprintPresetById(presetId)
            if (!preset) return

            // Populate all form fields from preset
            const input = document.getElementById('user_agent') as HTMLInputElement | null
            if (input) input.value = preset.userAgent || ''

            setOsName(preset.os || 'Windows')
            setBrowserVersion(preset.browserVersion ? String(preset.browserVersion) : 'Auto')
            setScreenRes(`${preset.screenWidth || 1920}x${preset.screenHeight || 1080}`)
            setWebglVendor(preset.webglVendor || '')
            setWebglRenderer(preset.webglRenderer || '')
            setHardwareConcurrency(preset.hardwareConcurrency || 8)
            setDeviceMemory(preset.deviceMemory || 8)
            setLanguages(preset.languages || ['en-US', 'en'])
            setTimezone(preset.timezone || 'Europe/London')
            setCanvasMode(preset.canvasMode === 'noise' ? 'Noise' : preset.canvasMode === 'mask' ? 'Noise' : 'Off')
            setAudioCtxMode(preset.audioContextMode === 'noise' ? 'Noise' : 'Off')
            setWebglMetaMode(preset.webglMetadataMode === 'mask' ? 'Mask' : 'Real')
            setWebrtcMainIP(preset.webrtcMode === 'fake')
            setGeoEnabled(preset.geolocationMode === 'fake')

            console.log('[Profiles] Preset loaded:', preset.name)
        } catch (error) {
            console.error('Failed to load preset:', error)
            alert('Failed to load preset')
        }
    }

    const loadUserAgents = async () => {
        try {
            // NEW: Load từ API library thay vì constants
            const libraryUAs = await api.getUserAgentLibrary({ minVersion: 130, maxVersion: 140 })

            // Fallback to constants nếu API trống
            if (libraryUAs.length === 0) {
                const fallbackUAs = USER_AGENT_LIBRARY.filter(ua => {
                    const chromeMatch = ua.value.match(/Chrome\/(\d+)/)
                    if (chromeMatch) {
                        const version = parseInt(chromeMatch[1], 10)
                        return version >= 130 && version <= 140
                    }
                    return false
                })
                setUserAgents(fallbackUAs)
                console.log(`[Profiles] Using fallback library: ${fallbackUAs.length} User-Agents`)
            } else {
                // Map API response to expected format
                const mappedUAs = libraryUAs.map((ua: any) => ({
                    id: ua.id,
                    name: ua.name,
                    value: ua.value,
                    os: ua.os,
                    platform: ua.platform,
                    browserVersion: ua.browserVersion,
                }))
                setUserAgents(mappedUAs)
                console.log(`[Profiles] Loaded ${mappedUAs.length} User-Agents from API library (Chrome 130-140)`)
            }
        } catch (error) {
            // Fallback to constants
            const libraryUAs = USER_AGENT_LIBRARY.filter(ua => {
                const chromeMatch = ua.value.match(/Chrome\/(\d+)/)
                if (chromeMatch) {
                    const version = parseInt(chromeMatch[1], 10)
                    return version >= 130 && version <= 140
                }
                return false
            })
            setUserAgents(libraryUAs)
            console.error('[Profiles] Failed to load User-Agent library, using constants:', error)
        }
    }

    const loadWebglRenderers = async () => {
        try {
            // NEW: Load từ API library
            const libraryGPUs = await api.getWebglRendererLibrary()

            if (libraryGPUs.length > 0) {
                // Map API response to expected format
                const mappedGPUs = libraryGPUs.map((gpu: any) => ({
                    id: gpu.id,
                    vendor: gpu.vendor,
                    renderer: gpu.renderer,
                    os: gpu.os || 'Windows',
                }))
                setWebglRenderers(mappedGPUs)
                console.log(`[Profiles] Loaded ${mappedGPUs.length} WebGL Renderers from API library`)
            } else {
                // Fallback to constants
                const fallbackGPUs = getWebGLRenderersByOS('Windows').concat(getWebGLRenderersByOS('macOS'))
                setWebglRenderers(fallbackGPUs)
                console.log(`[Profiles] Using fallback library: ${fallbackGPUs.length} WebGL Renderers`)
            }
        } catch (error) {
            // Fallback to constants
            const fallbackGPUs = getWebGLRenderersByOS('Windows').concat(getWebGLRenderersByOS('macOS'))
            setWebglRenderers(fallbackGPUs)
            console.error('[Profiles] Failed to load WebGL Renderer library, using constants:', error)
        }
    }

    // Extract browser version từ User Agent string
    const extractBrowserVersion = (uaString: string): number | null => {
        const chromeMatch = uaString.match(/Chrome\/(\d+)/)
        if (chromeMatch) {
            return parseInt(chromeMatch[1], 10)
        }
        return null
    }

    // Tạo số ngẫu nhiên hợp lệ cho browserVersion (130-140) - phải match với backend validation
    const generateRandomBrowserVersion = (): number => {
        const minVersion = 130
        const maxVersion = 140 // Backend chỉ chấp nhận max 140
        return Math.floor(Math.random() * (maxVersion - minVersion + 1)) + minVersion
    }

    const handleUserAgentChange = (uaValue: string) => {
        if (!uaValue) return

        // Cập nhật User-Agent trong form
        const input = document.getElementById('user_agent') as HTMLInputElement | null
        if (input) {
            input.value = uaValue
            setUaEditable(true)
        }

        // Auto-extract và set Browser Version từ User Agent
        const version = extractBrowserVersion(uaValue)
        if (version && version >= 130 && version <= 140) {
            setBrowserVersion(String(version))
        }

        // Tự động đồng bộ OS và WebGL Renderer nếu User-Agent có OS info
        const selectedUA = USER_AGENT_LIBRARY.find(ua => ua.value === uaValue) || userAgents.find(ua => ua.value === uaValue)
        if (selectedUA && selectedUA.os) {
            // Map OS từ user_agents.json sang format của form
            const osMap: Record<string, string> = {
                'Windows': 'Windows',
                'Windows 10': 'Windows 10',
                'Windows 11': 'Windows 11',
                'Mac OS': 'macOS',
                'macOS': 'macOS',
                'Linux': 'Linux',
                'Android': 'Android',
                'iOS': 'iOS'
            }
            const mappedOS = osMap[selectedUA.os] || 'Windows'
            setOsName(mappedOS)

            // Auto-update WebGL Renderer dựa trên OS mới
            const compatibleGPUs = getWebGLRenderersByOS(mappedOS);
            if (compatibleGPUs.length > 0) {
                const randomGPU = compatibleGPUs[Math.floor(Math.random() * compatibleGPUs.length)];
                setWebglRenderer(randomGPU.renderer);
                setWebglVendor(randomGPU.vendor);
            }

            console.log(`[Profiles] ✅ Auto-synced OS: ${mappedOS}, Browser Version: ${version}, WebGL Renderer based on User-Agent`)
        } else {
            // Nếu không tìm thấy trong library, detect OS từ UA string
            const uaLower = uaValue.toLowerCase()
            if (uaLower.includes('windows')) {
                setOsName('Windows')
                // NEW: Use API library if available, fallback to constants
                const compatibleGPUs = webglRenderers.length > 0
                    ? webglRenderers.filter((gpu: any) => !gpu.os || gpu.os === 'Windows')
                    : getWebGLRenderersByOS('Windows');
                if (compatibleGPUs.length > 0) {
                    const randomGPU = compatibleGPUs[Math.floor(Math.random() * compatibleGPUs.length)];
                    setWebglRenderer(randomGPU.renderer);
                    setWebglVendor(randomGPU.vendor);
                }
            } else if (uaLower.includes('macintosh') || uaLower.includes('mac os')) {
                setOsName('macOS')
                // NEW: Use API library if available, fallback to constants
                const compatibleGPUs = webglRenderers.length > 0
                    ? webglRenderers.filter((gpu: any) => !gpu.os || gpu.os === 'macOS')
                    : getWebGLRenderersByOS('macOS');
                if (compatibleGPUs.length > 0) {
                    const randomGPU = compatibleGPUs[Math.floor(Math.random() * compatibleGPUs.length)];
                    setWebglRenderer(randomGPU.renderer);
                    setWebglVendor(randomGPU.vendor);
                }
            }
        }
    }

    // Get current User-Agent value để sync với dropdown
    const getCurrentUserAgent = () => {
        const input = document.getElementById('user_agent') as HTMLInputElement | null
        return input?.value || ''
    }

    useEffect(() => {
        if (!SHOW_WORKFLOWS) return
        if (profiles.length > 0) {
            loadAssignments()
        }
    }, [profiles])

    const loadProxies = async () => {
        try {
            const data = await api.getProxies()
            setProxies(data)
        } catch (error) {
            console.error('Failed to load proxies:', error)
        }
    }

    const loadWorkflows = async () => {
        try {
            // Chỉ lấy id và name để dropdown nhẹ hơn
            const workflows = await api.getWorkflows('id,name')
            setWorkflows(Array.isArray(workflows) ? workflows : [])
            console.log('Đã tải thành công workflows:', workflows)
        } catch (error) {
            console.error('Failed to load workflows:', error)
            setWorkflows([])
        }
    }

    const loadAssignments = async () => {
        try {
            const profileIds = profiles.map(p => p.id)
            if (profileIds.length === 0) return
            const response = await apiClient.get('/api/workflows/assignments', { params: { profileIds: profileIds.join(',') } })
            const assignments = response.data || []
            const map: Record<number, any[]> = {}
            assignments.forEach((a: any) => {
                if (!map[a.profileId]) map[a.profileId] = []
                map[a.profileId].push(a.workflow)
            })
            setProfileWorkflowsMap(map)
        } catch (error) {
            console.error('Failed to load assignments:', error)
        }
    }

    const persistProfileProxyMap = (map: Record<number, number | undefined>) => {
        setProfileProxyMap(map)
        try {
            localStorage.setItem('profileProxyMap', JSON.stringify(map))
        } catch { }
    }

    const toggleSelect = (id: number) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
    }

    const selectAllOnPage = () => {
        const idsOnPage = paginatedProfiles.map((p) => p.id)
        const allSelected = idsOnPage.every((id) => selectedIds.includes(id))
        if (allSelected) {
            setSelectedIds((prev) => prev.filter((id) => !idsOnPage.includes(id)))
        } else {
            setSelectedIds((prev) => Array.from(new Set([...prev, ...idsOnPage])))
        }
    }

    const setProxyForProfile = (profileId: number, proxyId?: number) => {
        const next = { ...profileProxyMap, [profileId]: proxyId }
        persistProfileProxyMap(next)
    }

    // Hàm xử lý khi người dùng chọn một workflow mới
    const handleWorkflowChange = async (profileId: number, newWorkflowId: string | number | null) => {
        try {
            const payload = {
                workflowId: newWorkflowId === 'none' || newWorkflowId === '' ? null : newWorkflowId
            }

            // DÒNG MỚI: Gọi đến route POST mới để tránh lỗi CORS
            await apiClient.post(`/api/profiles/update/${profileId}`, payload)

            // Cập nhật lại state của giao diện để hiển thị ngay lập tức
            const workflowIdValue = newWorkflowId === 'none' || newWorkflowId === '' ? null : Number(newWorkflowId)
            setProfiles((currentProfiles) =>
                currentProfiles.map((p) =>
                    p.id === profileId
                        ? {
                            ...p,
                            workflowId: workflowIdValue,
                            workflow: workflowIdValue
                                ? workflows.find((w) => w.id === workflowIdValue) || null
                                : null,
                        }
                        : p
                )
            )

            // Bạn có thể bỏ alert đi để trải nghiệm mượt hơn
            // console.log('✅ Cập nhật workflow thành công!')
        } catch (error) {
            console.error('Lỗi khi cập nhật workflow (dùng POST):', error)
            alert('Cập nhật workflow thất bại!')
        }
    }

    const applyProxyToSelected = () => {
        if (!selectedIds.length) return
        const next = { ...profileProxyMap }
        selectedIds.forEach((id) => {
            next[id] = bulkProxyId
        })
        persistProfileProxyMap(next)
    }

    const applyProxyToAll = () => {
        const next = { ...profileProxyMap }
        filteredProfiles.forEach((p) => {
            next[p.id] = bulkProxyId
        })
        persistProfileProxyMap(next)
    }

    const applyWorkflowToSelected = async () => {
        if (!selectedIds.length || !bulkWorkflowId) {
            alert('Please select at least one profile and a workflow')
            return
        }
        try {
            await apiClient.post(`/api/workflows/${bulkWorkflowId}/assign`, { profileIds: selectedIds })
            alert(`Workflow applied to ${selectedIds.length} selected profile(s)`)
            await loadAssignments()
        } catch (error: any) {
            console.error('Failed to apply workflow:', error)
            const errorMessage = error.response?.data?.message || error.message || 'Failed to apply workflow'
            alert(`Error: ${errorMessage}`)
        }
    }

    const applyWorkflowToAll = async () => {
        if (!bulkWorkflowId) {
            alert('Please select a workflow')
            return
        }
        if (!confirm(`Apply workflow to all ${filteredProfiles.length} profile(s)?`)) {
            return
        }
        try {
            const allProfileIds = filteredProfiles.map((p) => p.id)
            await apiClient.post(`/api/workflows/${bulkWorkflowId}/assign`, { profileIds: allProfileIds })
            alert(`Workflow applied to ${allProfileIds.length} profile(s)`)
            await loadAssignments()
        } catch (error: any) {
            console.error('Failed to apply workflow:', error)
            const errorMessage = error.response?.data?.message || error.message || 'Failed to apply workflow'
            alert(`Error: ${errorMessage}`)
        }
    }

    const openRunWorkflowDialog = (profileId: number | null, workflowId: number, profileIds?: number[]) => {
        setRunWorkflowProfileId(profileId)
        setRunWorkflowId(workflowId)
        setRunWorkflowProfileIds(profileIds || (profileId ? [profileId] : []))
        setRunWorkflowVars({})
        setRunWorkflowDialogOpen(true)
    }

    const confirmRunWorkflow = async () => {
        if (!runWorkflowId) return

        const profileIds = runWorkflowProfileIds.length > 0
            ? runWorkflowProfileIds
            : (runWorkflowProfileId ? [runWorkflowProfileId] : [])

        if (profileIds.length === 0) {
            alert('No profiles selected')
            return
        }

        try {
            const vars: Record<string, string> = {}
            if (runWorkflowVars.email) vars.email = runWorkflowVars.email
            if (runWorkflowVars.password) vars.password = runWorkflowVars.password

            await apiClient.post(`/api/workflows/${runWorkflowId}/execute`, {
                profileIds,
                vars: Object.keys(vars).length > 0 ? vars : undefined,
            })
            alert(`✅ Workflow queued for execution! Check Executions page for status.`)

            setRunWorkflowDialogOpen(false)
            setRunWorkflowProfileId(null)
            setRunWorkflowId(null)
            setRunWorkflowProfileIds([])
            setRunWorkflowVars({})
        } catch (error: any) {
            console.error('Failed to run workflow:', error)
            const errorMessage = error.response?.data?.message || error.message || 'Failed to run workflow'
            alert(`Error: ${errorMessage}`)
        }
    }

    const runWorkflowForSelected = async () => {
        if (!selectedIds.length || !bulkWorkflowId) {
            alert('Please select at least one profile and a workflow')
            return
        }
        openRunWorkflowDialog(null, bulkWorkflowId, selectedIds)
    }

    const handleRunSelected = async () => {
        if (selectedIds.length === 0) {
            alert('Vui lòng tích chọn ít nhất 1 profile để chạy!')
            return
        }
        try {
            // Lấy kích thước màn hình hiện tại
            const screenWidth = window.screen.availWidth
            const screenHeight = window.screen.availHeight

            // Ví dụ muốn chia 2 hàng, 2 cột (Chạy 4 cái)
            const gridColumns = 2
            const gridRows = 2

            const response = await apiClient.post('/api/profiles/bulk-run', {
                profileIds: selectedIds,
                concurrency: gridColumns * gridRows, // Số luồng bằng số ô trên lưới
                screenWidth,    // Gửi kích thước màn hình lên
                screenHeight,
                gridColumns,    // Gửi số cột
                gridRows        // Gửi số dòng
            })
            if (response.data.success) {
                alert(`🚀 Đang khởi động và sắp xếp ${selectedIds.length} profiles trên lưới ${gridColumns}x${gridRows}!`)
            } else {
                alert('Lỗi: ' + (response.data.error || 'Unknown error'))
            }
        } catch (error: any) {
            console.error(error)
            const errorMessage = error.response?.data?.error || error.message || 'Lỗi kết nối Server!'
            alert('Lỗi: ' + errorMessage)
        }
    }

    useEffect(() => {
        if (editingProfile) {
            reset({
                name: editingProfile.name,
                user_agent: editingProfile.user_agent || '',
                fingerprint: editingProfile.fingerprint || undefined,
            })
            // Set fingerprint text for display
            if (editingProfile.fingerprint) {
                try {
                    setFingerprintText(JSON.stringify(editingProfile.fingerprint, null, 2))
                } catch {
                    setFingerprintText('')
                }
            } else {
                setFingerprintText('')
            }
            // Prefill toggle states from existing fingerprint (avoid losing selections when re-open)
            // Priority: fingerprintJson > fingerprint > DB fields > defaults
            try {
                const profile: any = editingProfile
                // Try fingerprintJson first (new format)
                let fp: any = profile.fingerprintJson || profile.fingerprint || {}

                // Also check individual DB fields (if saved separately)
                if (profile.osName) setOsName(profile.osName)
                else if (fp.os?.name) setOsName(fp.os.name)

                if (profile.osArch) setOsArch(profile.osArch === 'x86' ? 'x86' : 'x64')
                else if (fp.os?.arch) setOsArch(fp.os.arch === 'x86' ? 'x86' : 'x64')

                if (profile.browserVersion) setBrowserVersion(String(profile.browserVersion))
                else if (fp.browser?.version) setBrowserVersion(String(fp.browser.version))

                if (profile.screenWidth && profile.screenHeight) setScreenRes(`${profile.screenWidth}x${profile.screenHeight}`)
                else if (fp.screen?.width && fp.screen?.height) setScreenRes(`${fp.screen.width}x${fp.screen.height}`)

                if (profile.canvasMode) setCanvasMode(profile.canvasMode as any)
                else {
                    const canvas = fp.canvas?.mode || fp.canvas?.Mode || fp.canvas
                    if (canvas) setCanvasMode(canvas === 'Off' || canvas === 'Block' ? canvas : 'Noise')
                }

                if (profile.clientRectsMode) setClientRectsMode(profile.clientRectsMode as any)
                else {
                    const rects = fp.clientRects?.mode || fp.clientRects?.Mode
                    if (rects) setClientRectsMode(rects === 'Noise' ? 'Noise' : 'Off')
                }

                if (profile.audioCtxMode) setAudioCtxMode(profile.audioCtxMode as any)
                else {
                    const audio = fp.audioContext?.mode || fp.audioContext?.Mode
                    if (audio) setAudioCtxMode(audio === 'Noise' ? 'Noise' : 'Off')
                }

                if (profile.webglImageMode) setWebglImageMode(profile.webglImageMode as any)
                else {
                    const wimg = fp.webgl?.imageMode || fp.webgl?.image
                    if (wimg) setWebglImageMode(wimg === 'Noise' ? 'Noise' : 'Off')
                }

                if (profile.webglMetaMode) setWebglMetaMode(profile.webglMetaMode as any)
                else {
                    const wmeta = fp.webgl?.metaMode || fp.webgl?.metadata
                    if (wmeta) setWebglMetaMode(wmeta === 'Real' ? 'Real' : 'Mask')
                }

                if (profile.geoEnabled !== undefined) setGeoEnabled(!!profile.geoEnabled)
                else if (fp.geo) setGeoEnabled(!!fp.geo.enabled)

                if (profile.webrtcMainIP !== undefined) setWebrtcMainIP(!!profile.webrtcMainIP)
                else if (fp.webrtc) setWebrtcMainIP(!!fp.webrtc.useMainIP)

                // Proxy
                if (profile.proxyRefId) {
                    setProxyMode('library')
                    setProxyRefId(String(profile.proxyRefId))
                } else if (profile.proxyManual) {
                    setProxyMode('manual')
                    setProxyManual(profile.proxyManual as any)
                } else if (fp.proxy?.libraryId) {
                    setProxyMode('library')
                    setProxyRefId(String(fp.proxy.libraryId))
                } else if (fp.proxy?.manual) {
                    setProxyMode('manual')
                    setProxyManual(fp.proxy.manual as any)
                }

                // MAC
                if (profile.macAddress) setMacAddr(profile.macAddress)
                else if (fp.mac) setMacAddr(fp.mac)

                // Navigator Object - Load từ profile
                if (profile.hardwareConcurrency) setHardwareConcurrency(profile.hardwareConcurrency)
                if (profile.deviceMemory) setDeviceMemory(profile.deviceMemory)
                if (profile.languages && Array.isArray(profile.languages)) setLanguages(profile.languages)
                if (profile.timezone) setTimezone(profile.timezone)
                else if (profile.timezoneId) setTimezone(profile.timezoneId)
                else if (fp.timezoneId) setTimezone(fp.timezoneId)
                if (profile.language) setLanguage(profile.language)
                else if (fp.language) setLanguage(fp.language)
            } catch { }
        } else {
            reset({
                name: '',
                user_agent: '',
                fingerprint: undefined,
            })
            setFingerprintText('')
            // Reset UI selections to defaults when creating new
            setUaEditable(false)
            setOsName('Windows 10')
            setOsArch('x64')
            setBrowserVersion('Auto')
            // Random Screen Resolution
            const resolutions = ['1366x768', '1536x864', '1600x900', '1920x1080', '1920x1200', '2560x1440', '3440x1440', '3840x2160']
            setScreenRes(resolutions[Math.floor(Math.random() * resolutions.length)])
            setCanvasMode('Noise')
            setClientRectsMode('Noise')
            setAudioCtxMode('Noise')
            setWebglImageMode('Noise')
            setWebglMetaMode('Mask')
            setGeoEnabled(true)
            setWebrtcMainIP(true)
            // Auto-generate MAC Address
            const b = new Uint8Array(6)
            for (let i = 0; i < 6; i++) b[i] = Math.floor(Math.random() * 256)
            b[0] = (b[0] | 0x02) & 0xfe
            setMacAddr(Array.from(b).map((v) => v.toString(16).padStart(2, '0')).join(':'))
            // Reset Navigator Object fields - Auto Random
            const cores = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32]
            const ram = [2, 4, 6, 8, 12, 16, 24, 32, 48, 64]
            setHardwareConcurrency(cores[Math.floor(Math.random() * cores.length)])
            setDeviceMemory(ram[Math.floor(Math.random() * ram.length)])
            setLanguages(['en-US', 'en'])
            setTimezone('Europe/London')
            setLanguage('en-US')
        }
    }, [editingProfile, reset])

    const regenMac = () => {
        const b = new Uint8Array(6)
        for (let i = 0; i < 6; i++) b[i] = Math.floor(Math.random() * 256)
        b[0] = (b[0] | 0x02) & 0xfe // local-admin & unicast
        setMacAddr(Array.from(b).map((v) => v.toString(16).padStart(2, '0')).join(':'))
    }

    const loadProfiles = async () => {
        try {
            setLoading(true)
            const data = await api.getProfiles()
            setProfiles(data)
            // init driver/proxy map from existing fingerprints
            const dMap: Record<number, string> = {}
            const pMap: Record<number, number | undefined> = { ...profileProxyMap }
            data.forEach((p: any) => {
                if (p.fingerprint && typeof p.fingerprint === 'object') {
                    if (p.fingerprint.driver) dMap[p.id] = p.fingerprint.driver
                    if (p.fingerprint.proxyId && !pMap[p.id]) pMap[p.id] = Number(p.fingerprint.proxyId)
                }
            })
            if (Object.keys(dMap).length) setDriverMap(dMap)
            if (Object.keys(pMap).length) persistProfileProxyMap(pMap)
        } catch (error) {
            console.error('Failed to load profiles:', error)
        } finally {
            setLoading(false)
        }
    }

    const onSubmit = async (data: ProfileFormData) => {
        try {
            // Parse fingerprint JSON string to object
            let fingerprint = undefined
            if (fingerprintText.trim()) {
                try {
                    fingerprint = JSON.parse(fingerprintText)
                } catch (e) {
                    alert('Fingerprint JSON không hợp lệ. Vui lòng kiểm tra lại.')
                    return
                }
            }

            const payload: any = { name: data.name }

            // NEW V2.0: If preset is selected, use fingerprintPresetId (highest priority)
            if (selectedPresetId) {
                payload.fingerprintPresetId = selectedPresetId
            }

            // UA: nếu người dùng không sửa → để trống để BE auto-random
            if (uaEditable && data.user_agent) payload.user_agent = data.user_agent

            if (fingerprint !== undefined) {
                payload.fingerprint = fingerprint
            }

            // Extended selections (all optional)
            payload.osName = osName
            payload.osArch = osName.startsWith('macOS') ? 'x64' : osArch
            payload.browserVersion = browserVersion === 'Auto' ? undefined : Number(browserVersion)
            const [w, h] = screenRes.split('x').map(Number)
            payload.screenWidth = w
            payload.screenHeight = h
            payload.canvasMode = canvasMode
            payload.clientRectsMode = clientRectsMode
            payload.audioCtxMode = audioCtxMode
            payload.webglImageMode = webglImageMode
            payload.webglMetaMode = webglMetaMode
            if (webglVendor || webglRenderer) {
                payload.webglVendor = webglVendor
                payload.webglRenderer = webglRenderer
            }
            payload.geoEnabled = geoEnabled
            payload.webrtcMainIP = webrtcMainIP
            if (proxyMode === 'library' && proxyRefId) payload.proxyRefId = String(proxyRefId)
            if (proxyMode === 'manual' && proxyManual.host && proxyManual.port) payload.proxyManual = proxyManual
            if (macAddr !== 'Auto random (unique)') payload.macAddress = macAddr

            // Navigator Object - Thông số fingerprint đầy đủ
            payload.hardwareConcurrency = Number(hardwareConcurrency)
            payload.deviceMemory = Number(deviceMemory)
            payload.languages = languages
            payload.timezone = timezone
            payload.language = language
            // payload.geoLatitude = geoLatitude
            // payload.geoLongitude = geoLongitude

            if (editingProfile) {
                await api.updateProfile(editingProfile.id, payload)
                alert('Cập nhật profile thành công!')
            } else {
                await api.createProfile(payload)
                alert('Tạo profile thành công!')
            }
            setDialogOpen(false)
            setEditingProfile(null)
            reset()
            setFingerprintText('')
            loadProfiles()
        } catch (error: any) {
            console.error('Failed to save profile:', error)
            let errorMessage = 'Failed to save profile'

            // Provide more specific error messages
            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message
            } else if (error?.message) {
                errorMessage = error.message
            } else if (error?.code === 'ECONNREFUSED' || error?.message?.includes('Network Error')) {
                errorMessage = 'Cannot connect to backend server. Please ensure backend is running on port 3000.'
            }

            alert(`Lỗi: ${errorMessage}`)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this profile?')) return
        try {
            await api.deleteProfile(id)
            loadProfiles()
        } catch (error) {
            console.error('Failed to delete profile:', error)
            alert('Failed to delete profile')
        }
    }

    const handleStart = async (profileId: number) => {
        try {
            // COMMENT LẠI HOẶC XÓA BỎ HOÀN TOÀN CUỘC GỌI API CŨ GÂY RA LỖI
            // const proxyId = profileProxyMap[profileId]
            // const result = await api.startProfileWithWorkflow(profileId, { proxyId })
            // const message = result.message || 'Session started successfully! Browser should open now.'
            // alert(message)
            // loadProfiles()

            // CHỈ GIỮ LẠI CUỘC GỌI IPC DUY NHẤT NÀY
            if (window.electronAPI) {
                // Sử dụng electronAPI nếu có
                window.electronAPI.send('start-profile-and-run-workflow', profileId)
                console.log(`[Frontend] Đã gửi IPC event 'start-profile-and-run-workflow' cho profile ${profileId}`)
            } else if (window.electron?.ipcRenderer) {
                // Fallback: sử dụng window.electron.ipcRenderer
                window.electron.ipcRenderer.send('start-profile-and-run-workflow', profileId)
                console.log(`[Frontend] Đã gửi IPC event 'start-profile-and-run-workflow' cho profile ${profileId}`)
            } else {
                // Nếu không có Electron API, fallback về API call (cho web version)
                console.warn('[Frontend] Electron API không khả dụng, sử dụng API call thay thế')
                const proxyId = profileProxyMap[profileId]
                const result = await api.startProfileWithWorkflow(profileId, { proxyId })
                const message = result.message || 'Session started successfully! Browser should open now.'
                alert(message)
                loadProfiles()
            }
        } catch (error: any) {
            console.error('Failed to start profile:', error)
            const errorMessage = error.response?.data?.message || error.message || 'Failed to start profile'
            alert(`Lỗi: ${errorMessage}`)
        }
    }

    const confirmStart = async () => {
        if (!startingProfile) return

        try {
            await api.createSession({
                profileId: startingProfile.id,
                proxyId: selectedProxyId,
            })
            setStartDialogOpen(false)
            setStartingProfile(null)
            setSelectedProxyId(undefined)
            alert('Session started successfully! Browser should open now.')
            loadProfiles()
        } catch (error: any) {
            console.error('Failed to start session:', error)
            const errorMessage = error.response?.data?.message || error.message || 'Failed to start session'
            alert(`Lỗi: ${errorMessage}`)
        }
    }

    const filteredProfiles = profiles.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
    )

    const paginatedProfiles = filteredProfiles.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage)


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Profiles</h1>
                    <p className="text-muted-foreground">Manage browser profiles</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setIsImportModalOpen(true)} variant="outline" className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Import Accounts
                    </Button>
                    <Button onClick={() => setDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Profile
                    </Button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search profiles..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Label htmlFor="bulkProxy">Chose Proxy</Label>
                    <select
                        id="bulkProxy"
                        value={bulkProxyId || ''}
                        onChange={(e) => setBulkProxyId(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="flex h-10 w-56 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="">None (No proxy)</option>
                        {proxies.filter((p) => p.active).map((proxy) => (
                            <option key={proxy.id} value={proxy.id}>
                                {proxy.host}:{proxy.port} ({proxy.type}) {proxy.username ? `- ${proxy.username}` : ''}
                            </option>
                        ))}
                    </select>
                    <Button variant="outline" onClick={applyProxyToSelected} disabled={!selectedIds.length}>
                        Apply to Selected
                    </Button>
                    <Button variant="outline" onClick={applyProxyToAll}>
                        Apply to All
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={handleRunSelected}
                        disabled={!selectedIds.length}
                        className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                    >
                        <Play className="mr-2 h-4 w-4" />
                        Run selected profile
                    </Button>
                </div>
                {SHOW_WORKFLOWS && (
                    <div className="flex items-center gap-2">
                        <Label htmlFor="bulkWorkflow">Chose workflows</Label>
                        <select
                            id="bulkWorkflow"
                            value={bulkWorkflowId || ''}
                            onChange={(e) => setBulkWorkflowId(e.target.value ? parseInt(e.target.value) : undefined)}
                            className="flex h-10 w-56 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            <option value="">None (No workflow)</option>
                            {Array.isArray(workflows) && workflows.map((workflow) => (
                                <option key={workflow.id} value={workflow.id}>
                                    {workflow.name || `Workflow ${workflow.id}`}
                                </option>
                            ))}
                        </select>
                        <Button variant="outline" onClick={applyWorkflowToSelected} disabled={!selectedIds.length || !bulkWorkflowId}>
                            Apply to Selected
                        </Button>
                        <Button variant="outline" onClick={applyWorkflowToAll} disabled={!bulkWorkflowId}>
                            Apply to All
                        </Button>
                        <Button variant="outline" onClick={runWorkflowForSelected} disabled={!selectedIds.length || !bulkWorkflowId} className="bg-green-50 hover:bg-green-100">
                            <Play className="mr-2 h-4 w-4" /> Run for Selected
                        </Button>
                    </div>
                )}
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>
                                <input type="checkbox" onChange={selectAllOnPage} checked={paginatedProfiles.every((p) => selectedIds.includes(p.id)) && paginatedProfiles.length > 0} />
                            </TableHead>
                            <TableHead>ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>User Agent</TableHead>
                            <TableHead>Chose Proxy</TableHead>
                            <TableHead>Choose Workflow</TableHead>
                            <TableHead>Change Driver</TableHead>
                            {SHOW_WORKFLOWS && <TableHead>Workflows</TableHead>}
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
                        ) : paginatedProfiles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">
                                    No profiles found
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedProfiles.map((profile) => (
                                <TableRow key={profile.id}>
                                    <TableCell>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(profile.id)}
                                            onChange={() => toggleSelect(profile.id)}
                                        />
                                    </TableCell>
                                    <TableCell>{profile.id}</TableCell>
                                    <TableCell className="font-medium">{profile.name}</TableCell>
                                    <TableCell className="max-w-xs truncate">{profile.user_agent || '-'}</TableCell>
                                    <TableCell>
                                        <select
                                            value={profileProxyMap[profile.id] || ''}
                                            onChange={(e) => setProxyForProfile(profile.id, e.target.value ? parseInt(e.target.value) : undefined)}
                                            className="flex h-9 w-56 rounded-md border border-input bg-background px-2 text-sm"
                                        >
                                            <option value="">None (No proxy)</option>
                                            {proxies.filter((p) => p.active).map((proxy) => (
                                                <option key={proxy.id} value={proxy.id}>
                                                    {proxy.host}:{proxy.port} ({proxy.type})
                                                </option>
                                            ))}
                                        </select>
                                    </TableCell>
                                    <TableCell>
                                        <select
                                            value={profile.workflowId || 'none'}
                                            onChange={(e) => handleWorkflowChange(profile.id, e.target.value)}
                                            className="flex h-9 w-56 rounded-md border border-input bg-background px-2 text-sm"
                                        >
                                            <option value="none">None (No workflow)</option>
                                            {workflows.map((wf) => (
                                                <option key={wf.id} value={wf.id}>
                                                    {wf.name}
                                                </option>
                                            ))}
                                        </select>
                                    </TableCell>
                                    <TableCell>
                                        <select
                                            value={driverMap[profile.id] || ''}
                                            onChange={async (e) => {
                                                const driver = e.target.value
                                                setDriverMap((prev) => ({ ...prev, [profile.id]: driver }))
                                                try {
                                                    const current = (profile as any).fingerprint || {}
                                                    await api.updateProfileFingerprint(profile.id, { ...current, driver })
                                                } catch (err) {
                                                    console.error('Failed to update driver', err)
                                                    alert('Failed to update driver')
                                                }
                                            }}
                                            className="flex h-9 w-48 rounded-md border border-input bg-background px-2 text-sm"
                                        >
                                            <option value="">Chromium (default)</option>
                                            <option value="chrome">Chrome</option>
                                            <option value="msedge">Microsoft Edge</option>
                                        </select>
                                    </TableCell>
                                    {SHOW_WORKFLOWS && (
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1 max-w-xs">
                                                {(profileWorkflowsMap[profile.id] || []).map((wf: any) => (
                                                    <div key={wf.id} className="flex items-center gap-1">
                                                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                                                            {wf.name || `W${wf.id}`}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0"
                                                            onClick={() => openRunWorkflowDialog(profile.id, wf.id)}
                                                            title={`Run workflow: ${wf.name}`}
                                                        >
                                                            <Play className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                {(!profileWorkflowsMap[profile.id] || profileWorkflowsMap[profile.id].length === 0) && (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                )}
                                            </div>
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        {profile.created_at ? new Date(profile.created_at).toLocaleString() : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleStart(profile.id)}
                                                title="Start Session"
                                            >
                                                <Play className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={async () => {
                                                    try {
                                                        // Load fresh profile data from API to ensure we have latest settings
                                                        const freshProfile = await api.getProfile(profile.id)
                                                        setEditingProfile(freshProfile)
                                                        setDialogOpen(true)
                                                    } catch (e) {
                                                        // Fallback to cached profile if API fails
                                                        setEditingProfile(profile)
                                                        setDialogOpen(true)
                                                    }
                                                }}
                                                title="Edit (Old Modal)"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(profile.id)}
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

            <Dialog open={dialogOpen} onOpenChange={(open) => {
                if (!open) {
                    setDialogOpen(false)
                    setEditingProfile(null)
                    reset()
                    setFingerprintText('')
                } else {
                    setDialogOpen(true)
                }
            }}>
                <DialogContent className="profile-modal" onClose={() => {
                    setDialogOpen(false)
                    setEditingProfile(null)
                    reset()
                    setFingerprintText('')
                }}>
                    <DialogHeader>
                        <DialogTitle>{editingProfile ? 'Edit Profile' : 'Create Profile'}</DialogTitle>
                        <DialogDescription>
                            {editingProfile ? 'Update profile details' : 'Create a new browser profile'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="modal-body space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input id="name" {...register('name')} />
                                {errors.name && (
                                    <p className="text-sm text-destructive">{errors.name.message}</p>
                                )}
                            </div>

                            {/* Fingerprint Preset Selector */}
                            <div className="space-y-2">
                                <Label htmlFor="fingerprint-preset">Fingerprint Preset (Optional)</Label>
                                <select
                                    id="fingerprint-preset"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={selectedPresetId || ''}
                                    onChange={(e) => handlePresetChange(e.target.value ? parseInt(e.target.value, 10) : null)}
                                >
                                    <option value="">-- Select a Preset to auto-fill all fields --</option>
                                    {fingerprintPresets.map((preset) => (
                                        <option key={preset.id} value={preset.id}>
                                            {preset.name} ({preset.os} - Chrome {preset.browserVersion || 'N/A'})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-muted-foreground">
                                    Select a preset to automatically populate all fingerprint parameters. You can still modify individual fields after selection.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="user_agent">User Agent</Label>
                                <div className="space-y-2">
                                    <select
                                        id="ua-select"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={(() => {
                                            const currentUA = getCurrentUserAgent()
                                            const foundUA = userAgents.find(ua => ua.value === currentUA)
                                            return foundUA ? foundUA.value : ''
                                        })()}
                                        onChange={(e) => handleUserAgentChange(e.target.value)}
                                    >
                                        <option value="">-- Chọn User Agent từ thư viện --</option>
                                        {userAgents.map((ua, index) => (
                                            <option key={index} value={ua.value}>
                                                {ua.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="flex gap-2 items-center">
                                        <Input id="user_agent" placeholder="Auto via provider hoặc chọn từ dropdown trên" disabled={!uaEditable} {...register('user_agent')} className="flex-1" />
                                        <Button type="button" variant="outline" onClick={async () => {
                                            try {
                                                const ua = await api.getUserAgent({ browser: 'chrome', versionHint: browserVersion === 'Auto' ? undefined : Number(browserVersion), os: osName })
                                                setUaEditable(true)
                                                // set value via manual set since we use react-hook-form
                                                const input = document.getElementById('user_agent') as HTMLInputElement | null
                                                if (input) input.value = ua
                                                // Reset dropdown
                                                const select = document.getElementById('ua-select') as HTMLSelectElement | null
                                                if (select) select.value = ''
                                            } catch (e: any) {
                                                alert(e?.message || 'Failed to generate user agent')
                                            }
                                        }} title="Generate via provider">
                                            Generate
                                        </Button>
                                        <Button type="button" variant="outline" onClick={() => setUaEditable((v) => !v)} title="Edit UA">
                                            {uaEditable ? 'Lock' : 'Edit'}
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">Chọn User-Agent từ dropdown để tự động đồng bộ OS, hoặc Generate để tạo ngẫu nhiên.</p>
                            </div>

                            {/* OS & Arch */}
                            <div className="grid md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label>OS</Label>
                                    <select
                                        value={osName}
                                        onChange={(e) => {
                                            const newOS = e.target.value;
                                            setOsName(newOS);
                                            // Auto-update User Agent và WebGL Renderer khi OS thay đổi
                                            // Lọc chỉ lấy UA có Chrome 130-140 (match với backend validation)
                                            const compatibleAgents = USER_AGENT_LIBRARY.filter(agent => {
                                                const agentOS = agent.os || '';
                                                const isOSMatch = agentOS === newOS || agentOS.includes(newOS) || newOS.includes(agentOS);
                                                if (!isOSMatch) return false;
                                                // Lọc version 130-140
                                                const chromeMatch = agent.value.match(/Chrome\/(\d+)/);
                                                if (chromeMatch) {
                                                    const version = parseInt(chromeMatch[1], 10);
                                                    return version >= 130 && version <= 140;
                                                }
                                                return false;
                                            });
                                            if (compatibleAgents.length > 0) {
                                                const randomAgent = compatibleAgents[Math.floor(Math.random() * compatibleAgents.length)];
                                                const input = document.getElementById('user_agent') as HTMLInputElement | null;
                                                if (input) {
                                                    input.value = randomAgent.value;
                                                    setUaEditable(true);
                                                }
                                                // Auto-extract Browser Version từ UA
                                                const version = extractBrowserVersion(randomAgent.value);
                                                if (version) setBrowserVersion(String(version));
                                            }
                                            // Auto-update WebGL Renderer
                                            // NEW: Use API library if available, fallback to constants
                                            const compatibleGPUs = webglRenderers.length > 0
                                                ? webglRenderers.filter((gpu: any) => !gpu.os || gpu.os === newOS || gpu.os === 'Windows' || gpu.os === 'macOS')
                                                : getWebGLRenderersByOS(newOS);
                                            if (compatibleGPUs.length > 0) {
                                                const randomGPU = compatibleGPUs[Math.floor(Math.random() * compatibleGPUs.length)];
                                                setWebglRenderer(randomGPU.renderer);
                                                setWebglVendor(randomGPU.vendor);
                                            }
                                        }}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="Windows">Windows</option>
                                        <option value="Windows 10">Windows 10</option>
                                        <option value="Windows 11">Windows 11</option>
                                        <option value="macOS">macOS</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Architecture</Label>
                                    <div className="flex items-center gap-4 mt-2">
                                        {!osName.startsWith('macOS') ? (
                                            <>
                                                <label className="flex items-center gap-1 text-sm">
                                                    <input type="radio" checked={osArch === 'x86'} onChange={() => setOsArch('x86')} /> 32-bit
                                                </label>
                                                <label className="flex items-center gap-1 text-sm">
                                                    <input type="radio" checked={osArch === 'x64'} onChange={() => setOsArch('x64')} /> 64-bit
                                                </label>
                                            </>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">macOS chỉ hỗ trợ 64-bit</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Browser Version & Screen */}
                            <div className="grid md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label>Browser Version (Auto từ User Agent)</Label>
                                    <select value={browserVersion} onChange={(e) => setBrowserVersion(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm bg-gray-50" disabled>
                                        <option>Auto</option>
                                        {[140, 139, 138, 137, 136, 135, 134, 133, 132, 131, 130].map((v) => (
                                            <option key={v} value={String(v)}>
                                                {v}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-muted-foreground">Tự động chọn dựa trên User Agent</p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="mt-2"
                                        onClick={() => {
                                            const randomVersion = generateRandomBrowserVersion()
                                            setBrowserVersion(String(randomVersion))
                                        }}
                                    >
                                        🎲 Random (130-140)
                                    </Button>
                                </div>
                                <div className="space-y-1">
                                    <Label>Screen Resolution (Random)</Label>
                                    <select value={screenRes} onChange={(e) => setScreenRes(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                        {['1366x768', '1536x864', '1600x900', '1920x1080', '1920x1200', '2560x1440', '3440x1440', '3840x2160'].map((r) => (
                                            <option key={r} value={r}>
                                                {r}
                                            </option>
                                        ))}
                                    </select>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="mt-2"
                                        onClick={() => {
                                            const resolutions = ['1366x768', '1536x864', '1600x900', '1920x1080', '1920x1200', '2560x1440', '3440x1440', '3840x2160']
                                            setScreenRes(resolutions[Math.floor(Math.random() * resolutions.length)])
                                        }}
                                    >
                                        🎲 Random
                                    </Button>
                                </div>
                            </div>

                            {/* Fingerprint Settings - Button Groups */}
                            <div className="space-y-4">
                                {/* Canvas */}
                                <div>
                                    <Label className="mb-2 block">Canvas</Label>
                                    <div className="flex gap-2">
                                        {(['Noise', 'Off', 'Block'] as const).map((m) => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => setCanvasMode(m)}
                                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${canvasMode === m
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                    }`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Client Rects */}
                                <div>
                                    <Label className="mb-2 block">Client Rects</Label>
                                    <div className="flex gap-2">
                                        {(['Noise', 'Off'] as const).map((m) => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => setClientRectsMode(m)}
                                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${clientRectsMode === m
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                    }`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Audio Context */}
                                <div>
                                    <Label className="mb-2 block">Audio Context</Label>
                                    <div className="flex gap-2">
                                        {(['Noise', 'Off'] as const).map((m) => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => setAudioCtxMode(m)}
                                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${audioCtxMode === m
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                    }`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* WebGL Image */}
                                <div>
                                    <Label className="mb-2 block">WebGL Image</Label>
                                    <div className="flex gap-2">
                                        {(['Noise', 'Off'] as const).map((m) => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => setWebglImageMode(m)}
                                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${webglImageMode === m
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                    }`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* WebGL Metadata */}
                                <div>
                                    <Label className="mb-2 block">WebGL Metadata</Label>
                                    <div className="flex gap-2">
                                        {(['Mask', 'Real'] as const).map((m) => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => setWebglMetaMode(m)}
                                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${webglMetaMode === m
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                    }`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* GPU Selection - Auto từ User Agent */}
                            <div className="space-y-1">
                                <Label>WebGL Renderer (Card đồ họa - Auto từ User Agent)</Label>
                                <GPUSelect value={webglRenderer} onChange={(angle, vendor) => { setWebglRenderer(angle); setWebglVendor(vendor); }} />
                                <p className="text-xs text-muted-foreground">Tự động chọn dựa trên OS từ User Agent</p>
                            </div>

                            {/* GEO Location & WebRTC - Luôn bật */}
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" checked={geoEnabled} onChange={(e) => setGeoEnabled(e.target.checked)} disabled /> GEO Location
                                    <span className="text-xs text-muted-foreground">Always enabled (fake location)</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" checked={webrtcMainIP} onChange={(e) => setWebrtcMainIP(e.target.checked)} disabled /> WebRTC IP (main)
                                    <span className="text-xs text-muted-foreground">Always enabled (fake IP)</span>
                                </label>
                            </div>

                            {/* Proxy */}
                            <div className="space-y-2">
                                <Label>Proxy</Label>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-1">
                                        <input type="radio" checked={proxyMode === 'manual'} onChange={() => setProxyMode('manual')} /> Manual
                                    </label>
                                    <label className="flex items-center gap-1">
                                        <input type="radio" checked={proxyMode === 'library'} onChange={() => setProxyMode('library')} /> Library
                                    </label>
                                </div>
                                {proxyMode === 'manual' ? (
                                    <div className="grid md:grid-cols-4 gap-2">
                                        <Input placeholder="Host" value={proxyManual.host || ''} onChange={(e) => setProxyManual({ ...proxyManual, host: e.target.value })} />
                                        <Input placeholder="Port" type="number" value={(proxyManual.port as any) || ''} onChange={(e) => setProxyManual({ ...proxyManual, port: Number(e.target.value) })} />
                                        <Input placeholder="Username" value={proxyManual.username || ''} onChange={(e) => setProxyManual({ ...proxyManual, username: e.target.value })} />
                                        <Input placeholder="Password" type="password" value={proxyManual.password || ''} onChange={(e) => setProxyManual({ ...proxyManual, password: e.target.value })} />
                                    </div>
                                ) : (
                                    <select value={proxyRefId} onChange={(e) => setProxyRefId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                        <option value="">-- Chọn proxy từ thư viện --</option>
                                        {proxies.map((p) => (
                                            <option key={p.id} value={String(p.id)}>
                                                {p.host}:{p.port} ({p.type})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* MAC Address - Auto random và hiển thị */}
                            <div className="space-y-1">
                                <Label>MAC Address (Auto Random)</Label>
                                <div className="flex gap-2 items-center">
                                    <Input value={macAddr} onChange={(e) => setMacAddr(e.target.value)} placeholder="Auto random (unique)" readOnly className="bg-gray-50" />
                                    <Button type="button" variant="outline" onClick={() => {
                                        const b = new Uint8Array(6)
                                        for (let i = 0; i < 6; i++) b[i] = Math.floor(Math.random() * 256)
                                        b[0] = (b[0] | 0x02) & 0xfe
                                        setMacAddr(Array.from(b).map((v) => v.toString(16).padStart(2, '0')).join(':'))
                                    }} title="Regenerate MAC">
                                        🔄 Refresh
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">MAC Address được tự động tạo ngẫu nhiên và hiển thị</p>
                            </div>

                            {/* Navigator Object - Thông số fingerprint đầy đủ */}
                            <div className="space-y-4 border-t pt-4">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Navigator Object (Thông tin trình duyệt)</h3>

                                {/* Hardware Concurrency & Device Memory */}
                                <div className="grid md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label>Hardware Concurrency (CPU Cores - Auto Random)</Label>
                                        <div className="flex gap-2 items-center">
                                            <select
                                                value={hardwareConcurrency}
                                                onChange={(e) => setHardwareConcurrency(Number(e.target.value))}
                                                className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            >
                                                {[2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32].map((cores) => (
                                                    <option key={cores} value={cores}>
                                                        {cores} cores
                                                    </option>
                                                ))}
                                            </select>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const cores = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32]
                                                    setHardwareConcurrency(cores[Math.floor(Math.random() * cores.length)])
                                                }}
                                                title="Random CPU Cores"
                                            >
                                                🎲
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Số lõi CPU logic (2-32) - Tự động random khi tạo profile</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Device Memory (RAM - Auto Random)</Label>
                                        <div className="flex gap-2 items-center">
                                            <select
                                                value={deviceMemory}
                                                onChange={(e) => setDeviceMemory(Number(e.target.value))}
                                                className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            >
                                                {[2, 4, 6, 8, 12, 16, 24, 32, 48, 64].map((gb) => (
                                                    <option key={gb} value={gb}>
                                                        {gb} GB
                                                    </option>
                                                ))}
                                            </select>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const ram = [2, 4, 6, 8, 12, 16, 24, 32, 48, 64]
                                                    setDeviceMemory(ram[Math.floor(Math.random() * ram.length)])
                                                }}
                                                title="Random RAM"
                                            >
                                                🎲
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Dung lượng RAM (2-64 GB) - Tự động random khi tạo profile</p>
                                    </div>
                                </div>

                                {/* Languages & Primary Language */}
                                <div className="grid md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label>Languages (Ngôn ngữ ưu tiên)</Label>
                                        <Input
                                            value={languages.join(', ')}
                                            onChange={(e) => {
                                                const langs = e.target.value.split(',').map(l => l.trim()).filter(l => l.length > 0)
                                                setLanguages(langs.length > 0 ? langs : ['en-US', 'en'])
                                            }}
                                            placeholder="en-US, en, fr-FR"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        />
                                        <p className="text-xs text-muted-foreground">Danh sách ngôn ngữ, cách nhau bởi dấu phẩy (ví dụ: en-US, en, fr-FR)</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label>Primary Language (Ngôn ngữ chính)</Label>
                                        <Input
                                            value={language}
                                            onChange={(e) => setLanguage(e.target.value)}
                                            placeholder="en-US"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        />
                                        <p className="text-xs text-muted-foreground">Ngôn ngữ chính (ví dụ: en-US, vi-VN, fr-FR)</p>
                                    </div>
                                </div>

                                {/* Timezone */}
                                <div className="space-y-1">
                                    <Label>Timezone (Múi giờ - Châu Âu)</Label>
                                    <select
                                        value={timezone}
                                        onChange={(e) => setTimezone(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        {EUROPEAN_TIMEZONES.map((tz) => (
                                            <option key={tz.value} value={tz.value}>
                                                {tz.label}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-muted-foreground">Múi giờ phải khớp với địa chỉ IP của proxy để trông tự nhiên</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fingerprint">Fingerprint (JSON)</Label>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-muted-foreground">Preset:</label>
                                    <select
                                        className="flex h-8 rounded-md border border-input bg-background px-2 text-xs"
                                        onChange={(e) => {
                                            const idx = Number(e.target.value)
                                            if (!Number.isNaN(idx)) {
                                                const preset = presets[idx]
                                                if (preset) {
                                                    setFingerprintText(JSON.stringify(preset.value, null, 2))
                                                    // also mirror UA into dedicated field for visibility
                                                    // we keep JSON as source of truth; UA field remains editable separately
                                                }
                                            }
                                        }}
                                    >
                                        <option value="">-- Choose preset --</option>
                                        {presets.map((p, i) => (
                                            <option key={p.label} value={i}>
                                                {p.label}
                                            </option>
                                        ))}
                                    </select>
                                    <RandomizeButton
                                        onSet={async () => {
                                            try {
                                                const fp = await api.generateFingerprint({
                                                    osName,
                                                    osArch,
                                                    browserVersion: browserVersion === 'Auto' ? undefined : Number(browserVersion),
                                                })
                                                setFingerprintText(JSON.stringify(fp, null, 2))
                                                setOsName(fp.os?.name || 'Windows 10')
                                                setOsArch(fp.os?.arch === 'x86' ? 'x86' : 'x64')
                                                setBrowserVersion(String(fp.browser?.version || 'Auto'))
                                                setScreenRes(`${fp.screen?.width || 1920}x${fp.screen?.height || 1080}`)
                                                setCanvasMode(fp.canvas?.mode === 'Off' || fp.canvas?.mode === 'Block' ? fp.canvas.mode : 'Noise')
                                                setClientRectsMode(fp.clientRects?.mode === 'Noise' ? 'Noise' : 'Off')
                                                setAudioCtxMode(fp.audioContext?.mode === 'Noise' ? 'Noise' : 'Off')
                                                setWebglImageMode(fp.webgl?.imageMode === 'Noise' ? 'Noise' : 'Off')
                                                setWebglMetaMode(fp.webgl?.metaMode === 'Real' ? 'Real' : 'Mask')
                                                setGeoEnabled(!!fp.geo?.enabled)
                                                setWebrtcMainIP(!!fp.webrtc?.useMainIP)
                                                if (fp.mac) setMacAddr(fp.mac)
                                            } catch (e: any) {
                                                alert(e?.message || 'Failed to generate fingerprint')
                                            }
                                        }}
                                    />
                                </div>
                                <textarea
                                    id="fingerprint"
                                    value={fingerprintText}
                                    onChange={(e) => setFingerprintText(e.target.value)}
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder='{"canvas": "abc123", ...}'
                                />
                                <p className="text-xs text-muted-foreground">
                                    Để trống nếu không cần fingerprint, hoặc nhập JSON hợp lệ
                                </p>
                                {editingProfile && (
                                    <div>
                                        <Button type="button" variant="outline" onClick={async () => {
                                            try {
                                                let fp: any = undefined
                                                if (fingerprintText.trim()) {
                                                    fp = JSON.parse(fingerprintText)
                                                }
                                                const saved = await api.updateProfileFingerprint(editingProfile.id, fp || {})
                                                // Cập nhật lại state để modal hiển thị dữ liệu mới
                                                setEditingProfile({ ...editingProfile, fingerprint: saved })
                                                await loadProfiles()
                                                alert('Đã lưu Fingerprint!')
                                            } catch (e: any) {
                                                alert('Fingerprint JSON không hợp lệ hoặc lưu thất bại.')
                                            }
                                        }}>
                                            Save Fingerprint
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <DialogFooter className="modal-footer">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setDialogOpen(false)
                                    setEditingProfile(null)
                                    reset()
                                    setFingerprintText('')
                                }}
                            >
                                Cancel
                            </Button>
                            <Button type="submit">{editingProfile ? 'Update' : 'Create'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Start Session Dialog */}
            <Dialog open={startDialogOpen} onOpenChange={(open) => {
                if (!open) {
                    setStartDialogOpen(false)
                    setStartingProfile(null)
                    setSelectedProxyId(undefined)
                } else {
                    setStartDialogOpen(true)
                }
            }}>
                <DialogContent onClose={() => {
                    setStartDialogOpen(false)
                    setStartingProfile(null)
                    setSelectedProxyId(undefined)
                }}>
                    <DialogHeader>
                        <DialogTitle>Start Session</DialogTitle>
                        <DialogDescription>
                            Start browser session for profile: <strong>{startingProfile?.name}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="proxy">Select Proxy (Optional)</Label>
                            <select
                                id="proxy"
                                value={selectedProxyId || ''}
                                onChange={(e) => setSelectedProxyId(e.target.value ? parseInt(e.target.value) : undefined)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <option value="">None (No proxy)</option>
                                {proxies
                                    .filter((p) => p.active)
                                    .map((proxy) => (
                                        <option key={proxy.id} value={proxy.id}>
                                            {proxy.host}:{proxy.port} ({proxy.type}) {proxy.username ? `- ${proxy.username}` : ''}
                                        </option>
                                    ))}
                            </select>
                            {proxies.filter((p) => p.active).length === 0 && (
                                <p className="text-xs text-muted-foreground">
                                    No active proxies available. Session will start without proxy.
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setStartDialogOpen(false)
                                setStartingProfile(null)
                                setSelectedProxyId(undefined)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="button" onClick={confirmStart}>
                            <Play className="mr-2 h-4 w-4" />
                            Start Session
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Run Workflow Dialog */}
            <Dialog open={runWorkflowDialogOpen} onOpenChange={(open) => {
                setRunWorkflowDialogOpen(open)
                if (!open) {
                    setRunWorkflowProfileId(null)
                    setRunWorkflowId(null)
                    setRunWorkflowProfileIds([])
                    setRunWorkflowVars({})
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Run Workflow</DialogTitle>
                        <DialogDescription>
                            Enter workflow variables (optional)
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="runEmail">Email (optional)</Label>
                            <Input
                                id="runEmail"
                                type="email"
                                value={runWorkflowVars.email || ''}
                                onChange={(e) => setRunWorkflowVars({ ...runWorkflowVars, email: e.target.value })}
                                placeholder="user@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="runPassword">Password (optional)</Label>
                            <Input
                                id="runPassword"
                                type="password"
                                value={runWorkflowVars.password || ''}
                                onChange={(e) => setRunWorkflowVars({ ...runWorkflowVars, password: e.target.value })}
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="text-xs text-muted-foreground">
                            These variables will be available in workflow nodes as <code className="bg-muted px-1 rounded">{'{{vars.email}}'}</code> and <code className="bg-muted px-1 rounded">{'{{vars.password}}'}</code>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setRunWorkflowDialogOpen(false)
                                setRunWorkflowProfileId(null)
                                setRunWorkflowId(null)
                                setRunWorkflowProfileIds([])
                                setRunWorkflowVars({})
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={confirmRunWorkflow}>
                            <Play className="mr-2 h-4 w-4" />
                            Run Workflow
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Import Account Modal */}
            <ImportAccountModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={loadProfiles}
            />

        </div>
    )
}
