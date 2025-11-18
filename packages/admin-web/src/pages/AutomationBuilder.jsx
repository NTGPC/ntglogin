import React, { useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { workflowsApi } from '@/lib/workflows';

let id = 0;
const getId = () => `dndnode_${id++}`;

// Component Sidebar chứa các node có thể kéo
const Sidebar = ({ onSave, saving }) => {
  const onDragStart = (event, nodeType, nodeLabel) => {
    // Khi bắt đầu kéo, đính kèm dữ liệu vào sự kiện
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/label', nodeLabel);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside
      style={{
        borderRight: '1px solid #eee',
        padding: '15px',
        width: '200px',
        backgroundColor: '#fff',
        overflowY: 'auto',
        fontSize: '14px',
      }}
      className="dark:bg-[#0a0a0a] dark:border-[#2a2a2a]"
    >
      <div style={{ marginBottom: '10px', fontWeight: 'bold' }} className="dark:text-foreground">
        Các khối lệnh
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Start Node */}
        <div
          onDragStart={(event) => onDragStart(event, 'input', 'Bắt đầu')}
          draggable
          style={{
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#fff',
            cursor: 'grab',
            textAlign: 'left',
          }}
          className="dark:bg-[#1a1a1a] dark:border-[#2a2a2a] dark:text-foreground hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
        >
          Bắt đầu
        </div>

        {/* Open URL Node */}
        <div
          onDragStart={(event) => onDragStart(event, 'default', 'Mở URL')}
          draggable
          style={{
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#fff',
            cursor: 'grab',
            textAlign: 'left',
          }}
          className="dark:bg-[#1a1a1a] dark:border-[#2a2a2a] dark:text-foreground hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
        >
          Mở URL
        </div>

        {/* Click Node */}
        <div
          onDragStart={(event) => onDragStart(event, 'default', 'Click Element')}
          draggable
          style={{
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#fff',
            cursor: 'grab',
            textAlign: 'left',
          }}
          className="dark:bg-[#1a1a1a] dark:border-[#2a2a2a] dark:text-foreground hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
        >
          Click Element
        </div>

        {/* Type Node */}
        <div
          onDragStart={(event) => onDragStart(event, 'default', 'Nhập Chữ')}
          draggable
          style={{
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#fff',
            cursor: 'grab',
            textAlign: 'left',
          }}
          className="dark:bg-[#1a1a1a] dark:border-[#2a2a2a] dark:text-foreground hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
        >
          Nhập Chữ
        </div>

        {/* Wait Node */}
        <div
          onDragStart={(event) => onDragStart(event, 'default', 'Chờ')}
          draggable
          style={{
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#fff',
            cursor: 'grab',
            textAlign: 'left',
          }}
          className="dark:bg-[#1a1a1a] dark:border-[#2a2a2a] dark:text-foreground hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
        >
          Chờ
        </div>

        {/* End Node */}
        <div
          onDragStart={(event) => onDragStart(event, 'output', 'Kết thúc')}
          draggable
          style={{
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#fff',
            cursor: 'grab',
            textAlign: 'left',
          }}
          className="dark:bg-[#1a1a1a] dark:border-[#2a2a2a] dark:text-foreground hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
        >
          Kết thúc
        </div>

        {/* Nút Lưu Kịch bản */}
        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }} className="dark:border-[#2a2a2a]">
          <button
            onClick={onSave}
            disabled={saving}
            style={{
              padding: '10px',
              border: '1px solid #4CAF50',
              borderRadius: '4px',
              backgroundColor: saving ? '#ccc' : '#4CAF50',
              color: '#fff',
              cursor: saving ? 'not-allowed' : 'pointer',
              textAlign: 'center',
              width: '100%',
              fontWeight: 'bold',
            }}
            className="dark:bg-[#4CAF50] dark:border-[#4CAF50] hover:bg-[#45a049] dark:hover:bg-[#45a049] disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : 'Lưu Kịch bản'}
          </button>
        </div>
      </div>
    </aside>
  );
};

const DnDFlow = ({ profileId }) => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [saving, setSaving] = useState(false);
  const { getNodes, getEdges } = useReactFlow();

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);

  // Hàm này cực kỳ quan trọng, nó ngăn chặn hành vi mặc định của trình duyệt
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Hàm xử lý khi thả node vào khung vẽ
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/label');

      // Kiểm tra xem có phải là loại node hợp lệ không
      if (typeof type === 'undefined' || !type) {
        return;
      }

      // Tính toán vị trí thả node trên khung vẽ
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = {
        id: getId(),
        type, // 'input', 'output', hoặc 'default'
        position,
        data: { label: `${label}` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance]
  );

  // Hàm lưu kịch bản
  const handleSave = async () => {
    try {
      setSaving(true);

      // Sử dụng useReactFlow để lấy dữ liệu mới nhất
      const nodesData = getNodes();
      const edgesData = getEdges();

      const workflowData = {
        nodes: nodesData,
        edges: edgesData,
      };

      console.log("Đang lưu kịch bản:", JSON.stringify(workflowData, null, 2));

      // Tạo workflow mới với tên tự động
      const workflowName = profileId
        ? `Automation for Profile ${profileId}`
        : `Automation ${new Date().toLocaleString()}`;

      const payload = {
        name: workflowName,
        data: workflowData,
      };

      const savedWorkflow = await workflowsApi.create(payload);
      console.log("Đã lưu workflow:", savedWorkflow);

      alert('Đã lưu kịch bản thành công!');
    } catch (error) {
      console.error('Lỗi khi lưu kịch bản:', error);
      let errorMessage = 'Không thể lưu kịch bản';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object' && 'response' in error) {
        const err = error;
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
      }

      alert(`Lỗi: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '90vh' }}>
      <div className="reactflow-wrapper" ref={reactFlowWrapper} style={{ flexGrow: 1, height: '100%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance} // Lấy instance của React Flow
          onDrop={onDrop}
          onDragOver={onDragOver}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>
      <Sidebar onSave={handleSave} saving={saving} />
    </div>
  );
};

// Component chính để xuất ra
export default function AutomationBuilder() {
  const { profileId } = useParams();

  return (
    <ReactFlowProvider>
      <DnDFlow profileId={profileId} />
    </ReactFlowProvider>
  );
}
