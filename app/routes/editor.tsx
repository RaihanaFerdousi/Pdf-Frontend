import { useLocation } from "react-router";
import * as React from "react";
import { PDFDocument } from "pdf-lib";
import Toolbar from "~/Components/Toolbar";
import html2canvas from "html2canvas";

const BLANK_PAGE_HTML = `
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        body { background-color: #121212; margin: 0; display: flex; justify-content: center; min-height: 100vh; }
        #page-container { 
          padding: 40px 0; 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          gap: 40px; /* SPACE BETWEEN PAGES */
        }
        .pc { 
          background: white; width: 600px; height: 1100px; 
          position: relative; box-shadow: 0 10px 40px rgba(0,0,0,0.5);
          overflow: hidden;
          flex-shrink: 0;
        }
        .t { 
          position: absolute; left: 50px; top: 50px; 
          font-family: sans-serif; font-size: 16px; color: #1a1a1a;
          min-width: 200px; outline: none; z-index: 10;
        }
      </style>
    </head>
    <body>
      <div id="page-container">
        <div class="pc" id="page-1">
            <div class="t" contenteditable="true">Start typing your new PDF here...</div>
        </div>
      </div>
    </body>
  </html>
`;

export default function Editor() {
  const location = useLocation();
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const htmlUrl = location.state?.htmlUrl;
  const isBlank = location.state?.isBlank;

  React.useEffect(() => {
    if (isBlank) {
      const blob = new Blob([BLANK_PAGE_HTML], { type: 'text/html' });
      setBlobUrl(URL.createObjectURL(blob));
    } else if (htmlUrl) {
      fetch(htmlUrl)
        .then(res => res.text())
        .then(html => {
          const blob = new Blob([html], { type: 'text/html' });
          setBlobUrl(URL.createObjectURL(blob));
        });
    }
  }, [htmlUrl, isBlank]);

  const handleAddPage = () => {
    const frame = iframeRef.current;
    const doc = frame?.contentDocument || frame?.contentWindow?.document;
    const container = doc?.getElementById('page-container');
    if (!container || !doc) return;

    const newPage = doc.createElement('div');
    newPage.className = 'pc';
    const pageCount = container.querySelectorAll('.pc').length + 1;
    newPage.id = `page-${pageCount}`;
    container.appendChild(newPage);

    const event = new CustomEvent('pageAdded');
    doc.dispatchEvent(event);
  };

  const setupStyles = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    const frame = e.currentTarget;
    const frameDoc = frame.contentDocument || frame.contentWindow?.document;
    if (!frameDoc) return;

    const style = frameDoc.createElement('style');
    style.innerHTML = `
      #sidebar, .outline { display: none !important; }
      body, html { background-color: #121212 !important; }
      
      .draggable-element { 
        position: absolute; 
        z-index: 1001; 
        user-select: none;
      }

      .resizer-handle {
        width: 12px; height: 12px; background: black;
        position: absolute; right: -6px; bottom: -6px;
        cursor: nwse-resize; display: none; z-index: 2001;
        border: 2px solid white; border-radius: 2px;
      }

      .draggable-element.selected { outline: 2px solid #3b82f6; }
      .draggable-element.selected .resizer-handle { display: block; }
      .text-box { user-select: text !important; }
      
      #draw-canvas[style*="pointer-events: none"] { z-index: -1 !important; }
    `;
    frameDoc.head.appendChild(style);

    frameDoc.addEventListener('mousedown', (ev) => {
      const target = ev.target as HTMLElement;
      if (target.id === 'page-container' || target.tagName === 'BODY' || target.classList.contains('pc')) {
        frameDoc.querySelectorAll('.draggable-element').forEach(el => el.classList.remove('selected'));
      }
    });

    const unlock = () => {
      frameDoc.querySelectorAll('.t').forEach(el => {
        (el as HTMLElement).contentEditable = "true";
      });
    };
    setInterval(unlock, 1000);
  };

const createPageImage = async (page: HTMLElement) => {
  // 1. Use html2canvas to capture the entire page div as it appears
  const canvas = await html2canvas(page, {
    scale: 2,            // Higher scale = crisper PDF (2 is usually plenty)
    useCORS: true,       // Helps if you have external images
    backgroundColor: '#ffffff',
    logging: false,
  });

  // 2. Return the high-quality image data
  return canvas.toDataURL('image/png');
};

const handleExport = async () => {
  const frame = iframeRef.current;
  const doc = frame?.contentDocument || frame?.contentWindow?.document;
  const container = doc?.getElementById('page-container');
  if (!doc || !container) return;

  const pages = Array.from(container.querySelectorAll('.pc')) as HTMLElement[];
  if (pages.length === 0) return;

  const pdfDoc = await PDFDocument.create();

  for (const page of pages) {
    // Convert the HTML page to a PNG image string
    const imageDataUrl = await createPageImage(page);
    
    // Embed the PNG into the PDF
    const pngImage = await pdfDoc.embedPng(imageDataUrl);
    
    // Logic to keep the PDF page size standard (e.g., 600x1100 as per your CSS)
    // Since we used scale: 2, we divide by 2 to keep the physical dimensions correct
    const pdfPage = pdfDoc.addPage([pngImage.width / 2, pngImage.height / 2]);
    
    pdfPage.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: pngImage.width / 2,
      height: pngImage.height / 2,
    });
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'document.pdf';
  link.click();
  
  URL.revokeObjectURL(url);
};

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950">
      <Toolbar onAddPage={handleAddPage} onExport={handleExport} />
      <div className="flex-1 flex justify-center p-4">
        {blobUrl ? (
          <iframe
            ref={iframeRef}
            src={blobUrl}
            onLoad={setupStyles}
            className="w-full bg-zinc-950 border-none rounded-lg h-[88vh]"
          />
        ) : (
          <p className="text-white">Loading Editor...</p>
        )}
      </div>
    </div>
  );
}