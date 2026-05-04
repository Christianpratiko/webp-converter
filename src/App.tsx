/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileImage, Download, RefreshCcw, Settings, ArrowRight, CheckCircle2, AlertCircle, MoveHorizontal, Maximize, Minimize } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { convertToWebP } from './lib/imageConverter';
import { formatBytes, cn } from './lib/utils';

export default function App() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [webpBlob, setWebpBlob] = useState<Blob | null>(null);
  const [webpPreview, setWebpPreview] = useState<string | null>(null);
  const [quality, setQuality] = useState<number>(0.8);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        setIsFullscreen(true);
      } else {
        setIsFullscreen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      // Handle Escape in CSS fallback mode
      if (e.key === 'Escape' && isFullscreen && !document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => setIsFullscreen(false));
      }
    } else {
      if (isFullscreen) {
        setIsFullscreen(false); // Manually exiting CSS fallback
      } else {
        if (containerRef.current) {
          if (containerRef.current.requestFullscreen) {
            containerRef.current.requestFullscreen().catch(() => {
              // Fallback to CSS full-window mode if native is blocked (e.g., iframe)
              setIsFullscreen(true);
            });
          } else {
            setIsFullscreen(true);
          }
        }
      }
    }
  };

  const handleConvert = useCallback(
    async (file: File, q: number) => {
      setIsConverting(true);
      setError(null);
      try {
        const result = await convertToWebP(file, { quality: q });
        setWebpBlob(result.blob);
        setWebpPreview(result.url);
      } catch (err) {
        console.error(err);
        setError('Failed to convert image. Please try another file.');
      } finally {
        setIsConverting(false);
      }
    },
    []
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setOriginalFile(file);
        
        // Clean up previous previews
        if (originalPreview) URL.revokeObjectURL(originalPreview);
        if (webpPreview) URL.revokeObjectURL(webpPreview);

        const newPreview = URL.createObjectURL(file);
        setOriginalPreview(newPreview);
        setWebpBlob(null);
        setWebpPreview(null);
        
        // Auto convert with current quality
        handleConvert(file, quality);
      }
    },
    [originalPreview, webpPreview, quality, handleConvert]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.bmp', '.webp', '.tiff'],
    },
    multiple: false,
  });

  // Re-convert when quality changes
  useEffect(() => {
    if (originalFile) {
      // Debounce quality changes slightly
      const timer = setTimeout(() => {
        handleConvert(originalFile, quality);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [quality, originalFile, handleConvert]);

  const handleDownload = () => {
    if (!webpBlob || !originalFile) return;
    const url = URL.createObjectURL(webpBlob);
    const a = document.createElement('a');
    a.href = url;
    
    // Create new filename replacing old extension with .webp
    const originalName = originalFile.name;
    const lastDotIndex = originalName.lastIndexOf('.');
    const nameWithoutExt = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName;
    a.download = `${nameWithoutExt}_optimized.webp`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetAll = () => {
    setOriginalFile(null);
    if (originalPreview) URL.revokeObjectURL(originalPreview);
    setOriginalPreview(null);
    setWebpBlob(null);
    if (webpPreview) URL.revokeObjectURL(webpPreview);
    setWebpPreview(null);
    setError(null);
    setQuality(0.8);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <header className="bg-white border-b border-gray-200 py-6 px-4 md:px-8 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-inner">
              <FileImage className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">WebP Optimizer</h1>
              <p className="text-xs font-medium text-gray-500">Fast, High-Detail, Small Size</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-12">
        <AnimatePresence mode="wait">
          {!originalFile ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl mx-auto"
            >
               <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-3">Convert Images to WebP</h2>
                  <p className="text-gray-600 text-lg">
                    Reduce file size up to 80% while retaining crisp, high-quality details. Works entirely in your browser.
                  </p>
               </div>

              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-200 ease-in-out group",
                  isDragActive
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-300 bg-white hover:border-indigo-400 hover:bg-slate-50 shadow-sm hover:shadow-md"
                )}
              >
                <input {...getInputProps()} />
                <div className="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <UploadCloud className="w-10 h-10 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {isDragActive ? "Drop your image here" : "Drag & drop an image"}
                </h3>
                <p className="text-gray-500 mb-6">or click to browse from your device</p>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400 font-medium">
                  {['JPEG', 'PNG', 'BMP'].map(ext => (
                    <span key={ext} className="bg-gray-100 px-3 py-1 rounded-full">{ext}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
             <motion.div
              key="editor"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Toolbar */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="w-full sm:max-w-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <label htmlFor="quality" className="text-sm font-semibold flex items-center gap-2 text-gray-700">
                      <Settings className="w-4 h-4 text-gray-400" />
                      Compression Quality
                    </label>
                    <span className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                      {Math.round(quality * 100)}%
                    </span>
                  </div>
                  <input
                    id="quality"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={quality}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-400 font-medium px-1">
                    <span>Small Size</span>
                    <span>High Detail</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={resetAll}
                    className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    <span className="hidden sm:inline">Start Over</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={isConverting || !webpBlob}
                    className={cn(
                      "flex-1 sm:flex-none px-6 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer",
                      isConverting || !webpBlob 
                        ? "bg-indigo-400 cursor-not-allowed opacity-70"
                        : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200 hover:-translate-y-0.5"
                    )}
                  >
                    <Download className="w-4 h-4" />
                    Download WebP
                  </button>
                </div>
              </div>

              {/* Comparison View */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Slider View */}
              <div 
                ref={containerRef}
                className={cn(
                  "relative w-full overflow-hidden shadow-inner group transition-all duration-300",
                  isFullscreen 
                    ? "fixed inset-0 z-[100] h-screen bg-gray-900" 
                    : "bg-gray-100 border border-gray-200 rounded-3xl mb-8 h-[50vh] sm:h-[60vh] md:h-[70vh]"
                )}
              >
                {/* Checkerboard background for transparency */}
                <div className="absolute inset-0 opacity-50 z-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(#e5e7eb 1px, transparent 1px)", backgroundSize: "16px 16px" }}></div>
                
                {/* Original Image (bottom) */}
                {originalPreview && (
                   <img 
                     src={originalPreview} 
                     alt="Original" 
                     className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 select-none" 
                   />
                )}
                
                {/* WebP Image (top, clipped) */}
                {webpPreview && (
                   <img 
                     src={webpPreview} 
                     alt="WebP" 
                     className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20 select-none" 
                     style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                   />
                )}
                
                {/* Loading state over WebP side */}
                {isConverting && !webpPreview && (
                   <div 
                     className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm gap-4"
                     style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                   >
                     <RefreshCcw className="w-8 h-8 text-indigo-500 animate-spin" />
                     <span className="text-sm font-medium text-indigo-600">Compressing...</span>
                   </div>
                )}
                
                {/* Slider divider */}
                <div 
                   className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-40 ease-out duration-75"
                   style={{ left: `calc(${sliderPosition}% - 2px)` }}
                >
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-200 transition-transform group-hover:scale-110">
                       <MoveHorizontal className="w-5 h-5 text-gray-500 cursor-ew-resize" />
                   </div>
                </div>

                {/* Range input (invisible, covers full area for dragging) */}
                <input 
                   type="range" 
                   min="0" max="100" 
                   value={sliderPosition}
                   onChange={(e) => setSliderPosition(Number(e.target.value))}
                   className="absolute inset-0 w-full h-full opacity-0 z-50 cursor-ew-resize m-0 touch-pan-x"
                />

                {/* Badges */}
                <div className="absolute top-4 left-4 z-40 flex flex-col items-start gap-2 pointer-events-none">
                   <div className="bg-indigo-600/90 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm transition-opacity duration-300" style={{ opacity: sliderPosition < 15 ? 0 : 1 }}>
                     WebP
                   </div>
                   {webpBlob && (
                     <div className="bg-white/90 backdrop-blur-md text-gray-800 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-opacity duration-300 flex items-center gap-2" style={{ opacity: sliderPosition < 25 ? 0 : 1 }}>
                        {formatBytes(webpBlob.size)}
                        {originalFile.size > webpBlob.size && (
                           <span className="text-emerald-600 flex items-center">
                              <ArrowRight className="w-3 h-3 rotate-90 mr-0.5" />
                              {Math.round((1 - webpBlob.size / originalFile.size) * 100)}%
                           </span>
                        )}
                        {isConverting && <RefreshCcw className="w-3 h-3 text-gray-400 animate-spin" />}
                     </div>
                   )}
                </div>

                <div className="absolute top-4 right-4 z-40 flex flex-col items-end gap-2 pointer-events-none">
                   <div className="bg-gray-800/90 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm transition-opacity duration-300" style={{ opacity: sliderPosition > 85 ? 0 : 1 }}>
                     Original
                   </div>
                   <div className="bg-white/90 backdrop-blur-md text-gray-800 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-opacity duration-300" style={{ opacity: sliderPosition > 75 ? 0 : 1 }}>
                      {formatBytes(originalFile.size)}
                   </div>
                </div>

                {/* Floating Quality Control for Fullscreen */}
                {isFullscreen && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[60] bg-white/90 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl w-[90%] max-w-sm flex flex-col gap-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <div className="flex items-center justify-between">
                        <label htmlFor="quality-fs" className="text-sm font-semibold flex items-center gap-2 text-gray-700 pointer-events-none">
                          <Settings className="w-4 h-4 text-gray-400" />
                          Compression Quality
                        </label>
                        <span className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600 pointer-events-none">
                          {Math.round(quality * 100)}%
                        </span>
                      </div>
                      <input
                        id="quality-fs"
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={quality}
                        onChange={(e) => setQuality(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                  </div>
                )}

                {/* Fullscreen Toggle Button */}
                <button
                  onClick={toggleFullscreen}
                  className="absolute bottom-4 right-4 z-50 p-2 md:p-3 bg-white/80 hover:bg-white backdrop-blur shadow-lg rounded-xl text-gray-700 hover:text-gray-900 transition-all cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                  aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
