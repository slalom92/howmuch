import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import SurviveApp from './SurviveApp.jsx'
import { loadAdSenseScript } from '../../components/AdSlot.jsx'
import '../../styles.css'
import '../kbo/kbo.css'
import '../apt/apt.css'
import '../jonber/jonber.css'
import './survive.css'
import '../../design.css'
import '../../design.js'

loadAdSenseScript()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SurviveApp />
  </StrictMode>,
)
