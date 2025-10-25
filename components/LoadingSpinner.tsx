
import React from 'react';

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center space-x-2">
    <div className="w-3 h-3 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '-0.3s' }}></div>
    <div className="w-3 h-3 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '-0.15s' }}></div>
    <div className="w-3 h-3 rounded-full bg-cyan-400 animate-bounce"></div>
  </div>
);

export default LoadingSpinner;
