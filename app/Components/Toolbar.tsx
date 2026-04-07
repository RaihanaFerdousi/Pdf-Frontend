import {
  Type, Pencil, Shapes, Eraser, Download,
  Square, Undo2, Redo2, PlusCircle, MinusCircle, Plus
} from "lucide-react";
import { RiTriangleLine } from "react-icons/ri";
import { FaRegCircle } from "react-icons/fa";
import { useState, useEffect } from "react";

interface ToolbarProps {
  onAddPage?: () => void;
  onExport?: () => void;
}

export default function Toolbar({ onAddPage, onExport }: ToolbarProps) {
  const [isShapesOpen, setIsShapesOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [selectedTextEl, setSelectedTextEl] = useState<HTMLElement | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const getTargetContext = () => {
    const iframe = document.querySelector('iframe');
    const doc = iframe?.contentDocument || iframe?.contentWindow?.document || document;
    const selectedPage = doc.querySelector('.pc.selected-page') || doc.querySelector('.pc:last-child') || doc.querySelector('.pc');
    return { doc, container: selectedPage as HTMLElement };
  };

  const clearSelection = (doc: Document) => {
    doc.querySelectorAll('.draggable-element').forEach(el => el.classList.remove('selected'));
    setSelectedTextEl(null);
  };

  const saveState = () => {
    const iframe = document.querySelector('iframe');
    const container = iframe?.contentDocument?.getElementById('page-container');
    if (!container) return;
    setHistory(prev => [...prev.slice(0, historyIndex + 1), container.innerHTML]);
    setHistoryIndex(prev => prev + 1);
  };

  // --- DRAWING LOGIC ---
  const setupCanvas = (doc: Document) => {
    const pages = doc.querySelectorAll('.pc');

    pages.forEach((page: any) => {
      let canvas = page.querySelector('.draw-canvas') as HTMLCanvasElement;
      if (!canvas) {
        canvas = doc.createElement('canvas');
        canvas.className = 'draw-canvas';
        canvas.width = page.offsetWidth;
        canvas.height = page.offsetHeight;
        Object.assign(canvas.style, {
          position: 'absolute', top: '0', left: '0', zIndex: '500', pointerEvents: 'none'
        });
        page.appendChild(canvas);
      }

      canvas.style.pointerEvents = (activeTool === 'pencil' || activeTool === 'eraser') ? 'auto' : 'none';

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.onmousedown = (e) => {
        if (activeTool !== 'pencil' && activeTool !== 'eraser') return;
        ctx.beginPath();
        ctx.moveTo(e.offsetX, e.offsetY);
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = activeTool === 'eraser' ? 25 : 3;
        ctx.lineCap = "round";
        ctx.globalCompositeOperation = activeTool === 'eraser' ? 'destination-out' : 'source-over';

        canvas.onmousemove = (mv) => {
          ctx.lineTo(mv.offsetX, mv.offsetY);
          ctx.stroke();
        };
      };

      canvas.onmouseup = () => {
        canvas.onmousemove = null;
        saveState();
      };
    });
  };

  useEffect(() => {
    const { doc } = getTargetContext();
    setupCanvas(doc);

    const handlePageUpdate = () => setupCanvas(doc);
    doc.addEventListener('pageAdded', handlePageUpdate);
    return () => doc.removeEventListener('pageAdded', handlePageUpdate);
  }, [activeTool]);

  const attachMoveAndResize = (el: HTMLElement, doc: Document, container: HTMLElement) => {
    let handle = el.querySelector('.resizer-handle') as HTMLElement;
    if (!handle) {
      handle = doc.createElement('div');
      handle.className = 'resizer-handle';
      el.appendChild(handle);
    }

    el.onmousedown = (e) => {
      if (activeTool === 'eraser') { el.remove(); saveState(); return; }
      if (e.target === handle) return;

      e.stopPropagation();
      clearSelection(doc);
      el.classList.add('selected');

      doc.querySelectorAll('.pc').forEach(p => p.classList.remove('selected-page'));
      container.classList.add('selected-page');

      if (el.classList.contains('text-box')) setSelectedTextEl(el);

      const rect = el.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      const move = (mE: MouseEvent) => {
        const cRect = container.getBoundingClientRect();
        el.style.left = `${mE.clientX - cRect.left - offsetX}px`;
        el.style.top = `${mE.clientY - cRect.top - offsetY}px`;
      };

      const stop = () => {
        doc.removeEventListener("mousemove", move);
        doc.removeEventListener("mouseup", stop);
        saveState();
      };
      doc.addEventListener("mousemove", move);
      doc.addEventListener("mouseup", stop);
    };

    handle.onmousedown = (e) => {
      e.stopPropagation(); e.preventDefault();
      const startW = el.offsetWidth;
      const startH = el.offsetHeight;
      const startX = e.clientX;
      const startY = e.clientY;

      const resize = (mE: MouseEvent) => {
        const nw = startW + (mE.clientX - startX);
        const nh = startH + (mE.clientY - startY);
        if (nw > 30) el.style.width = `${nw}px`;
        if (nh > 30) el.style.height = `${nh}px`;
      };

      const stopR = () => {
        doc.removeEventListener("mousemove", resize);
        doc.removeEventListener("mouseup", stopR);
        saveState();
      };
      doc.addEventListener("mousemove", resize);
      doc.addEventListener("mouseup", stopR);
    };
  };

  const createText = () => {
    const { doc, container } = getTargetContext();
    if (!container) return;
    clearSelection(doc);
    const el = doc.createElement("div");
    el.className = "draggable-element text-box selected";
    el.innerHTML = '<div contenteditable="true" style="outline:none;min-width:50px;">New Text</div>';
    Object.assign(el.style, {
      position: 'absolute', left: '50px', top: '50px', fontSize: '24px',
      padding: '10px', zIndex: '2000', cursor: 'move', color: 'black', backgroundColor: 'white'
    });
    attachMoveAndResize(el, doc, container);
    container.appendChild(el);
    setSelectedTextEl(el);
    saveState();
  };

  const createShape = (type: 'square' | 'circle' | 'triangle') => {
    const { doc, container } = getTargetContext();
    if (!container) return;
    clearSelection(doc);
    const el = doc.createElement("div");
    el.className = "draggable-element selected";
    const base = { position: 'absolute', left: '100px', top: '100px', width: '120px', height: '120px', zIndex: '1500', cursor: 'move' };
    if (type === 'square') Object.assign(el.style, base, { backgroundColor: '#3b82f6' });
    if (type === 'circle') Object.assign(el.style, base, { backgroundColor: '#ef4444', borderRadius: '50%' });
    if (type === 'triangle') Object.assign(el.style, base, { backgroundColor: '#22c55e', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' });
    attachMoveAndResize(el, doc, container);
    container.appendChild(el);
    setIsShapesOpen(false);
    saveState();
  };

  const changeFontSize = (delta: number) => {
    if (!selectedTextEl) return;
    const current = parseInt(window.getComputedStyle(selectedTextEl).fontSize);
    selectedTextEl.style.fontSize = `${current + delta}px`;
    saveState();
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-zinc-900 border-b border-zinc-800 shadow-md z- text-zinc-100 font-sans">
      <div className="flex items-center justify-between px-6 h-20">
        <div className="flex items-center">
          <ToolGroup>
            <button onClick={() => { }} className="p-2 hover:bg-zinc-800 opacity-20"><Undo2 size={18} /></button>
            <button onClick={() => { }} className="p-2 hover:bg-zinc-800 opacity-20"><Redo2 size={18} /></button>
          </ToolGroup>

          <ToolGroup>
            <ToolButton icon={Type} label="Text" onClick={() => { setActiveTool('text'); createText(); }} active={activeTool === 'text'} />
            {selectedTextEl && (
              <div className="flex gap-1 bg-zinc-800 rounded-lg p-1 mx-2">
                <button onClick={() => changeFontSize(-2)} className="p-1 hover:text-blue-400"><MinusCircle size={16} /></button>
                <button onClick={() => changeFontSize(2)} className="p-1 hover:text-blue-400"><PlusCircle size={16} /></button>
              </div>
            )}
            <ToolButton icon={Pencil} label="Draw" onClick={() => setActiveTool('pencil')} active={activeTool === 'pencil'} />
            <div className="relative">
              <button onClick={() => setIsShapesOpen(!isShapesOpen)} className={`flex flex-col items-center justify-center min-w-[72px] h-16 rounded-lg transition-all ${activeTool === 'shapes' ? 'text-blue-400' : 'text-zinc-400 hover:bg-zinc-800'}`}>
                <Shapes size={20} /><span className="text-[11px] mt-1.5 font-medium">Shapes</span>
              </button>
              {isShapesOpen && (
                <div className="absolute left-0 mt-2 w-44 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-1.5 z- flex flex-col">
                  <button onClick={() => createShape('square')} className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-zinc-800 rounded-lg"><Square size={16} /> Square</button>
                  <button onClick={() => createShape('circle')} className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-zinc-800 rounded-lg"><FaRegCircle size={16} /> Circle</button>
                  <button onClick={() => createShape('triangle')} className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-zinc-800 rounded-lg"><RiTriangleLine size={16} /> Triangle</button>
                </div>
              )}
            </div>
            <ToolButton icon={Eraser} label="Eraser" onClick={() => setActiveTool('eraser')} active={activeTool === 'eraser'} />
          </ToolGroup>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={onAddPage} className="flex items-center gap-2 px-4 py-2 border border-zinc-700 rounded-xl hover:bg-zinc-800 transition active:scale-95"><Plus size={18} /> Add Page</button>
          <button onClick={onExport} className="bg-white text-black px-6 py-2.5 rounded-xl hover:bg-zinc-200 font-bold flex items-center gap-2 shadow-lg active:scale-95"><Download size={18} /> Export</button>
        </div>
      </div>
    </nav>
  );
}

const ToolGroup = ({ children }: any) => <div className="flex items-center gap-1 px-4 border-r border-zinc-800 last:border-r-0">{children}</div>;
const ToolButton = ({ icon: Icon, label, onClick, active }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center min-w-[72px] h-16 rounded-lg transition-all ${active ? "bg-zinc-800 text-blue-400 shadow-inner" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"}`}>
    <Icon size={20} /><span className="text-[11px] font-medium mt-1.5">{label}</span>
  </button>
);