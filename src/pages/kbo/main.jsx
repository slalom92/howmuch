import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import KboApp from './KboApp.jsx'
import { loadAdSenseScript } from '../../components/AdSlot.jsx'
import '../../styles.css'
import './kbo.css'

loadAdSenseScript()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <KboApp />
  </StrictMode>,
)
