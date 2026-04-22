export function AdBanner() {
  const iframeHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: transparent; width: 100%; height: 100%; }</style>
      </head>
      <body>
        <script async="async" data-cfasync="false" src="https://pl29207351.profitablecpmratenetwork.com/836d0910390e32d491359194be026e10/invoke.js"></script>
        <div id="container-836d0910390e32d491359194be026e10"></div>
      </body>
    </html>
  `;

  return (
    <div className="w-full aspect-square flex flex-col items-center justify-center border-t border-gray-200 overflow-hidden relative">
      <iframe 
        srcDoc={iframeHtml} 
        className="w-full h-full relative z-10"
        style={{ border: 'none', overflow: 'hidden' }}
        scrolling="no"
        title="ad-banner"
      />
    </div>
  );
}
