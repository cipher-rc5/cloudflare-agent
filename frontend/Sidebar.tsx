import React from 'react';
import { useDnD } from './DnDContext';
import type { Root } from './DnDContext';

const nodeTypes: Array<{ type: keyof Root, label: string, category: 'data' | 'settings' | 'content' }> = [
  { type: 'name', label: 'Character Name', category: 'data' },
  { type: 'clients', label: 'Clients Node', category: 'data' },
  { type: 'model_provider', label: 'Model Provider', category: 'settings' },
  { type: 'settings', label: 'Settings Node', category: 'settings' },
  { type: 'people', label: 'People Node', category: 'data' },
  { type: 'plugins', label: 'Plugins Node', category: 'settings' },
  { type: 'bio', label: 'Bio Node', category: 'content' },
  { type: 'lore', label: 'Lore Node', category: 'content' },
  { type: 'knowledge', label: 'Knowledge Node', category: 'content' },
  { type: 'messages_example', label: 'Message Examples', category: 'content' },
  { type: 'posts_example', label: 'Post Examples', category: 'content' },
  { type: 'topics', label: 'Topics Node', category: 'content' },
  { type: 'style', label: 'Style Node', category: 'content' },
  { type: 'adjectives', label: 'Adjectives Node', category: 'content' }
];

const Sidebar = () => {
  const { setType } = useDnD();

  const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: keyof Root) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
    setType(nodeType);
  };

  return (
    <aside
      style={{ width: '20%', height: '100%', padding: '15px', borderRight: '1px solid #eee', background: 'white' }}>
      <div style={{ marginBottom: '20px', color: '#666' }}>Drag nodes to the canvas to create your flow</div>

      {['data', 'settings', 'content'].map((category) => (
        <div key={category}>
          <h3
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#333',
              marginTop: '20px',
              marginBottom: '10px',
              textTransform: 'uppercase'
            }}>
            {category}
          </h3>
          {nodeTypes.filter((node) => node.category === category).map((node) => (
            <div
              key={node.type}
              draggable
              onDragStart={(event) => onDragStart(event, node.type)}
              style={{
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                marginBottom: '8px',
                background: '#f8fafc',
                cursor: 'grab',
                transition: 'all 0.2s'
              }}>
              {node.label}
            </div>
          ))}
        </div>
      ))}
    </aside>
  );
};

export default Sidebar;
