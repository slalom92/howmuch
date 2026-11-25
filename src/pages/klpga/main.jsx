import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import GolfApp from './KlpgaApp.jsx'
import KLPGA_TOUR from './klpga.js'
import { loadAdSenseScript } from '../../components/AdSlot.jsx'
import '../../styles.css'
import '../kbo/kbo.css'
import './klpga.css'
import '../../design.css'
import '../../design.js'

loadAdSenseScript()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GolfApp T={KLPGA_TOUR} />
  </StrictMode>,
)
