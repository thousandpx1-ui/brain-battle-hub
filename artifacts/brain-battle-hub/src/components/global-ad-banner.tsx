export function GlobalAdBanner() {
  const iframeHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: transparent; }</style>
      </head>
      <body>
        <script type="text/javascript">
          atOptions = {
            'key' : 'baa7ae0f57c83cbb80e08aa02cc1e14f',
            'format' : 'iframe',
            'height' : 50,
            'width' : 320,
            'params' : {}
          };
        </script>
        <script type="text/javascript" src="https://www.highperformanceformat.com/baa7ae0f57c83cbb80e08aa02cc1e14f/invoke.js"></script>
      </body>
    </html>
  `;

  return (
    <div className="w-full flex justify-center bg-gray-100 border-t border-gray-200 overflow-hidden relative z-40">
      <iframe 
        srcDoc={iframeHtml} 
        width="320" 
        height="50" 
        style={{ border: 'none', overflow: 'hidden' }}
        scrolling="no"
        title="global-ad-banner"
      />
    </div>
  );
}
