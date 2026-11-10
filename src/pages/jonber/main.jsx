import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import JonberApp from './JonberApp.jsx'
import { loadAdSenseScript } from '../../components/AdSlot.jsx'
import '../../styles.css'
import '../kbo/kbo.css'
import '../apt/apt.css'
import './jonber.css'

loadAdSenseScript()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <JonberApp />
  </StrictMode>,
)
