"use client"
import React, { useState, useRef, useEffect } from 'react';

export default function DrawingGridApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const [columns, setColumns] = useState<number | ''>(10);
  const [rows, setRows] = useState<number | ''>(10);

  const [isBlackAndWhite, setIsBlackAndWhite] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<string>('original');
  const [pastImages, setPastImages] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('drawing_grid_history');
    if (saved) setPastImages(JSON.parse(saved));
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImageSrc(base64);

      const newHistory = [base64, ...pastImages.filter(i => i !== base64)].slice(0, 5);
      setPastImages(newHistory);
      localStorage.setItem('drawing_grid_history', JSON.stringify(newHistory));
    };
    reader.readAsDataURL(file);
  };

  const handleExport = () => {
    if (!canvasRef.current) return;

    const dataUrl = canvasRef.current.toDataURL('image/png', 1.0);

    const link = document.createElement('a');
    link.download = `grid-reference-${columns || 0}x${rows || 0}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (!imageSrc || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      let targetWidth = img.width;
      let targetHeight = img.height;

      if (aspectRatio !== 'original') {
        const [w, h] = aspectRatio.split(':').map(Number);
        const ratio = w / h;
        const imgRatio = img.width / img.height;

        if (imgRatio > ratio) {
          targetWidth = img.height * ratio;
        } else {
          targetHeight = img.width / ratio;
        }
      }

      // Canvas internal resolution matches the high-res image
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const startX = (img.width - targetWidth) / 2;
      const startY = (img.height - targetHeight) / 2;

      ctx.filter = isBlackAndWhite ? 'grayscale(100%) contrast(150%)' : 'none';
      ctx.drawImage(img, startX, startY, targetWidth, targetHeight, 0, 0, targetWidth, targetHeight);

      // Draw Grid
      ctx.filter = 'none';
      ctx.strokeStyle = isBlackAndWhite ? '#00FF00' : '#FFFFFF';

      // Scale line width dynamically so it's visible on huge exported images
      ctx.lineWidth = Math.max(2, targetWidth / 1000);

      const safeCols = Number(columns) || 1;
      const safeRows = Number(rows) || 1;

      const stepX = targetWidth / safeCols;
      const stepY = targetHeight / safeRows;

      ctx.beginPath();

      for (let x = 0; x <= targetWidth; x += stepX) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, targetHeight);
      }

      for (let y = 0; y <= targetHeight; y += stepY) {
        ctx.moveTo(0, y);
        ctx.lineTo(targetWidth, y);
      }

      ctx.stroke();
    };
    img.src = imageSrc;
  }, [imageSrc, columns, rows, isBlackAndWhite, aspectRatio]);



  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 text-gray-900 font-sans">

      <div className="w-full md:w-80 p-6 bg-white border-r border-gray-200 flex flex-col gap-6 shadow-sm z-10 overflow-y-auto">
        <div>
          <h1 className="text-xl font-semibold tracking-tight mb-4">Grid Setup</h1>
          <label className="block w-full text-center px-4 py-3 bg-black text-white rounded-lg cursor-pointer hover:bg-gray-800 transition">
            Upload Image
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        </div>

        {imageSrc && (
          <div className="flex flex-col gap-6">

            {/* Unlimited Number Inputs */}
            <div className="space-y-4 border p-4 rounded-xl bg-gray-50">
              <div>
                <label className="text-sm font-medium mb-1 block">Columns (Vertical divisions)</label>
                <input
                  type="number"
                  min="1"
                  value={columns}
                  onChange={(e) => setColumns(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-black outline-none"
                  placeholder="e.g., 20"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Rows (Horizontal divisions)</label>
                <input
                  type="number"
                  min="1"
                  value={rows}
                  onChange={(e) => setRows(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-black outline-none"
                  placeholder="e.g., 20"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Format</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md bg-white"
              >
                <option value="original">Original</option>
                <option value="1:1">Square (1:1)</option>
                <option value="4:3">Standard (4:3)</option>
                <option value="16:9">Widescreen (16:9)</option>
              </select>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setIsBlackAndWhite(!isBlackAndWhite)}
                className={`w-full py-2 text-sm rounded-md border transition ${isBlackAndWhite ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-300 hover:bg-gray-100'}`}
              >
                {isBlackAndWhite ? 'Remove High Contrast' : 'Apply High Contrast B&W'}
              </button>

              {/* Export Button */}
              <button
                onClick={handleExport}
                className="w-full py-3 mt-2 text-sm rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition shadow-sm flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export High-Res PNG
              </button>
            </div>
          </div>
        )}

        {pastImages.length > 0 && (
          <div className="mt-auto pt-6 border-t border-gray-100">
            <h2 className="text-sm font-medium text-gray-500 mb-3">Recent Work</h2>
            <div className="grid grid-cols-3 gap-2">
              {pastImages.map((src, i) => (
                <img
                  key={i} src={src} alt="history"
                  className="w-full h-16 object-cover rounded-md cursor-pointer hover:opacity-80 transition border"
                  onClick={() => setImageSrc(src)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-gray-100">
        {!imageSrc ? (
          <div className="text-center">
            <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-2xl mx-auto mb-4 flex items-center justify-center text-gray-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">Upload an image to start framing</p>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="max-w-full shadow-lg rounded-sm"
            style={{ maxHeight: '85vh' }}
          />
        )}
      </div>
    </div>
  );
}