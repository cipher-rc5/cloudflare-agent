import { addEdge, Background, Connection, Controls, Edge, MiniMap, Node, NodeTypes, ReactFlow, useEdgesState, useNodesState } from '@xyflow/react';
import React, { DragEvent, useCallback, useState } from 'react';
import ContextMenu from './ContextMenu';
import CustomNode from './CustomNode';
import { DnDProvider, Root, useDnD } from './DnDContext';
import Sidebar from './Sidebar';

interface CustomNodeData extends Record<string, unknown> {
  label: string;
  nodeType?: keyof Root;
}

const nodeTypes: NodeTypes = {};

const initialNodes: Node<CustomNodeData>[] = [
  { id: '1', type: 'input', data: { label: 'Node 1' }, position: { x: 250, y: 5 } },
  { id: '2', data: { label: 'Node 2' }, position: { x: 100, y: 100 } },
  { id: '3', data: { label: 'Node 3' }, position: { x: 400, y: 100 } },
  { id: '4', type: 'custom', data: { label: 'Custom Node' }, position: { x: 400, y: 200 } }
];

const initialEdges: Edge[] = [{ id: 'e1-2', source: '1', target: '2', animated: true }, {
  id: 'e1-3',
  source: '1',
  target: '3'
}];

interface ContextMenuInfo {
  id: string;
  top: number;
  left: number;
}

const bgColor = '#c9f1dd';

const Flow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<CustomNodeData>>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const { type } = useDnD();

  const onConnect = (params: Edge | Connection) => setEdges((els) => addEdge(params, els));
  const [contextMenu, setContextMenu] = useState<ContextMenuInfo | null>(null);

  const onDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    const reactFlowWrapper = document.querySelector('.react-flow');
    if (!reactFlowWrapper) return;

    const bounds = reactFlowWrapper.getBoundingClientRect();
    const nodeType = event.dataTransfer.getData('application/reactflow') as keyof Root;
    const position = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };

    // Remove nodeConfig lookup since nodeTypes is an object, not an array
    const newNode: Node<CustomNodeData> = {
      id: `${nodeType}-${nodes.length + 1}`,
      type: 'custom',
      position,
      data: { label: `${nodeType} Node`, nodeType: nodeType }
    };

    setNodes((prevNodes) => [...prevNodes, newNode]);
  }, [setNodes, nodes.length]);

  const getNodeStrokeColor = (n: Node): string => {
    if (n.type === 'input') return '#0041d0';
    if (n.type === 'selectorNode') return bgColor;
    if (n.type === 'output') return '#ff0072';
    return '#000000';
  };

  const getNodeColor = (n: Node): string => {
    if (n.type === 'selectorNode') return bgColor;
    return '#fff';
  };

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({ id: node.id, top: event.clientY, left: event.clientX });
  }, []);

  const onPaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <DnDProvider>
      <div style={{ display: 'flex', width: '100vw', height: '100vh' }}>
        <div style={{ flex: 1, height: '100%' }} className='react-flow-wrapper'>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeContextMenu={onNodeContextMenu}
            onPaneClick={onPaneClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            fitView
            style={{ background: '#f9fafb' }}>
            <MiniMap nodeStrokeColor={getNodeStrokeColor} nodeColor={getNodeColor} />
            <Controls />
            <Background />
            {contextMenu && <ContextMenu id={contextMenu.id} top={contextMenu.top} left={contextMenu.left} />}
          </ReactFlow>
        </div>
        <Sidebar />
      </div>
    </DnDProvider>
  );
};

export default Flow;
