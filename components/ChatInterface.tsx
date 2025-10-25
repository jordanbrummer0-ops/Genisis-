
import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import Message from './Message';
import LoadingSpinner from './LoadingSpinner';

interface ChatInterfaceProps {
  history: ChatMessage[];
  isLoading: boolean;
  liveTranscription: string;
  isRecording: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ history, isLoading, liveTranscription, isRecording }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, liveTranscription, isLoading]);

  return (
    <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
      {history.map((msg) => (
        <Message key={msg.id} message={msg} />
      ))}
      {isRecording && liveTranscription && (
         <div className="text-gray-400 italic px-4 py-2 bg-gray-800/50 rounded-lg max-w-3xl mx-auto text-center">
            {liveTranscription}
        </div>
      )}
      {isLoading && !isRecording && (
        <div className="flex justify-center items-center py-4">
          <LoadingSpinner />
        </div>
      )}
    </main>
  );
};

export default ChatInterface;
