# ProfileEditor Component

Component để chỉnh sửa profile với layout tabs bên trái và Overview panel bên phải.

## Cấu trúc

```
ProfileEditor/
├── ProfileEditor.tsx      # Component chính
├── OverviewPanel.tsx      # Panel overview bên phải (realtime updates)
├── GeneralTab.tsx        # Tab General
├── ProxyTab.tsx          # Tab Proxy
├── AdvancedTab.tsx       # Tab Advanced
├── FingerprintTab.tsx   # Tab Fingerprint
├── types.ts              # TypeScript types
└── index.ts              # Exports
```

## Usage

```tsx
import { ProfileEditor } from '@/components/ProfileEditor'
import { api, Proxy } from '@/lib/api'

function MyComponent() {
  const [proxies, setProxies] = useState<Proxy[]>([])

  useEffect(() => {
    api.getProxies().then(setProxies)
  }, [])

  const handleSave = async (data: ProfileEditorData) => {
    await api.createProfile({
      name: data.name,
      user_agent: data.userAgent,
      // ... map other fields
    })
  }

  return (
    <ProfileEditor
      initialData={{
        name: 'My Profile',
        proxyMode: 'manual',
      }}
      proxies={proxies}
      onSave={handleSave}
      onCancel={() => console.log('Cancelled')}
    />
  )
}
```

## Props

- `initialData?: Partial<ProfileEditorData>` - Dữ liệu ban đầu
- `proxies?: Proxy[]` - Danh sách proxies để chọn trong Proxy tab
- `onSave?: (data: ProfileEditorData) => void | Promise<void>` - Callback khi save
- `onCancel?: () => void` - Callback khi cancel

## Features

- ✅ 4 tabs: General, Proxy, Advanced, Fingerprint
- ✅ Overview panel cập nhật realtime
- ✅ Type-safe với TypeScript
- ✅ TailwindCSS styling
- ✅ Tích hợp với Shadcn UI components

