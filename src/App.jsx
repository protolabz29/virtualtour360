import React from 'react';
import PanoramaViewer from './components/PanoramaViewer';
import panoramas from './data/panoramas';


export default function App() {
  return (
    <div className="h-screen bg-gray-900">
      <PanoramaViewer panoramas={panoramas} />
    </div>
  );
}
