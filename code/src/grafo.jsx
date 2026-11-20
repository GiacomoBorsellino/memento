// grafo.jsx — Entry point of the development page /grafo (see grafo.html).
// Not part of the production build: vite build only bundles index.html.

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import StoryGraph from "./components/StoryGraph/StoryGraph.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <StoryGraph />
  </StrictMode>,
);
