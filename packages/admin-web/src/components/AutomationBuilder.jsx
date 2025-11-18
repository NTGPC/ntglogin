import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Bắt đầu' } },
  { id: '2', position: { x: 0, y: 100 }, data: { label: 'Mở trang Google.com' } },
];

const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

function AutomationBuilder() {
  return (
    <div className="h-[80vh] w-full border border-gray-200 dark:border-[#2a2a2a] rounded-lg overflow-hidden">
      <ReactFlow nodes={initialNodes} edges={initialEdges} fitView>
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

export default AutomationBuilder;

