import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import CarApp from './CarApp.jsx'
import { loadAdSenseScript } from '../../components/AdSlot.jsx'
import '../../styles.css'
import '../kbo/kbo.css'
import '../apt/apt.css'
import './car.css'
import '../../design.css'
import '../../design.js'

loadAdSenseScript()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CarApp />
  </StrictMode>,
)
