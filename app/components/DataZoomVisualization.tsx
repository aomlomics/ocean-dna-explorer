"use client";

import React, { useState, useCallback } from 'react';

// Define the zoom levels
export type ZoomLevel = 'ocean' | 'ctd' | 'niskin' | 'dna' | 'analysis';

interface ZoomState {
  level: ZoomLevel;
  isAnimating: boolean;
}

interface MagnifyingGlassProps {
  onClick: () => void;
  className?: string;
}

const MagnifyingGlass: React.FC<MagnifyingGlassProps> = ({ onClick, className = "" }) => (
  <div 
    className={`absolute cursor-pointer hover:scale-110 transition-transform duration-200 ${className}`}
    onClick={onClick}
  >
    <div className="relative">
      <div className="w-12 h-12 rounded-full border-4 border-primary bg-primary/20 backdrop-blur-sm animate-pulse">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    </div>
  </div>
);

// Ocean Surface Level - Research Vessel
const OceanLevel: React.FC<{ onZoomIn: () => void }> = ({ onZoomIn }) => (
  <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-b from-sky-400 to-blue-600">
    <div className="relative">
      {/* Research Vessel SVG - Using the actual Catcher_Vessel4.svg */}
      <div className="relative">
        <svg viewBox="0 0 423.43 168.09" className="w-96 h-auto drop-shadow-lg">
          <g>
            <path className="fill-blue-900" d="M177.09,96.19c.85-1.5,18.16-54.31,18.16-54.31,0,0,6.1-3.1,18.75.15,10.81,2.79,15.96,6.24,15.96,6.24l-4.8,56.13"/>
            <path className="fill-blue-900" d="M419.8,119.51c-9.19-16.33-18.31-33.36-26.1-48.55-3.79-7.5-9.88-13.32-14.73-12.97-4.36.3-7.5,1.5-6.88,8.88,1.39,18,4.96,36.3,7.18,54.46.79,9.21,13.18,17.35,26.31,14.76,12.88-2.56,19-9.18,14.22-16.57h0ZM404.97,133.68c-9,2.17-18.1-5.08-19.09-13.15-2.39-16-4.89-31.95-7.5-47.85-1.27-8.13.66-8.88,3.99-9.37,3.33-.49,5.49,4.77,8.65,11.34,7.21,15,15.61,31.62,22.5,45,3.61,6.54.28,11.91-8.55,14.04h0Z"/>
            <polygon className="fill-blue-900" points="419.95 111.83 405.39 111.83 404.99 106.55 383.6 106.55 383.6 125.67 397.62 125.67 406.46 125.67 423.37 120.09 419.95 111.83"/>
            <path className="fill-blue-900" d="M330.5,119.7s-1.42-18.54-22.81-18.54c-19.69,0-33.31,2.41-37.5-2.4-6.94-7.87-19.36-6.09-19.36-6.09h-74.21v-28.29h-28.36l-11.43-7.5-37.75,7.8,5.79,8.73v19.26H1.5l27.82,27h0l50.17,48.3h325.48s5.79-6.69,11.13-20.77c3.29-8.79,5.75-17.88,7.33-27.13l-92.93-.36Z"/>
            <path className="fill-blue-700" d="M173.43,2.11c-2.61,11.17-5.53,22.27-8.47,33.39l-4.5,16.62-2.29,8.29c-.84,2.76-1.14,5.62-3.51,8.02l-1.75-.42c-.79-3.13.48-5.79,1.2-8.56l2.34-8.26,4.86-16.5c3.36-11.01,6.7-22,10.38-33l1.75.42Z"/>
            <path className="fill-blue-700" d="M276.54,35.11l-1.18-1.38c.56-1.48.85-3.05.85-4.63.05-7.21-5.75-13.09-12.96-13.14-7.21-.05-13.09,5.75-13.14,12.96-.01,1.65.29,3.28.88,4.81l-1.2,1.38,10.23,11.86v54h6.3v-54l10.21-11.86h0Z"/>
          </g>
        </svg>
        
        {/* Magnifying glass over the ship */}
        <MagnifyingGlass 
          onClick={onZoomIn}
          className="top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        />
      </div>
      
      {/* Fishing line going down */}
      <div className="absolute top-full left-1/2 w-1 h-32 bg-gray-700 transform -translate-x-1/2"></div>
    </div>
    
    <div className="absolute bottom-8 left-8 bg-black/70 text-white p-4 rounded-lg backdrop-blur-sm">
      <h3 className="text-xl font-bold text-primary">Research Project</h3>
      <p className="text-sm">Click the vessel to explore sample collection</p>
      <p className="text-xs text-gray-300 mt-1">Database: projects table</p>
    </div>
  </div>
);

