import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router";

export function Welcome() {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const response = await fetch("/api/upload-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload or conversion failed");

      const data = await response.json();

      if (data.htmlUrl) {
        navigate("/editor", { state: { htmlUrl: data.htmlUrl } });
      }

    } catch (err) {
      console.error("Error uploading PDF:", err);
      alert("Failed to upload/convert PDF. Check if backend is running on 3001.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="h-screen w-full flex items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-10">
        <h1 className="text-5xl tracking-wide text-white font-hand">
          {isUploading ? "Converting..." : "Welcome to PDF Editor"}
        </h1>
        <div className="flex gap-6 text-white">
          <label className="font-hand px-8 py-2 border-2 border-white rounded-xl cursor-pointer bg-transparent hover:bg-white hover:text-black transition flex items-center justify-center">
            {isUploading ? "Processing..." : "Upload PDF"}
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleImport}
              disabled={isUploading}
            />
          </label>
          <button
            onClick={() => navigate('/editor', { state: { isBlank: true } })}
            disabled={isUploading}
            className="font-hand px-8 py-2 border-2 border-white rounded-xl hover:bg-white hover:text-black transition"
          >
            New PDF
          </button>
        </div>
      </div>
    </main>
  );
}