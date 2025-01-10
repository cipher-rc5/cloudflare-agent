import React from 'react';
import { memo, useCallback, useState } from 'react';
import { Handle, Position, NodeResizer, NodeProps } from 'reactflow';

interface GroupNodeData {
  label: string;
  width?: number;
  height?: number;
  color?: string;
  isExpanded?: boolean;
  children?: any[];
  isHighlighted?: boolean;
  groupId?: string; 
}

const LabeledGroupNode = ({
  data,
  selected,
  dragging,
}: NodeProps<GroupNodeData>) => {
  const [isExpanded, setIsExpanded] = useState(data.isExpanded ?? true);
  
  const toggleExpanded = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  const nodeColor = data.color || '#eee';
  const width = data.width || 200;
  const height = data.height || 200;

  // Add highlight styles
  const highlightStyle = data.isHighlighted ? {
    boxShadow: '0 0 0 2px #ff9900',
    border: '2px solid #ff9900'
  } : {};

  // Add group color indication
  const groupStyle = data.groupId ? {
    borderLeft: `4px solid ${getGroupColor(data.groupId)}` // Helper function to get color based on groupId
  } : {};

  return (
    <div
      className={`
        group relative rounded-md border-2 border-gray-300 bg-white 
        ${dragging ? 'cursor-grabbing' : 'cursor-grab'}
        ${selected ? 'border-blue-500 shadow-lg' : ''}
      `}
      style={{
        width: isExpanded ? width : 180,
        height: isExpanded ? height : 40,
        backgroundColor: nodeColor,
        transition: 'width 0.2s, height 0.2s',
      }}
    >
      {/* Handles for connections */}
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />

      {/* Node resizer */}
      <NodeResizer
        minWidth={180}
        minHeight={40}
        isVisible={selected}
        lineClassName="border-blue-400"
        handleClassName="h-3 w-3 bg-white border-2 border-blue-400"
      />

      {/* Header section */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200">
        <div className="text-sm font-medium text-gray-700">{data.label}</div>
        <button
          className="p-1 hover:bg-gray-100 rounded"
          onClick={toggleExpanded}
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {/* Content section */}
      {isExpanded && data.children && (
        <div className="p-4">
          {/* Render child nodes or content here */}
          {data.children.map((child: any, index: number) => (
            <div key={index} className="mb-2">
              {JSON.stringify(child)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Helper function to generate consistent colors for groups
const getGroupColor = (groupId: string) => {
  const colors = [
    '#ff0000', '#00ff00', '#0000ff', '#ffff00', 
    '#ff00ff', '#00ffff', '#ff9900', '#9900ff'
  ];
  const index = Math.abs(hashString(groupId)) % colors.length;
  return colors[index];
};

// Simple hash function for consistent color assignment
const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
};

// Usage example:
const nodeTypes = {
  groupNode: LabeledGroupNode,
};

// Example data structure with highlighting and grouping:
const exampleNode = {
  id: 'group-1',
  type: 'groupNode',
  position: { x: 100, y: 100 },
  data: {
    label: 'Group 1',
    color: '#f0f9ff',
    width: 300,
    height: 400,
    isHighlighted: true, // Add this to highlight
    groupId: 'group-a', // Add this to group
    children: [
      { id: 'child-1', label: 'Child Node 1' },
      { id: 'child-2', label: 'Child Node 2' }
    ]
  }
};

export default memo(LabeledGroupNode);
export type { GroupNodeData };
export { nodeTypes };
