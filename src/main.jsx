import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { loadAdSenseScript } from './components/AdSlot.jsx'
import './styles.css'
import './design.css'
import './design.js'

loadAdSenseScript()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
