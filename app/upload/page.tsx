'use client';
import { useEffect, useRef, useState } from 'react';

export default function UploadPage() {
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const successTimerRef = useRef<number | null>(null);

  const showSuccessBriefly = () => {
    setSuccess(true);
    if (successTimerRef.current) {
      window.clearTimeout(successTimerRef.current);
    }
    successTimerRef.current = window.setTimeout(() => setSuccess(false), 3000);
  };

  const uploadFile = async (file: File) => {
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
        showSuccessBriefly();
      } else {
        alert('Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading');
    } finally {
      setUploading(false);
      if (mediaInputRef.current) mediaInputRef.current.value = '';
      if (audioInputRef.current) audioInputRef.current.value = '';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const stopMediaStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const preferredAudioType = () => {
    if (typeof MediaRecorder === 'undefined') return '';
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/ogg',
    ];
    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? '';
  };

  const startAudioRecording = async () => {
    if (uploading || recording) return;

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      audioInputRef.current?.click();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = preferredAudioType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        setRecording(false);
        const chunks = audioChunksRef.current;
        audioChunksRef.current = [];
        const recorderType = recorder.mimeType || mimeType || 'audio/webm';
        mediaRecorderRef.current = null;
        stopMediaStream();

        if (!chunks.length) return;

        const audioBlob = new Blob(chunks, { type: recorderType });
        const extension = recorderType.includes('mp4')
          ? 'm4a'
          : recorderType.includes('ogg')
            ? 'ogg'
            : 'webm';
        const audioFile = new File([audioBlob], `voice-${Date.now()}.${extension}`, {
          type: audioBlob.type || recorderType,
        });
        await uploadFile(audioFile);
      };

      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      alert('Unable to start recording. Please allow microphone access.');
      setRecording(false);
      mediaRecorderRef.current = null;
      stopMediaStream();
    }
  };

  const stopAudioRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (recorder.state !== 'inactive') {
      recorder.stop();
      return;
    }
    setRecording(false);
  };

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      stopMediaStream();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        
        <h1 className="text-3xl font-bold tracking-tight">Upload Files</h1>

        <input
          ref={mediaInputRef}
          type="file"
          accept="image/*,video/*"
          capture="environment"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />

        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => mediaInputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-3xl border-2 border-dashed border-gray-700 bg-gray-900 hover:bg-gray-800 transition-colors p-6 flex flex-col items-center justify-center gap-4 disabled:opacity-50"
          >
            <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center shadow-inner">
              <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Capture Media</p>
              <p className="text-xs text-gray-400">Photo or video</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => (recording ? stopAudioRecording() : void startAudioRecording())}
            disabled={uploading}
            className={`aspect-square rounded-3xl border-2 border-dashed transition-colors p-6 flex flex-col items-center justify-center gap-4 disabled:opacity-50 ${
              recording
                ? 'border-red-500 bg-red-500/10 hover:bg-red-500/15'
                : 'border-gray-700 bg-gray-900 hover:bg-gray-800'
            }`}
          >
            <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center shadow-inner">
              <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18.25a4.75 4.75 0 01-4.75-4.75V8a4.75 4.75 0 119.5 0v5.5A4.75 4.75 0 0112 18.25z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 13.5a7 7 0 01-14 0M12 20.5v2.5" /></svg>
            </div>
            <div className="space-y-1">
              <p className="font-semibold">{recording ? 'Stop Recording' : 'Record Audio'}</p>
              <p className="text-xs text-gray-400">{recording ? 'Tap again to upload' : 'Voice message'}</p>
            </div>
          </button>
        </div>

        <div className={`
          rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300 p-8 min-h-[180px]
          ${uploading ? 'border-blue-500 bg-blue-500/10' : recording ? 'border-red-500 bg-red-500/10' : success ? 'border-green-500 bg-green-500/10' : 'border-gray-700 bg-gray-900'}
        `}>
           {uploading ? (
             <div className="flex flex-col items-center gap-4">
               <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
               <span className="text-blue-400 font-medium">Uploading...</span>
             </div>
           ) : recording ? (
             <div className="flex flex-col items-center gap-4">
               <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse" />
               <span className="text-red-300 font-medium">Recording...</span>
             </div>
           ) : success ? (
             <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
               <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
                 <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
               </div>
               <span className="text-green-400 font-medium">Sent!</span>
             </div>
           ) : (
             <div className="text-gray-400">
               Pick a tile above to capture and upload.
             </div>
           )}
        </div>

        <p className="text-xs text-gray-500">
          Photos/videos can be captured. Audio uses microphone recording.
        </p>

        <p className="text-xs text-gray-500">
          Files will appear instantly on the desktop screen.
        </p>
      </div>
    </div>
  );
}