// CTD Level - Underwater instrument
const CTDLevel: React.FC<{ onZoomIn: () => void; onZoomOut: () => void }> = ({ onZoomIn, onZoomOut }) => (
  <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-b from-blue-600 to-blue-900">
    <button 
      onClick={onZoomOut}
      className="absolute top-4 left-4 btn btn-sm btn-primary"
    >
      ← Back to Surface
    </button>
    
    <div className="relative">
      {/* CTD SVG */}
      <div className="relative">
        <img src="/images/icons/ctd_icon.svg" alt="CTD Instrument" className="w-120 h-auto" /> {/* Increased from w-48 to w-96 */}
        
        {/* Magnifying glass over the CTD */}
        <MagnifyingGlass 
          onClick={onZoomIn}
          className="top-2/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        />
      </div>
    </div>
    
    <div className="absolute bottom-8 left-8 bg-black/70 text-white p-4 rounded-lg backdrop-blur-sm">
      <h3 className="text-xl font-bold text-primary">CTD Rosette</h3>
      <p className="text-sm">Click the Niskin bottles to see individual samples</p>
      <p className="text-xs text-gray-300 mt-1">Database: sample metadata collection</p>
    </div>
  </div>
);

// Niskin Bottle Level - Sample container
const NiskinLevel: React.FC<{ onZoomIn: () => void; onZoomOut: () => void }> = ({ onZoomIn, onZoomOut }) => (
  <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-b from-blue-900 to-indigo-900">
    <button 
      onClick={onZoomOut}
      className="absolute top-4 left-4 btn btn-sm btn-primary"
    >
      ← Back to CTD
    </button>
    
    <div className="relative">
      {/* Niskin Bottle SVG - Using the actual niskin_icon.svg */}
      <div className="relative">
        <svg viewBox="0 0 401 1024" className="w-32 h-auto drop-shadow-lg">
          <g>
            <path className="fill-gray-300" d="M401,0v1024H0V0h401ZM239.4,177v-93.5c0-4.71-6.69-9.96-11.47-10.5-7.9-.89-30.11-1-37.81.09-3.04.43-9.57,4.88-9.57,7.41v95l-1.5,1.5h-35.41c-.89,4.75-1.87,9.68-.12,14.42l7.1,2.08-43.43,41.46c-3.56,5.05-2.64,13.47-2.49,19.58,4.36,183.94-1.13,367.96.99,552.01l7.07,9.95c0,2-3.75,3.95-3.88,6.16-.07,1.35,1.53,2.2,1.69,3.04.69,3.68-15.23,10.37-10.87,17.85.98,1.68,15.28,15.29,16.57,15.48,1.73.26,2.57-.14,3.99-.98,1.89-1.12,8.87-10.57,10.09-10.96,2.02-.64,4.32,1.36,6.59.77,1.72-.45,2.8-3.34,4.41-3.76,2.84-.74,6.06,4.75,8.27,6.41,1.21,2.83-5.51-.15-6.77,4.19-.67,2.31-.79,13.3,2.29,13.3h33.92l1.5,1.5v86c0,2.77,7.58,7.98,10.54,8.44,6.86,1.06,25.56.73,32.89.1,2.65-.23,8.28-1.23,10.39-2.58,1.34-.85,5.03-6.75,5.03-7.95v-85.5h34.41c3.09,0,2.86-10.15,2.3-12.31l-6.78-5.18,43.44-40.45,1.5-4.5-.04-566.08-2.03-5.01-42.88-39.98c-.33-3.51,5.48-.89,6.03-3.14-.71-4.56,1.53-10.78-1.54-14.34h-34.41Z"/>
            <path className="fill-gray-600" d="M239.4,177h34.41c3.08,3.57.83,9.79,1.54,14.34-.55,2.25-6.36-.37-6.03,3.14l42.88,39.98,2.03,5.01.04,566.08-1.5,4.5-43.44,40.45,6.78,5.18c.56,2.16.79,12.31-2.3,12.31h-34.41v85.5c0,1.2-3.7,7.1-5.03,7.95-2.11,1.35-7.74,2.36-10.39,2.58-7.33.62-26.03.96-32.89-.1-2.96-.46-10.54-5.67-10.54-8.44v-86l-1.5-1.5h-33.92c-3.09,0-2.97-10.99-2.29-13.3,1.27-4.34,7.98-1.36,6.77-4.19-2.21-1.66-5.44-7.15-8.27-6.41-1.61.42-2.68,3.31-4.41,3.76-2.27.59-4.57-1.41-6.59-.77-1.22.39-8.2,9.84-10.09,10.96-1.42.84-2.25,1.24-3.99.98-1.29-.19-15.59-13.8-16.57-15.48-4.37-7.48,11.55-14.18,10.87-17.85-.16-.84-1.76-1.69-1.69-3.04.12-2.21,3.87-4.16,3.88-6.16l-7.07-9.95c-2.12-184.05,3.38-368.07-.99-552.01-.14-6.11-1.07-14.53,2.49-19.58l43.43-41.46-7.1-2.08c-1.76-4.74-.77-9.66.12-14.42h35.41l1.5-1.5v-95c0-2.53,6.53-6.98,9.57-7.41,7.7-1.09,29.91-.98,37.81-.09,4.78.54,11.47,5.79,11.47,10.5v93.5Z"/>
            
            {/* Water inside the bottle - semi-transparent blue */}
            <rect className="fill-blue-400/30" x="109" y="240" width="200" height="563"/>
            
            {/* DNA fragments floating inside */}
            <circle className="fill-blue-300 animate-pulse" cx="200" cy="400" r="8" opacity="0.8"/>
            <circle className="fill-green-300 animate-pulse" cx="220" cy="450" r="6" opacity="0.8"/>
            <circle className="fill-yellow-300 animate-pulse" cx="180" cy="500" r="7" opacity="0.8"/>
            <circle className="fill-red-300 animate-pulse" cx="210" cy="550" r="5" opacity="0.8"/>
            <circle className="fill-purple-300 animate-pulse" cx="190" cy="350" r="6" opacity="0.8"/>
            <circle className="fill-pink-300 animate-pulse" cx="230" cy="600" r="4" opacity="0.8"/>
          </g>
        </svg>
        
        {/* Magnifying glass over the bottle */}
        <MagnifyingGlass 
          onClick={onZoomIn}
          className="top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        />
      </div>
    </div>
    
    <div className="absolute bottom-8 left-8 bg-black/70 text-white p-4 rounded-lg backdrop-blur-sm">
      <h3 className="text-xl font-bold text-primary">Water Sample</h3>
      <p className="text-sm">Click to zoom into the molecular level</p>
      <p className="text-xs text-gray-300 mt-1">Database: samples table</p>
    </div>
  </div>
);

