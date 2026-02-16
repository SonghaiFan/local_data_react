'use client';

import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';

interface FileItem {
  url: string;
  name: string;
  type: string;
  mtime: number;
}

export default function Home() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [ipAddress, setIpAddress] = useState<string>('');
  const [uploadUrl, setUploadUrl] = useState<string>('');
  const socketRef = useRef<any>(null);

  useEffect(() => {
    // 1. Get the local IP address from our API
    fetch('/api/ip')
      .then((res) => res.json())
      .then((data) => {
        if (data.ip) {
          setIpAddress(data.ip);
          // Assuming port 3000
          const url = `http://${data.ip}:3000/upload`;
          setUploadUrl(url);
        }
      })
      .catch((err) => console.error('Failed to get IP:', err));

    // 2. Fetch existing files
    fetch('/api/files')
      .then((res) => res.json())
      .then((data) => {
        if (data.files) {
          setFiles(data.files);
        }
      });

    // 3. Connect to Socket.IO
    // We connect to the current origin.
    const socket = io({
      path: '/socket.io', // standard
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    socket.on('new-file', (file: any) => {
      console.log('New file received:', file);
      // Construct file item
      const newFile: FileItem = {
        url: file.url,
        name: file.name,
        type: file.type || 'application/octet-stream',
        mtime: Date.now(),
      };
      setFiles((prev) => [newFile, ...prev]);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-50 text-gray-800">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-extrabold text-blue-600 tracking-tight">Local<span className="text-gray-900">Drop</span></h1>
            <p className="text-gray-500 mt-2 max-w-md">
              Share files instantly between devices on the same Wi-Fi network.
              Just scan the code to upload.
            </p>
          </div>
          
          <div className="flex flex-col items-center bg-gray-50/50 p-4 rounded-xl border border-dashed border-gray-200">
             {uploadUrl ? (
               <div className="bg-white p-2 rounded-lg shadow-sm">
                 <QRCodeSVG value={uploadUrl} size={140} />
               </div>
             ) : (
               <div className="w-[140px] h-[140px] bg-gray-200 animate-pulse rounded-lg" />
             )}
             <div className="mt-3 text-center">
               <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Scan to Upload</p>
               <a href={uploadUrl} className="text-xs text-blue-500 hover:text-blue-700 truncate max-w-[200px] block mt-1">
                 {uploadUrl || 'Loading...'}
               </a>
             </div>
          </div>
        </header>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map((file, index) => (
            <div 
              key={index} 
              className="group relative aspect-square bg-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 ring-1 ring-gray-900/5"
            >
              {file.type.startsWith('video') ? (
                <video 
                  src={file.url} 
                  controls 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <img 
                  src={file.url} 
                  alt={file.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              )}
              
              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                 <p className="text-white text-xs truncate mb-2 font-medium">{file.name}</p>
                 <a 
                   href={file.url} 
                   download={file.name}
                   className="w-full py-1.5 bg-white/90 backdrop-blur text-gray-900 rounded-lg font-semibold text-xs text-center hover:bg-white transition-colors shadow-sm"
                 >
                   Download
                 </a>
              </div>
            </div>
          ))}
        </div>
        
        {files.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl bg-white/50">
            <svg className="w-16 h-16 mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <p className="text-lg font-medium">No files yet</p>
            <p className="text-sm">Upload from your mobile device to see them here.</p>
          </div>
        )}
      </div>
    </main>
  );
}
