// ContextMenu.tsx
import { useReactFlow, Node, XYPosition } from '@xyflow/react';
import React, { useCallback } from 'react';

interface ContextMenuProps {
  id: string;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
}

export default function ContextMenu({ id, top, left, right, bottom }: ContextMenuProps) {
  const { getNode, setNodes, addNodes, setEdges } = useReactFlow();

  const duplicateNode = useCallback(() => {
    const node = getNode(id);
    if (!node) return;

    const position: XYPosition = {
      x: node.position.x + 50,
      y: node.position.y + 50,
    };

    addNodes([{
      ...node,
      id: `${node.id}-copy`,
      position,
      selected: false,
      data: { ...node.data },
    }]);
  }, [id, getNode, addNodes]);

  const deleteNode = useCallback(() => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
    setEdges((edges) => edges.filter((edge) => edge.source !== id));
  }, [id, setNodes, setEdges]);

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left,
        right,
        bottom,
        zIndex: 1000,
        background: 'white',
        padding: '10px',
        borderRadius: '4px',
        boxShadow: '0 0 10px rgba(0,0,0,0.3)'
      }}
    >
      <p style={{ margin: '0.5em' }}>
        <small>node: {id}</small>
      </p>
      <button onClick={duplicateNode}>duplicate</button>
      <button onClick={deleteNode}>delete</button>
    </div>
  );
}
