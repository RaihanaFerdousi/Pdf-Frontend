import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "PDF Editor - Home" },
    { name: "description", content: "Upload or create a new PDF to start editing." },
  ];
}

export default function Home() {
  return <Welcome />;
}