// DNA Level - Molecular view
const DNALevel: React.FC<{ onZoomIn: () => void; onZoomOut: () => void }> = ({ onZoomIn, onZoomOut }) => (
  <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-b from-indigo-900 to-purple-900">
    <button 
      onClick={onZoomOut}
      className="absolute top-4 left-4 btn btn-sm btn-primary"
    >
      ← Back to Sample
    </button>
    
    <div className="relative">
      {/* DNA Helix SVG */}
      <div className="relative">
        <svg viewBox="0 0 200 400" className="w-48 h-auto">
          {/* DNA double helix */}
          <path className="fill-none stroke-blue-400 stroke-4" d="M50 50 Q100 100 50 150 Q0 200 50 250 Q100 300 50 350"/>
          <path className="fill-none stroke-red-400 stroke-4" d="M150 50 Q100 100 150 150 Q200 200 150 250 Q100 300 150 350"/>
          
          {/* Base pairs */}
          <line className="stroke-gray-300 stroke-2" x1="50" y1="75" x2="150" y2="75"/>
          <line className="stroke-gray-300 stroke-2" x1="50" y1="125" x2="150" y2="125"/>
          <line className="stroke-gray-300 stroke-2" x1="50" y1="175" x2="150" y2="175"/>
          <line className="stroke-gray-300 stroke-2" x1="50" y1="225" x2="150" y2="225"/>
          <line className="stroke-gray-300 stroke-2" x1="50" y1="275" x2="150" y2="275"/>
          <line className="stroke-gray-300 stroke-2" x1="50" y1="325" x2="150" y2="325"/>
          
          {/* Nucleotides */}
          <circle className="fill-yellow-400" cx="50" cy="75" r="8"/>
          <circle className="fill-green-400" cx="150" cy="75" r="8"/>
          <circle className="fill-blue-400" cx="50" cy="125" r="8"/>
          <circle className="fill-red-400" cx="150" cy="125" r="8"/>
        </svg>
        
        {/* Magnifying glass over the DNA */}
        <MagnifyingGlass 
          onClick={onZoomIn}
          className="top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        />
      </div>
    </div>
    
    <div className="absolute bottom-8 left-8 bg-black/70 text-white p-4 rounded-lg backdrop-blur-sm">
      <h3 className="text-xl font-bold text-primary">DNA Features</h3>
      <p className="text-sm">Click to see how we analyze this data</p>
      <p className="text-xs text-gray-300 mt-1">Database: features table</p>
    </div>
  </div>
);

