import { useLocation } from "react-router";
import Toolbar from "../Components/Toolbar";
import * as React from "react";

export default function Editor() {
  const location = useLocation();
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
          
        .t { color: #000000 !important; cursor: text !important; }

        .draggable-element { border: 1px solid transparent; }
        .draggable-element.selected { border: 1px dashed #3b82f6 !important; }
        .draggable-element.selected .resizer-handle { display: block !important; }
      `;
      frameDoc.head.appendChild(style);
      frameDoc.querySelectorAll('.t').forEach((el) => { (el as HTMLElement).contentEditable = "true"; });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 overflow-hidden">
      <Toolbar />
      <style>{`
        .draggable-element { border: 1px solid transparent; }
        .draggable-element.selected { border: 1px dashed #3b82f6 !important; }
        .draggable-element.selected .resizer-handle { display: block !important; }
      `}</style>
      <div className="pt-24 flex-1 flex justify-center p-4 overflow-hidden">
        {htmlUrl ? (
          <iframe src={htmlUrl} onLoad={setupStyles} className="w-full bg-zinc-950 border-none rounded-lg h-[85vh]" />
        ) : (
          <div className="w-full bg-zinc-950 overflow-y-auto rounded-lg flex flex-col h-[85vh] items-center p-4">
            <div id="page-container" className="mx-auto w-[600px] bg-white p-20 min-h-[850px] shadow-2xl mb-10 text-black relative overflow-hidden rounded-sm">
              <div contentEditable className="outline-none min-h-[200px] cursor-text">
                <h1 className="text-3xl font-bold mb-4">New PDF</h1>
                <p className="text-gray-700">Text here...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}