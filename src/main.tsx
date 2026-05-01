import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { HashRouter, Route, Routes } from "react-router-dom";
import ProposedRoutesMap from "./routes/ProposedRoutesMap/ProposedRoutesMap";
import GoBostonLevelOfSressMap from "./routes/GoBoston/GoBostonLevelOfStressMap";
import DefaultMap from "./routes/DefaultMap/DefaultMap";
import NetworkMap from "./routes/NetworkMap/NetworkMap.tsx";

// REGISTER ERROR OVERLAY
const showErrorOverlay = (err: ErrorEvent) => {
  // must be within function call because that's when the element is defined for sure.
  const ErrorOverlay = customElements.get("vite-error-overlay");
  // don't open outside vite environment
  if (!ErrorOverlay) {
    return;
  }
  console.log(err);
  const overlay = new ErrorOverlay(err);
  document.body.appendChild(overlay);
};

window.addEventListener("error", showErrorOverlay);
window.addEventListener("unhandledrejection", ({ reason }) =>
  showErrorOverlay(reason),
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<DefaultMap />} />
        <Route path="/network" element={<NetworkMap />} />
        <Route path="/proposed-routes" element={<ProposedRoutesMap />} />
        <Route path="/go-boston" element={<GoBostonLevelOfSressMap />} />
        {/* <Route path="/stress-map" element={<LevelOfStressRouteMap/>}/>
        <Route path="/go-boston" element={<GoBostonLevelOfStressMap/>}/>
        <Route path="/bcu-map" element={<BostonCyclistsUnionMap/>}/> */}
      </Routes>
    </HashRouter>
  </StrictMode>,
);