// Analysis Level - Computer processing
const AnalysisLevel: React.FC<{ onZoomOut: () => void }> = ({ onZoomOut }) => (
  <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-b from-purple-900 to-gray-900">
    <button 
      onClick={onZoomOut}
      className="absolute top-4 left-4 btn btn-sm btn-primary"
    >
      ← Back to DNA
    </button>
    
    <div className="relative">
      {/* Laptop SVG */}
      <div className="relative">
        <svg viewBox="0 0 400 300" className="w-96 h-auto">
          {/* Laptop base */}
          <rect className="fill-gray-700" x="50" y="200" width="300" height="80" rx="10"/>
          {/* Laptop screen */}
          <rect className="fill-gray-800" x="80" y="50" width="240" height="160" rx="5"/>
          {/* Screen content */}
          <rect className="fill-black" x="90" y="60" width="220" height="140" rx="3"/>
          
          {/* Terminal/analysis output */}
          <text className="fill-green-400 text-xs font-mono" x="100" y="80">Analysis Pipeline Running...</text>
          <text className="fill-white text-xs font-mono" x="100" y="100">Assay: 16S rRNA</text>
          <text className="fill-white text-xs font-mono" x="100" y="120">Primer: 515F-806R</text>
          <text className="fill-yellow-400 text-xs font-mono" x="100" y="140">Assignment: Copepoda</text>
          <text className="fill-blue-400 text-xs font-mono" x="100" y="160">Taxonomy: Calanus finmarchicus</text>
          <text className="fill-green-400 text-xs font-mono" x="100" y="180">Confidence: 98.5%</text>
        </svg>
      </div>
    </div>
    
    <div className="absolute bottom-8 left-8 bg-black/70 text-white p-4 rounded-lg backdrop-blur-sm">
      <h3 className="text-xl font-bold text-primary">Bioinformatics Analysis</h3>
      <p className="text-sm">DNA sequences are processed to identify marine organisms</p>
      <p className="text-xs text-gray-300 mt-1">Database: analysis, assay, primer tables</p>
    </div>
    
    <div className="absolute bottom-8 right-8 bg-black/70 text-white p-4 rounded-lg backdrop-blur-sm">
      <h4 className="text-lg font-semibold text-primary mb-2">Database Journey</h4>
      <ul className="text-sm space-y-1">
        <li>🚢 Projects → Research expeditions</li>
        <li>🧪 Samples → Water collection</li>
        <li>🧬 Features → DNA sequences</li>
        <li>🔬 Assays → Lab protocols</li>
        <li>📊 Analysis → Data processing</li>
        <li>🏷️ Taxonomy → Species identification</li>
      </ul>
    </div>
  </div>
);

// Main zoom visualization component
const DataZoomVisualization: React.FC = () => {
  const [zoomState, setZoomState] = useState<ZoomState>({
    level: 'ocean',
    isAnimating: false
  });

  const handleZoomIn = useCallback((nextLevel: ZoomLevel) => {
    if (zoomState.isAnimating) return;
    
    setZoomState(prev => ({ ...prev, isAnimating: true }));
    
    // Simulate zoom animation duration
    setTimeout(() => {
      setZoomState({ level: nextLevel, isAnimating: false });
    }, 800);
  }, [zoomState.isAnimating]);

  const handleZoomOut = useCallback((prevLevel: ZoomLevel) => {
    if (zoomState.isAnimating) return;
    
    setZoomState(prev => ({ ...prev, isAnimating: true }));
    
    setTimeout(() => {
      setZoomState({ level: prevLevel, isAnimating: false });
    }, 800);
  }, [zoomState.isAnimating]);

  const renderLevel = () => {
    switch (zoomState.level) {
      case 'ocean':
        return <OceanLevel onZoomIn={() => handleZoomIn('ctd')} />;
      case 'ctd':
        return <CTDLevel onZoomIn={() => handleZoomIn('niskin')} onZoomOut={() => handleZoomOut('ocean')} />;
      case 'niskin':
        return <NiskinLevel onZoomIn={() => handleZoomIn('dna')} onZoomOut={() => handleZoomOut('ctd')} />;
      case 'dna':
        return <DNALevel onZoomIn={() => handleZoomIn('analysis')} onZoomOut={() => handleZoomOut('niskin')} />;
      case 'analysis':
        return <AnalysisLevel onZoomOut={() => handleZoomOut('dna')} />;
      default:
        return <OceanLevel onZoomIn={() => handleZoomIn('ctd')} />;
    }
  };

  return (
    <div className="relative w-full h-[600px] overflow-hidden rounded-lg shadow-xl bg-gray-900">
      <div 
        key={zoomState.level}
        className={`w-full h-full transition-all duration-800 ease-in-out ${
          zoomState.isAnimating ? 'scale-125 opacity-0' : 'scale-100 opacity-100'
        }`}
        style={{
          transformOrigin: 'center center'
        }}
      >
        {renderLevel()}
      </div>
      
      {zoomState.isAnimating && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      )}
    </div>
  );
};

export default DataZoomVisualization; 