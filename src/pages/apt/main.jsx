import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AptApp from './AptApp.jsx'
import { loadAdSenseScript } from '../../components/AdSlot.jsx'
import '../../styles.css'
import '../kbo/kbo.css'
import './apt.css'
import '../../design.css'
import '../../design.js'

loadAdSenseScript()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AptApp />
  </StrictMode>,
)
