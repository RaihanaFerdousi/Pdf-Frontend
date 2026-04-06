import {
  Type,
  Pencil,
  Shapes,
  ImagePlus,
  Eraser,
  PlusSquare,
  Download,
  Square,
  Star,
  ChevronDown,
} from "lucide-react";
import { RiTriangleLine } from "react-icons/ri";
import { FaRegCircle } from "react-icons/fa";
import * as React from "react";
import { useState } from "react";

interface ToolbarProps {
  onAddPage?: () => void;
  onExport?: () => void;
}

const ToolGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-1 px-4 border-r border-gray-200 last:border-r-0">
    {children}
  </div>
);

const ToolButton = ({ icon: Icon, label, onClick }: any) => (
  <button
    type="button"
    onClick={onClick}
    className="flex flex-col items-center justify-center min-w-[72px] h-16 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
  >
    <Icon size={20} />
    <span className="text-[11px] font-medium mt-1.5">{label}</span>
  </button>
);

export default function Toolbar({ onAddPage, onExport }: ToolbarProps) {
  const [isShapesOpen, setIsShapesOpen] = useState(false);

  const enableTextEdit = () => {
    document.querySelectorAll(".pdf-html span").forEach((el) => {
      (el as HTMLElement).contentEditable = "true";
    });
  };

  const createShape = (styles: Partial<CSSStyleDeclaration>) => {
    const iframe = document.querySelector('iframe');
    const frameDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
    if (!frameDoc) return;

    const pageContainer = frameDoc.getElementById('page-container');
    if (!pageContainer) return;

    let layer = frameDoc.getElementById("draw-layer");
    if (!layer) {
      layer = frameDoc.createElement('div');
      layer.id = 'draw-layer';
      Object.assign(layer.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: '999'
      });
      pageContainer.appendChild(layer);
    }

    const el = frameDoc.createElement("div");
    el.style.position = "absolute";
    el.style.left = "50px";
    el.style.top = "50px";
    el.style.cursor = "move";
    el.style.pointerEvents = "auto";

    Object.assign(el.style, styles);

    el.onmousedown = (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const shiftX = e.clientX - rect.left;
      const shiftY = e.clientY - rect.top;

      const move = (moveE: MouseEvent) => {
        el.style.left = (moveE.clientX - shiftX) + "px";
        el.style.top = (moveE.clientY - shiftY) + "px";
      };

      frameDoc.addEventListener("mousemove", move);
      frameDoc.onmouseup = () => {
        frameDoc.removeEventListener("mousemove", move);
      };
    };

    layer.appendChild(el);
  };

  const addSquare = () => createShape({
    width: "100px",
    height: "100px",
    backgroundColor: "#3b83f6",
  });

  const addCircle = () => createShape({
    width: "100px",
    height: "100px",
    backgroundColor: "#f63b3b",
    borderRadius: "50%"
  });

const addTriangle = () => createShape({
  width: "0",
  height: "0",
  backgroundColor: "transparent", 
  borderLeft: "50px solid transparent",
  borderRight: "50px solid transparent",
  borderBottom: "100px solid #208c20",
});

  const addStar = () => createShape({
    width: "100px",
    height: "100px",
    backgroundColor: "#eaaa08",
    clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
  });

  return (
    <nav className="fixed top-0 left-0 w-full bg-white border-b border-gray-200 shadow-sm z-[100] select-none">
      <div className="flex items-center justify-between px-6 h-20">
        <div className="flex items-center">
          <ToolGroup>
            <ToolButton icon={Type} label="Text" onClick={enableTextEdit} />
            <ToolButton icon={Pencil} label="Free Draw" />

            <div className="relative">
              <button
                onClick={() => setIsShapesOpen(!isShapesOpen)}
                className={`flex flex-col items-center justify-center min-w-[72px] h-16 rounded-lg transition-colors ${
                  isShapesOpen ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-0.5">
                  <Shapes size={20} />
                  <ChevronDown size={12} className={isShapesOpen ? "rotate-180" : ""} />
                </div>
                <span className="text-[11px] mt-1.5">Shapes</span>
              </button>

              {isShapesOpen && (
                <div className="absolute left-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-2xl p-1.5 z-[9999] flex flex-col gap-0.5">
                  <button onClick={addSquare} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg text-left">
                    <Square size={16} className="text-gray-500" /> <span className="font-medium">Square</span>
                  </button>
                  <button onClick={addCircle} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg text-left">
                    <FaRegCircle size={16} className="text-gray-500" /> <span className="font-medium">Circle</span>
                  </button>
                  <button onClick={addTriangle} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg text-left">
                    <RiTriangleLine size={16} className="text-gray-500" /> <span className="font-medium">Triangle</span>
                  </button>
                  <button onClick={addStar} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg text-left">
                    <Star size={16} className="text-gray-500" /> <span className="font-medium">Star</span>
                  </button>
                </div>
              )}
            </div>

            <label className="cursor-pointer">
              <div className="flex flex-col items-center justify-center min-w-[72px] h-16 rounded-lg text-gray-500 hover:bg-gray-100">
                <ImagePlus size={20} />
                <span className="text-[11px] mt-1.5">Img upload</span>
              </div>
              <input type="file" accept="image/*" className="hidden" />
            </label>
          </ToolGroup>

          <ToolGroup>
            <ToolButton icon={Eraser} label="Eraser" />
          </ToolGroup>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={onAddPage} className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">
            <PlusSquare size={18} /> Add Page
          </button>
          <button onClick={onExport} className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-all active:scale-95">
            <Download size={18} /> Export
          </button>
        </div>
      </div>
    </nav>
  );
}