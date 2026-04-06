import {
  Type, Pencil, Shapes, Eraser, Download, 
  Square, Undo2, Redo2 
} from "lucide-react";
import { RiTriangleLine } from "react-icons/ri";
import { FaRegCircle } from "react-icons/fa";
import * as React from "react";
import { useState, useEffect } from "react";

interface ToolbarProps {
  onAddPage?: () => void;
  onExport?: () => void;
}

export default function Toolbar({ onAddPage, onExport }: ToolbarProps) {
  const [isShapesOpen, setIsShapesOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  
  // History tracking
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const getTargetContext = () => {
    let doc = document;
    let container = doc.getElementById('page-container');
    const iframe = document.querySelector('iframe');
    const frameDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
    if (frameDoc && frameDoc.getElementById('page-container')) {
      doc = frameDoc;
      container = frameDoc.getElementById('page-container');
    }
    return { doc, container };
  };

  // --- HISTORY ---
const saveState = () => {
  const { doc } = getTargetContext();
  const canvas = doc.getElementById('draw-canvas') as HTMLCanvasElement;
  if (!canvas) return;
  
  const data = canvas.toDataURL();

  setHistory((prevHistory) => {
    const newHistory = prevHistory.slice(0, historyIndex + 1);
    return [...newHistory, data];
  });
  
  setHistoryIndex((prevIndex) => prevIndex + 1);
};

const undo = () => {
  if (historyIndex <= 0) return;
  const newIndex = historyIndex - 1;
  setHistoryIndex(newIndex);
  renderState(history[newIndex]);
};

const redo = () => {
  if (historyIndex >= history.length - 1) return;
  
  const newIndex = historyIndex + 1;
  setHistoryIndex(newIndex);
  renderState(history[newIndex]);
};
const renderState = (dataUrl: string) => {
  const { doc } = getTargetContext();
  const canvas = doc.getElementById('draw-canvas') as HTMLCanvasElement;
  const ctx = canvas?.getContext('2d');
  if (!ctx || !canvas) return;

  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(img, 0, 0);
  
    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    }
  };
  img.src = dataUrl;
};

  // --- CANVAS SETUP ---
  useEffect(() => {
    const { doc } = getTargetContext();
    setupCanvas(doc);
  }, [activeTool]);

  const setupCanvas = (doc: Document) => {
    const container = doc.getElementById('page-container');
    if (!container) return;

    let canvas = doc.getElementById('draw-canvas') as HTMLCanvasElement;
    if (!canvas) {
      canvas = doc.createElement('canvas');
      canvas.id = 'draw-canvas';
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
      Object.assign(canvas.style, { position: 'absolute', top: '0', left: '0', zIndex: '1000' });
      container.appendChild(canvas);
      setHistory([canvas.toDataURL()]);
      setHistoryIndex(0);
    }
    
    canvas.style.pointerEvents = (activeTool === 'pencil' || activeTool === 'eraser') ? 'auto' : 'none';
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let drawing = false;
    canvas.onmousedown = (e) => {
      if (activeTool !== 'pencil' && activeTool !== 'eraser') return;
      if (activeTool === 'eraser') {
        canvas.style.pointerEvents = 'none';
        const clicked = doc.elementFromPoint(e.clientX, e.clientY);
        canvas.style.pointerEvents = 'auto';
        if (clicked?.classList.contains('draggable-element')) {
          clicked.remove();
          saveState();
          return;
        }
      }

      drawing = true;
      ctx.beginPath();
      ctx.moveTo(e.offsetX, e.offsetY);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      if (activeTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = 20;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
      }
    };

    canvas.onmousemove = (e) => {
      if (!drawing) return;
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();
    };

    canvas.onmouseup = () => {
      if (drawing) {
        drawing = false;
        saveState();
      }
    };
  };

  const attachMoveAndResize = (el: HTMLElement, doc: Document, container: HTMLElement) => {
    const resizer = doc.createElement('div');
    resizer.className = "resizer-handle"; 
    Object.assign(resizer.style, {
      width: '12px', height: '12px', background: '#000000', border: '2px solid white',
      position: 'absolute', right: '-6px', bottom: '-6px', cursor: 'nwse-resize', 
      zIndex: '1001', borderRadius: '50%', display: 'none'
    });
    el.appendChild(resizer);

    el.onmousedown = (e) => {
      if (activeTool === 'eraser') {
        el.remove();
        saveState();
        return;
      }
      if (e.target === resizer) return;
      doc.querySelectorAll('.draggable-element').forEach(item => item.classList.remove('selected'));
      el.classList.add('selected');
      
      const cRect = container.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      const shiftX = e.clientX - rect.left;
      const shiftY = e.clientY - rect.top;

      const move = (mE: MouseEvent) => {
        el.style.left = Math.max(0, Math.min(mE.clientX - cRect.left - shiftX, container.offsetWidth - el.offsetWidth)) + "px";
        el.style.top = Math.max(0, Math.min(mE.clientY - cRect.top - shiftY, container.offsetHeight - el.offsetHeight)) + "px";
      };
      doc.addEventListener("mousemove", move);
      doc.onmouseup = () => {
        doc.removeEventListener("mousemove", move);
        saveState();
      };
    };

    resizer.onmousedown = (e) => {
      e.stopPropagation();
      const startX = e.clientX, startY = e.clientY, startW = el.offsetWidth, startH = el.offsetHeight;
      const doResize = (mE: MouseEvent) => {
        el.style.width = (startW + (mE.clientX - startX)) + 'px';
        el.style.height = (startH + (mE.clientY - startY)) + 'px';
      };
      const stopResize = () => {
        doc.removeEventListener('mousemove', doResize);
        doc.removeEventListener('mouseup', stopResize);
        saveState();
      };
      doc.addEventListener('mousemove', doResize);
      doc.addEventListener('mouseup', stopResize);
    };
  };

  const createShape = (styles: Partial<CSSStyleDeclaration>) => {
    const { doc, container } = getTargetContext();
    if (!container) return;
    const el = doc.createElement("div");
    el.className = "draggable-element";
    Object.assign(el.style, styles, { position: "absolute", left: "50px", top: "50px", cursor: "move" });
    if (styles.borderBottom) {
      Object.assign(el.style, { width: '100px', height: '100px', border: 'none', backgroundColor: '#22c55e', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' });
    }
    attachMoveAndResize(el, doc, container);
    container.appendChild(el);
    setIsShapesOpen(false);
    saveState();
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-zinc-900 border-b border-zinc-800 shadow-md z-[100] text-zinc-100">
      <div className="flex items-center justify-between px-6 h-20">
        <div className="flex items-center">
          <ToolGroup>
            <button onClick={undo} disabled={historyIndex <= 0} className="p-2 hover:bg-zinc-800 disabled:opacity-20 transition-opacity"><Undo2 size={18}/></button>
            <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 hover:bg-zinc-800 disabled:opacity-20 transition-opacity"><Redo2 size={18}/></button>
          </ToolGroup>
          <ToolGroup>
            <ToolButton icon={Type} label="Text" onClick={() => setActiveTool('text')} active={activeTool === 'text'} />
            <ToolButton icon={Pencil} label="Free Draw" onClick={() => setActiveTool('pencil')} active={activeTool === 'pencil'} />
            <div className="relative">
              <button onClick={() => setIsShapesOpen(!isShapesOpen)} className={`flex flex-col items-center justify-center min-w-[72px] h-16 rounded-lg ${activeTool === 'shapes' ? 'text-blue-400 bg-zinc-800' : 'text-zinc-400'}`}>
                <Shapes size={20} /><span className="text-[11px] mt-1.5">Shapes</span>
              </button>
              {isShapesOpen && (
                <div className="absolute left-0 mt-2 w-44 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-1.5 z-[9999] flex flex-col gap-0.5">
                  <button onClick={() => { setActiveTool('shapes'); createShape({ width: '100px', height: '100px', backgroundColor: '#3b82f6' }); }} className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-zinc-800 rounded-lg text-left"><Square size={16} /> Square</button>
                  <button onClick={() => { setActiveTool('shapes'); createShape({ width: '100px', height: '100px', backgroundColor: '#ef4444', borderRadius: '50%' }); }} className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-zinc-800 rounded-lg text-left"><FaRegCircle size={16} /> Circle</button>
                  <button onClick={() => { setActiveTool('shapes'); createShape({ borderBottom: '100px solid #22c55e' }); }} className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-zinc-800 rounded-lg text-left"><RiTriangleLine size={16} /> Triangle</button>
                </div>
              )}
            </div>
          </ToolGroup>
          <ToolGroup>
            <ToolButton icon={Eraser} label="Eraser" onClick={() => setActiveTool('eraser')} active={activeTool === 'eraser'} />
          </ToolGroup>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onExport} className="bg-zinc-100 text-zinc-900 px-5 py-2.5 rounded-xl hover:bg-white font-bold flex items-center gap-2"><Download size={18} /> Export</button>
        </div>
      </div>
    </nav>
  );
}

const ToolGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-1 px-4 border-r border-zinc-800 last:border-r-0">{children}</div>
);

const ToolButton = ({ icon: Icon, label, onClick, active }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center min-w-[72px] h-16 rounded-lg transition-colors ${active ? "bg-zinc-800 text-blue-400" : "text-zinc-400 hover:bg-zinc-800"}`}>
    <Icon size={20} /><span className="text-[11px] font-medium mt-1.5">{label}</span>
  </button>
);