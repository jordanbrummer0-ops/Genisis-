import React from 'react';

interface HeaderProps {
  projectName: string;
}

const Header: React.FC<HeaderProps> = ({ projectName }) => {
  return (
    <header className="bg-gray-800 p-4 shadow-md z-10 flex-shrink-0">
      <h1 className="text-xl font-bold text-center text-gray-200">
        Genesis Studio - <span className="text-cyan-400">{projectName}</span>
      </h1>
    </header>
  );
};

export default Header;
