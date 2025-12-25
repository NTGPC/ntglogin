import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    MiniMap,
    Background,
    useReactFlow,
    ConnectionMode,
    BackgroundVariant,
    Node,
    Handle,
    Position,
    MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';

// Import Icons
import {
    ArrowLeft, Search, Save, Play,
    Globe, MousePointer, Type, Camera, XCircle,
    Settings, X, Trash2, Clock, UploadCloud
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { apiRequest } from '../utils/api'; // Import API Thật

// --- 1. CUSTOM NODE (GIAO DIỆN ĐẸP) ---
const CustomNode = ({ data, selected }: any) => {
    const icons: any = {
        'Start': <Play size={20} className="text-white fill-current" />,
        'End': <XCircle size={20} className="text-white" />,
        'Open Page': <Globe size={20} className="text-blue-600" />,
        'Click Element': <MousePointer size={20} className="text-orange-600" />,
        'Type Text': <Type size={20} className="text-purple-600" />,
        'Screenshot': <Camera size={20} className="text-pink-600" />,
        'Wait': <Clock size={20} className="text-gray-600" />
    };

    const iconBg: any = {
        'Start': 'bg-green-500',
        'End': 'bg-red-500',
        'Open Page': 'bg-blue-100',
        'Click Element': 'bg-orange-100',
        'Type Text': 'bg-purple-100',
        'Screenshot': 'bg-pink-100',
        'Wait': 'bg-gray-100'
    };

    return (
        <div className={`
            relative flex items-center gap-3 px-4 py-4 rounded-xl shadow-md bg-white border-2 transition-all duration-200 min-w-[220px]
            ${selected ? 'border-teal-500 ring-4 ring-teal-500/20 shadow-xl scale-105' : 'border-slate-100 hover:border-slate-300'}
        `}>
            {data.label !== 'Start' && (
                <Handle type="target" position={Position.Left} className="!w-4 !h-4 !bg-slate-400 !border-4 !border-white hover:!bg-teal-500 transition-colors -ml-2" />
            )}
            <div className={`w-12 h-12 flex items-center justify-center rounded-xl shadow-inner ${iconBg[data.label] || 'bg-slate-100'}`}>
                {icons[data.label] || <Settings size={20} className="text-slate-500" />}
            </div>
            <div className="flex-1 overflow-hidden">
                <div className="text-sm font-extrabold text-slate-700 leading-tight">{data.label}</div>
                <div className="text-[11px] text-slate-400 font-medium truncate mt-1">
                    {data.url || data.selector || data.text || (data.label === 'Start' ? 'Bắt đầu luồng' : 'Chưa cấu hình')}
                </div>
            </div>
            {data.label !== 'End' && (
                <Handle type="source" position={Position.Right} className="!w-4 !h-4 !bg-teal-500 !border-4 !border-white hover:!scale-125 transition-transform -mr-2" />
            )}
        </div>
    );
};

const ACTION_TYPES = [
    { category: 'control', id: 'start', label: 'Start', description: 'Điểm bắt đầu', icon: Play, nodeType: 'custom', defaultData: { label: 'Start' } },
    { category: 'control', id: 'end', label: 'End', description: 'Kết thúc luồng', icon: XCircle, nodeType: 'custom', defaultData: { label: 'End' } },
    { category: 'navigation', id: 'openPage', label: 'Open Page', description: 'Truy cập URL', icon: Globe, nodeType: 'custom', defaultData: { label: 'Open Page', url: 'https://google.com' } },
    { category: 'interaction', id: 'click', label: 'Click Element', description: 'Click vào phần tử', icon: MousePointer, nodeType: 'custom', defaultData: { label: 'Click Element', selector: '' } },
    { category: 'interaction', id: 'typeText', label: 'Type Text', description: 'Nhập văn bản', icon: Type, nodeType: 'custom', defaultData: { label: 'Type Text', selector: '', text: '' } },
    { category: 'interaction', id: 'wait', label: 'Wait', description: 'Chờ đợi (ms)', icon: Clock, nodeType: 'custom', defaultData: { label: 'Wait', time: 1000 } },
    { category: 'output', id: 'screenshot', label: 'Screenshot', description: 'Chụp màn hình', icon: Camera, nodeType: 'custom', defaultData: { label: 'Screenshot', filename: 'capture.png' } },
];

// --- RIGHT PANEL (CONFIG) ---
const RightPanel = ({ selectedNode, setNodes, setSelectedNode }: any) => {
    const updateNodeData = (key: string, value: any) => {
        setNodes((nds: Node[]) =>
            nds.map((node) => {
                if (node.id === selectedNode.id) {
                    node.data = { ...node.data, [key]: value };
                    return { ...node, data: { ...node.data, [key]: value } };
                }
                return node;
            })
        );
    };

    const handleDelete = () => {
        setNodes((nds: Node[]) => nds.filter((n) => n.id !== selectedNode.id));
        setSelectedNode(null);
    };

    if (!selectedNode) return null;

    return (
        <div className="w-80 bg-white border-l border-gray-200 h-full shadow-2xl flex flex-col z-20 animate-in slide-in-from-right duration-300">
            <div className="h-16 border-b flex items-center justify-between px-6 bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg"><Settings size={20} className="text-teal-600" /> Cấu hình</h3>
                <button onClick={() => setSelectedNode(null)}><X size={20} className="text-slate-400 hover:text-red-500" /></button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
                <div className="bg-teal-50 p-4 rounded-xl border border-teal-100 text-center">
                    <div className="text-xs font-bold text-teal-600 uppercase mb-1">SELECTED NODE</div>
                    <div className="font-black text-teal-900 text-xl">{selectedNode.data.label}</div>
                </div>

                <div className="space-y-5">
                    {selectedNode.data.label === 'Open Page' && (
                        <div><Label className="mb-2 block font-bold text-slate-700">URL Website</Label><Input value={selectedNode.data.url} onChange={(e) => updateNodeData('url', e.target.value)} placeholder="https://example.com" /></div>
                    )}
                    {selectedNode.data.label === 'Click Element' && (
                        <div><Label className="mb-2 block font-bold text-slate-700">Selector</Label><Input value={selectedNode.data.selector} onChange={(e) => updateNodeData('selector', e.target.value)} placeholder="#btn-submit" /></div>
                    )}
                    {selectedNode.data.label === 'Type Text' && (
                        <>
                            <div><Label className="mb-2 block font-bold text-slate-700">Selector</Label><Input value={selectedNode.data.selector} onChange={(e) => updateNodeData('selector', e.target.value)} placeholder="#username" /></div>
                            <div><Label className="mb-2 block font-bold text-slate-700 mt-4">Text Value</Label><Input value={selectedNode.data.text} onChange={(e) => updateNodeData('text', e.target.value)} placeholder="Hello..." /></div>
                        </>
                    )}
                    {selectedNode.data.label === 'Wait' && (
                        <div><Label className="mb-2 block font-bold text-slate-700">Time (ms)</Label><Input type="number" value={selectedNode.data.time} onChange={(e) => updateNodeData('time', e.target.value)} placeholder="1000" /></div>
                    )}
                </div>
            </div>

            <div className="p-6 border-t bg-slate-50">
                <Button variant="destructive" className="w-full flex items-center gap-2 h-12 font-bold text-md rounded-xl" onClick={handleDelete}>
                    <Trash2 size={18} /> Xóa Node Này
                </Button>
            </div>
        </div>
    );
};

// --- MAIN FLOW ---
const DnDFlow = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([{ id: '1', position: { x: 400, y: 300 }, data: { label: 'Start' }, type: 'custom' }]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [name, setName] = useState('New Workflow');
    const [saving, setSaving] = useState(false);

    const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);
    const defaultEdgeOptions = { type: 'smoothstep', animated: true, style: { stroke: '#0d9488', strokeWidth: 2.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#0d9488' } };

    const onConnect = useCallback((params: any) => setEdges((eds) => addEdge(params, eds)), []);

    const onDragOver = useCallback((event: any) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }, []);
    const onDrop = useCallback((event: any) => {
        event.preventDefault();
        const type = event.dataTransfer.getData('application/reactflow');
        const actionId = event.dataTransfer.getData('application/actionId');
        if (!type) return;

        const position = reactFlowInstance.project({
            x: event.clientX - reactFlowWrapper.current.getBoundingClientRect().left,
            y: event.clientY - reactFlowWrapper.current.getBoundingClientRect().top,
        });
        const actionConfig = ACTION_TYPES.find(a => a.id === actionId);
        const newNode = { id: `node_${Date.now()}`, type: 'custom', position, data: { label: actionConfig?.label, ...actionConfig?.defaultData } };
        setNodes((nds) => nds.concat(newNode));
    }, [reactFlowInstance]);

    const onDragStart = (event: any, nodeType: string, actionId: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/actionId', actionId);
        event.dataTransfer.effectAllowed = 'move';
    };

    // --- LOGIC GỌI API THẬT ---
    const handleSave = async () => {
        try {
            setSaving(true);
            // Lưu xuống Docker Port 4000
            const res = await apiRequest('/workflows', 'POST', {
                id: id === 'new' ? undefined : id,
                name, nodes, edges
            });

            if (res.success) {
                alert("✅ Đã lưu thành công vào Database!");
                if (!id || id === 'new') navigate(`/dashboard/workflows/${res.data.id}`);
            } else {
                alert('❌ Lỗi Server: ' + res.error);
            }
        } catch (e: any) {
            alert('Lỗi kết nối: ' + e.message);
        } finally { setSaving(false); }
    };

    useEffect(() => {
        if (id && id !== 'new') {
            apiRequest('/workflows', 'GET').then(res => {
                if (res.success) {
                    const wf = res.data.find((w: any) => w.id === Number(id));
                    if (wf) {
                        setName(wf.name);
                        setNodes(JSON.parse(wf.nodes));
                        setEdges(JSON.parse(wf.edges));
                    }
                }
            });
        }
    }, [id]);

    return (
        <div className="fixed inset-0 bg-background flex flex-col z-50 font-sans bg-slate-50">
            <div className="h-16 border-b px-6 flex items-center justify-between bg-white shadow-sm z-30">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/workflows')} className="hover:bg-slate-100 border"><ArrowLeft className="h-5 w-5 text-slate-700" /></Button>
                    <div className="h-6 w-px bg-slate-200"></div>
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="font-bold border-none shadow-none focus-visible:ring-0 w-80 px-0 text-xl text-slate-800" />
                </div>
                <div className="flex gap-2">
                    <Button size="sm" className="bg-teal-600 hover:bg-teal-700 gap-2 text-white shadow-lg" onClick={handleSave} disabled={saving}>
                        {saving ? 'Đang lưu...' : <><UploadCloud className="w-4 h-4" /> Lưu Kịch Bản</>}
                    </Button>
                </div>
            </div>
            <div className="flex-1 flex overflow-hidden relative">
                <div className="w-64 border-r bg-white flex flex-col shadow-xl z-10">
                    <div className="p-4 border-b bg-slate-50/50"><h3 className="font-bold text-xs text-slate-500 uppercase">Toolbox</h3></div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {ACTION_TYPES.map(action => (
                            <div key={action.id} draggable onDragStart={(e) => onDragStart(e, action.nodeType, action.id)} className="group flex items-center gap-3 p-3 bg-white border rounded-xl cursor-grab hover:shadow-md transition-all">
                                <div className="p-1.5 rounded-lg bg-slate-50"><action.icon size={16} /></div>
                                <div className="text-sm font-bold text-slate-700">{action.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex-1 bg-slate-100/50 relative" ref={reactFlowWrapper}>
                    <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onInit={setReactFlowInstance} onDrop={onDrop} onDragOver={onDragOver} onNodeClick={(_, n) => setSelectedNode(n)} nodeTypes={nodeTypes} defaultEdgeOptions={defaultEdgeOptions} connectionMode={ConnectionMode.Loose} deleteKeyCode={['Backspace', 'Delete']} fitView>
                        <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="#cbd5e1" />
                        <Controls className="bg-white shadow-xl" />
                        <MiniMap className="border-2 border-slate-200 rounded-xl shadow-xl m-4" />
                    </ReactFlow>
                </div>
                {selectedNode && <div className="absolute right-0 top-0 bottom-0 h-full flex"><RightPanel selectedNode={selectedNode} setNodes={setNodes} setSelectedNode={setSelectedNode} /></div>}
            </div>
        </div>
    );
};

export default function AutomationBuilder() { return <ReactFlowProvider><DnDFlow /></ReactFlowProvider>; }