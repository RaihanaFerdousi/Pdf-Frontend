import type React from "react";
import { useNavigate } from "react-router";

export function Welcome() {
  const navigate = useNavigate();

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const response = await fetch("http://localhost:3001/api/upload-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      // Notice we are passing pdfUrl now, not htmlUrl
      navigate("/editor", { state: { pdfUrl: data.pdfUrl } });
    } catch (err: any) {
      console.error("Upload Error:", err);
      alert(`Upload failed: ${err.message}`);
    }
  };

  return (
    <main className="h-screen w-full flex items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-10">
        <h1 className="text-5xl tracking-wide text-white font-hand">
          Welcome to PDF Editor
        </h1>
        <div className="flex gap-6 text-white">
          <label className="font-hand px-8 py-1 border-2 border-white rounded-xl cursor-pointer bg-transparent hover:bg-white hover:text-black transition">
            Upload PDF
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleImport}
            />
          </label>
          <button
            onClick={() => navigate('/editor')}
            className="font-hand px-8 py-1 border-2 border-white rounded-xl hover:bg-white hover:text-black transition"
          >
            New PDF
          </button>
        </div>
      </div>
    </main>
  );
}