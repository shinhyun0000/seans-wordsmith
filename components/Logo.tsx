import React, { useState } from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = (props) => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className={`relative flex items-center justify-center ${props.className}`}>
      {!imgFailed ? (
        <img
          src="logo.png"
          alt="Sean's WordSmith Logo"
          className="block w-full h-full object-contain"
          loading="eager"
          style={{ minWidth: '100px', minHeight: '100px' }}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className="text-[#FF851B] font-bold text-4xl serif-font text-center flex flex-col items-center">
          <span>Sean's</span>
          <span className="text-[#001F3F]">WordSmith</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
