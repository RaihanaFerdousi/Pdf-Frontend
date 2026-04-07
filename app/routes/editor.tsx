import { useLocation } from "react-router";
import * as React from "react";

export default function Editor() {
  const location = useLocation();
  // We grab the URL passed from the Welcome component's navigate() call
  const htmlUrl = location.state?.htmlUrl;

  const setupStyles = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    const frame = e.currentTarget;
    const frameDoc = frame.contentDocument || frame.contentWindow?.document;

    if (frameDoc) {
      const style = frameDoc.createElement('style');
      style.innerHTML = `
        #sidebar { display: none !important; }
        body, html { 
          background-color: #09090b !important; 
          margin: 0 !important; padding: 0 !important;
        }
        #page-container {
          position: relative !important; margin: 0 auto !important;
          display: flex !important; flex-direction: column !important;
          align-items: center !important; min-width: 100% !important;
          padding: 20px 0 100px 0 !important;
        }
        .pc { 
          background-color: white !important; position: relative !important; 
          margin: 0 auto !important; overflow: hidden !important;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #27272a !important;
        }
        .t { color: #000000 !important; cursor: text !important; outline: none !important; }
      `;
      frameDoc.head.appendChild(style);
      
      // Makes the converted text lines editable
      frameDoc.querySelectorAll('.t').forEach((el) => { 
        (el as HTMLElement).contentEditable = "true"; 
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 overflow-hidden">
      <div className="flex-1 flex justify-center p-4">
        {htmlUrl ? (
          <iframe 
            src={htmlUrl} 
            onLoad={setupStyles} 
            className="w-full bg-zinc-950 border-none rounded-lg h-[90vh]" 
            title="PDF Editor Frame"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-white gap-4">
            <p className="text-xl">No PDF data found.</p>
            <button 
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-white text-black rounded-lg"
            >
              Go Back to Upload
            </button>
          </div>
        )}
      </div>
    </div>
  );
}