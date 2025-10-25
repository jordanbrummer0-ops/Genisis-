
import React, { useState, useRef } from 'react';
import { MicIcon } from './icons/MicIcon';
import { StopIcon } from './icons/StopIcon';
import { SendIcon } from './icons/SendIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';

interface InputBarProps {
  isLoading: boolean;
  isRecording: boolean;
  onSendMessage: (message: string) => void;
  onToggleRecording: () => void;
  onFileUpload: (file: { base64: string, mimeType: string }) => void;
  hasUploadedFile: boolean;
}

const InputBar: React.FC<InputBarProps> = ({ isLoading, isRecording, onSendMessage, onToggleRecording, onFileUpload, hasUploadedFile }) => {
  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (text.trim() || hasUploadedFile) {
      onSendMessage(text);
      setText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        onFileUpload({ base64, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    }
  };
  
  return (
    <footer className="bg-gray-800 p-4 border-t border-gray-700">
      <div className="max-w-3xl mx-auto flex items-center gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`p-2 rounded-full transition-colors ${hasUploadedFile ? 'bg-cyan-500 text-white' : 'hover:bg-gray-700'}`}
          aria-label="Attach file"
          disabled={isLoading || isRecording}
        >
          <PaperclipIcon />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept="image/*"
        />
        
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isRecording ? "Listening..." : "Type or talk..."}
          className="flex-1 bg-gray-700 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
          disabled={isLoading || isRecording}
        />
        
        <button
          onClick={handleSend}
          className="p-2 rounded-full transition-colors hover:bg-gray-700 disabled:opacity-50"
          aria-label="Send message"
          disabled={isLoading || isRecording || (!text.trim() && !hasUploadedFile)}
        >
          <SendIcon />
        </button>

        <button
          onClick={onToggleRecording}
          className={`p-3 rounded-full transition-all duration-300 ease-in-out text-white ${
            isRecording ? 'bg-red-600 animate-pulse' : 'bg-cyan-600 hover:bg-cyan-700'
          }`}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          disabled={isLoading}
        >
          {isRecording ? <StopIcon /> : <MicIcon />}
        </button>
      </div>
    </footer>
  );
};

export default InputBar;
