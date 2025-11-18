import React from 'react'
import { Handle, Position } from 'reactflow'
import { LuPlay, LuSquare, LuGitMerge, LuGlobe, LuMousePointerClick, LuType, LuImage, LuX, LuTimer, LuWebhook, LuWorkflow } from 'react-icons/lu'

type RectNodeProps = { data?: any; type?: string; title: string; icon: React.ReactNode }

const Box: React.FC<RectNodeProps> = ({ data, title, icon }) => {
  return (
    <div className="bg-white border rounded-md shadow-sm px-3 py-2 min-w-[180px]">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 flex items-center justify-center text-blue-600">{icon}</div>
        <div className="text-sm font-medium">{title}</div>
      </div>
      {data?.subtitle && <div className="text-[11px] text-gray-500 mt-1">{data.subtitle}</div>}
    </div>
  )
}

function withHandles(Component: React.FC<any>, opts: { input?: boolean; output?: boolean }) {
  return (props: any) => (
    <div className="relative">
      {opts.input && <Handle type="target" position={Position.Left} id="in" />}
      <Component {...props} />
      {opts.output && <Handle type="source" position={Position.Right} id="out" />}
    </div>
  )
}

export const nodeTypes = {
  start: withHandles((props: any) => <Box {...props} title="Start" icon={<LuPlay size={16} />} />, { input: false, output: true }),
  end: withHandles((props: any) => <Box {...props} title="End" icon={<LuX size={16} />} />, { input: true, output: false }),
  merge: withHandles((props: any) => <Box {...props} title="Merge" icon={<LuGitMerge size={16} />} />, { input: true, output: true }),

  openPage: withHandles((props: any) => <Box {...props} title="Open Page" icon={<LuGlobe size={16} />} />, { input: true, output: true }),
  closePage: withHandles((props: any) => <Box {...props} title="Close Page" icon={<LuX size={16} />} />, { input: true, output: true }),
  waitSelector: withHandles((props: any) => <Box {...props} title="Wait Selector" icon={<LuTimer size={16} />} />, { input: true, output: true }),
  click: withHandles((props: any) => <Box {...props} title="Click" icon={<LuMousePointerClick size={16} />} />, { input: true, output: true }),
  typeText: withHandles((props: any) => <Box {...props} title="Type Text" icon={<LuType size={16} />} />, { input: true, output: true }),
  screenshot: withHandles((props: any) => <Box {...props} title="Screenshot" icon={<LuImage size={16} />} />, { input: true, output: true }),
}



