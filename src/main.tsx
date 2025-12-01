import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { HashRouter, Route, Routes } from 'react-router-dom'
import ProposedRoutesMap from './routes/ProposedRoutesMap/ProposedRoutesMap'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App/>}/>
        <Route path="/proposed-routes" element={<ProposedRoutesMap/>}/>
        {/* <Route path="/stress-map" element={<LevelOfStressRouteMap/>}/>
        <Route path="/go-boston" element={<GoBostonLevelOfStressMap/>}/>
        <Route path="/bcu-map" element={<BostonCyclistsUnionMap/>}/> */}
      </Routes>
    </HashRouter>
  </StrictMode>,
)
