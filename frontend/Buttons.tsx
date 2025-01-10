import { Panel, PanelPosition, useReactFlow } from '@xyflow/react';
import React from 'react';
import type { MouseEvent } from 'react';

interface ButtonsProps {
  className?: string;
  position?: PanelPosition;
}

const Buttons: React.FC<ButtonsProps> = ({ className = '', position = 'top-left' }) => {
  const { zoomIn, zoomOut, setCenter, getNodes } = useReactFlow();

  const focusNode = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const nodes = getNodes();

    if (nodes.length > 0) {
      const node = nodes[0];
      const width = node.width ?? 150; // Default width if not specified
      const height = node.height ?? 40; // Default height if not specified
      const x = node.position.x + width / 2;
      const y = node.position.y + height / 2;

      setCenter(x, y, { zoom: 1.85, duration: 800 });
    }
  };

  const handleZoomIn = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    zoomIn({ duration: 300 });
  };

  const handleZoomOut = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    zoomOut({ duration: 300 });
  };

  return (
    <Panel position={position} className={className}>
      <div className='flex flex-col gap-2'>
        <div className='text-sm text-gray-600'>Flow Controls</div>
        <div className='flex gap-2'>
          <button
            onClick={focusNode}
            className='px-3 py-1 text-sm bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'>
            Focus Node
          </button>
          <button
            onClick={handleZoomIn}
            className='px-3 py-1 text-sm bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'>
            Zoom In
          </button>
          <button
            onClick={handleZoomOut}
            className='px-3 py-1 text-sm bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'>
            Zoom Out
          </button>
        </div>
      </div>
    </Panel>
  );
};

export default Buttons;
