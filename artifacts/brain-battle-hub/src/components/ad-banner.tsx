import { useEffect, useRef } from 'react';

export function AdBanner() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && !containerRef.current.querySelector('script')) {
      const script = document.createElement('script');
      script.async = true;
      script.dataset.cfasync = 'false';
      script.src = 'https://pl29207351.profitablecpmratenetwork.com/836d0910390e32d491359194be026e10/invoke.js';
      containerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className="w-full min-h-[50px] bg-gray-100 flex flex-col items-center justify-center border-t border-b border-gray-200"
    >
      <div id="container-836d0910390e32d491359194be026e10"></div>
    </div>
  );
}
