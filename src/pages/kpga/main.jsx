import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import GolfApp from '../klpga/KlpgaApp.jsx'
import KPGA_TOUR from './kpga.js'
import { loadAdSenseScript } from '../../components/AdSlot.jsx'
import '../../styles.css'
import '../kbo/kbo.css'
import '../klpga/klpga.css'

loadAdSenseScript()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GolfApp T={KPGA_TOUR} />
  </StrictMode>,
)
