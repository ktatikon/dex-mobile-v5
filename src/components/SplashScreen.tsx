
import React, { useEffect, useState } from 'react';

const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onComplete, 500); // Additional delay for the fade out animation
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 bg-dex-dark flex items-center justify-center z-50 transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      <div className="text-center">
        <div className="mb-4 animate-pulse-subtle">
          <h1 className="text-4xl font-bold text-white">
            <span className="text-dex-primary">V</span>-DEX
          </h1>
        </div>
        <div className="w-32 h-1 mx-auto bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-dex-primary animate-pulse" style={{ width: '70%' }}></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
