import { Controls, MiniMap, Panel, ReactFlowProvider } from '@xyflow/react';
import Buttons from './Buttons';
import Flow from './Flow';
import '@xyflow/react/dist/style.css';
import './styles.css';
import React from 'react';

const App = () => (
  <div style={{ width: '100vw', height: '100vh' }}>
    <ReactFlowProvider>
      <Flow />
      <Buttons />
      <Panel position='top-right'>
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
        <div style={{ marginTop: '8px' }}>
          <Controls />
        </div>
      </Panel>
    </ReactFlowProvider>
  </div>
);

export default App;
