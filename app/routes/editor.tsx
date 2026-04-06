import { useLocation } from "react-router";
import Toolbar from "../Components/Toolbar";

export default function Editor() {
  const location = useLocation();
  const htmlUrl = location.state?.htmlUrl;

  return (
    <div className="flex flex-col min-h-screen bg-black overflow-hidden">
      <Toolbar />
      <div className="pt-24 flex-1 flex justify-center p-4 overflow-hidden">
        {htmlUrl ? (
          <iframe
            className="w-full bg-black border-none rounded-lg overflow-hidden mb-5 h-[85vh]"
          />
        ) : (
          <div className="w-full bg-[#121212] overflow-y-auto overflow-x-hidden rounded-lg flex flex-col h-[85vh] items-center">
            <div contentEditable className="mx-auto w-[600px] bg-white p-20 min-h-[850px] shadow-2xl mb-5 outline-none text-black">
              <h1 className="text-3xl font-bold mb-4">New PDF</h1>
              <p>Type here...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}