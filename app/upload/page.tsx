'use client';
import { useState, useRef } from 'react';

export default function UploadPage() {
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setSuccess(true);
        // Reset after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert('Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        
        <h1 className="text-3xl font-bold tracking-tight">Upload Files</h1>

        <div className="relative group">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            capture="environment"
            onChange={handleFileChange}
            disabled={uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          
          <div className={`
            aspect-square rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300
            ${uploading ? 'border-blue-500 bg-blue-500/10' : success ? 'border-green-500 bg-green-500/10' : 'border-gray-700 bg-gray-900 group-hover:bg-gray-800'}
          `}>
             {uploading ? (
               <div className="flex flex-col items-center gap-4">
                 <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                 <span className="text-blue-400 font-medium">Uploading...</span>
               </div>
             ) : success ? (
               <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                 <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
                   <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                 </div>
                 <span className="text-green-400 font-medium">Sent!</span>
               </div>
             ) : (
               <div className="flex flex-col items-center gap-4 text-gray-400 group-hover:text-white transition-colors">
                 <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center shadow-inner">
                   <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                 </div>
                 <div className="space-y-1">
                   <p className="font-semibold text-lg">Tap to Capture</p>
                   <p className="text-xs opacity-60">Photos or Videos</p>
                 </div>
               </div>
             )}
          </div>
        </div>

        <p className="text-xs text-gray-500">
          Files will appear instantly on the desktop screen.
        </p>
      </div>
    </div>
  );
}
