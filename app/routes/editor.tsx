import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import * as pdfjsLib from "pdfjs-dist";
import Toolbar from "../Components/Toolbar";

// Set worker from CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export default function Editor() {
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfUrl = location.state?.pdfUrl;

  useEffect(() => {
    if (!pdfUrl || !containerRef.current) return;

    const renderPDF = async () => {
      try {
        const fullUrl = `http://localhost:3001${pdfUrl}`;
        const loadingTask = pdfjsLib.getDocument(fullUrl);
        const pdf = await loadingTask.promise;
        
        containerRef.current!.innerHTML = ""; 

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });

          const pageWrapper = document.createElement("div");
          pageWrapper.className = "relative mb-8 shadow-2xl bg-white border border-gray-300";
          pageWrapper.style.width = `${viewport.width}px`;
          pageWrapper.style.height = `${viewport.height}px`;

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d")!;
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          pageWrapper.appendChild(canvas);

          // FIX APPLIED HERE
          await page.render({ 
            canvasContext: context, 
            viewport: viewport,
            canvas: canvas 
          }).promise;

          const textLayerDiv = document.createElement("div");
          textLayerDiv.className = "absolute top-0 left-0 textLayer overflow-hidden leading-none";
          textLayerDiv.style.width = `${viewport.width}px`;
          textLayerDiv.style.height = `${viewport.height}px`;
          
          pageWrapper.appendChild(textLayerDiv);
          containerRef.current!.appendChild(pageWrapper);

          const textContent = await page.getTextContent();
          await pdfjsLib.renderTextLayer({
            textContentSource: textContent,
            container: textLayerDiv,
            viewport: viewport,
          }).promise;

          const textDivs = textLayerDiv.querySelectorAll("span");
          textDivs.forEach((span) => {
            span.setAttribute("contenteditable", "true");
            // Set styles so text is visible and editable
            span.style.color = "black";
            span.className += " hover:bg-blue-100/50 outline-none focus:bg-blue-200/50";
          });
        }
      } catch (err) {
        console.error("Error rendering PDF:", err);
      }
    };

    renderPDF();
  }, [pdfUrl]);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-800">
      <Toolbar onExport={() => alert("Export logic coming next!")} />
      <div className="flex-1 p-8 overflow-y-auto">
        <div ref={containerRef} className="flex flex-col items-center">
          {!pdfUrl && <div className="text-white">Please upload a PDF first.</div>}
        </div>
      </div>
    </div>
  );
}