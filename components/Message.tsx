
import React from 'react';
import { ChatMessage, MessageAuthor } from '../types';

interface MessageProps {
  message: ChatMessage;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.author === MessageAuthor.USER;

  const containerClasses = `flex items-start gap-4 ${isUser ? 'justify-end' : ''}`;
  const bubbleClasses = `max-w-xl p-4 rounded-2xl ${
    isUser
      ? 'bg-cyan-600 text-white rounded-br-none'
      : 'bg-gray-700 text-gray-200 rounded-bl-none'
  }`;
  
  return (
    <div className={containerClasses}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex-shrink-0" />
      )}
      <div className="flex flex-col gap-2">
        <div className={bubbleClasses}>
            {message.image && (
                <img src={message.image} alt="User upload" className="rounded-lg mb-2 max-w-sm" />
            )}
            <p className="whitespace-pre-wrap">{message.text}</p>
        </div>
        {message.sources && message.sources.length > 0 && (
            <div className="text-xs text-gray-400 mt-1 ml-2">
                <h4 className="font-semibold mb-1">Sources:</h4>
                <ul className="list-disc list-inside space-y-1">
                    {message.sources.map((source, index) => (
                        source.web && <li key={index}>
                            <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                                {source.web.title || source.web.uri}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        )}
      </div>
    </div>
  );
};

export default Message;
