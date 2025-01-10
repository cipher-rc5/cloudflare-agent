import { Handle, NodeProps, Position } from '@xyflow/react';
import React from 'react';
import { Root } from './DnDContext';

export interface CustomNodeData {
  label: string;
  nodeType?: keyof Root;
}

const CustomNode = ({ data, isConnectable }: NodeProps) => {
  const nodeData = data as unknown as CustomNodeData;

  return (
    <div
      style={{
        padding: '10px',
        borderRadius: '3px',
        border: '1px solid #ddd',
        background: 'white',
        minWidth: '150px'
      }}>
      <Handle type='target' position={Position.Top} isConnectable={isConnectable} />
      <div style={{ fontWeight: 500, textAlign: 'center' }}>{nodeData.label}</div>
      <Handle type='source' position={Position.Bottom} isConnectable={isConnectable} />
    </div>
  );
};

export default CustomNode;
