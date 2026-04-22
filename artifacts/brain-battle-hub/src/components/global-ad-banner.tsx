import { useEffect, useRef } from 'react';

export function GlobalAdBanner() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && !containerRef.current.querySelector('script')) {
      const confScript = document.createElement('script');
      confScript.type = 'text/javascript';
      confScript.innerHTML = `
        atOptions = {
          'key' : 'baa7ae0f57c83cbb80e08aa02cc1e14f',
          'format' : 'iframe',
          'height' : 50,
          'width' : 320,
          'params' : {}
        };
      `;
      containerRef.current.appendChild(confScript);

      const invokeScript = document.createElement('script');
      invokeScript.type = 'text/javascript';
      invokeScript.src = "https://www.highperformanceformat.com/baa7ae0f57c83cbb80e08aa02cc1e14f/invoke.js";
      containerRef.current.appendChild(invokeScript);
    }
  }, []);

  return (
    <div className="w-full flex justify-center bg-gray-100 border-t border-gray-200 overflow-hidden relative z-40">
      <div 
        ref={containerRef}
        className="w-[320px] h-[50px] relative z-10 flex items-center justify-center"
      ></div>
    </div>
  );
}
