import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import StockApp from './StockApp.jsx'
import { loadAdSenseScript } from '../../components/AdSlot.jsx'
import '../../styles.css'
import '../kbo/kbo.css'
import '../apt/apt.css'
import '../car/car.css'
import '../jonber/jonber.css'
import './stock.css'

loadAdSenseScript()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StockApp />
  </StrictMode>,
)
