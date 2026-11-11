import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import CommuteApp from './CommuteApp.jsx'
import { loadAdSenseScript } from '../../components/AdSlot.jsx'
import '../../styles.css'
import '../kbo/kbo.css'
import '../apt/apt.css'
import './commute.css'

loadAdSenseScript()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CommuteApp />
  </StrictMode>,
)
