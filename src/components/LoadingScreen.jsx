import React from 'react';


export default function LoadingScreen() {
  return (
    <div className="flex items-center justify-center w-full h-full bg-black text-white">
      <div className="text-center">
        <div className="mb-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
        <p className="text-lg">Loading panorama...</p>
      </div>
    </div>
  );
}