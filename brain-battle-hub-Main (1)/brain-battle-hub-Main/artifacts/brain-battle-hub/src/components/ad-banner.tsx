import { useEffect } from 'react';

export function AdBanner() {
  useEffect(() => {
    const s = document.createElement('script');
    s.dataset.zone = '10900308';
    s.src = 'https://nap5k.com/tag.min.js';
    const target = [document.documentElement, document.body].filter(Boolean).pop();
    if (target) {
      target.appendChild(s);
    }
  }, []);

  return (
    <div className="w-full h-[50px] bg-gray-100 flex items-center justify-center border-t border-b border-gray-200">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Advertisement</p>
    </div>
  );
}
