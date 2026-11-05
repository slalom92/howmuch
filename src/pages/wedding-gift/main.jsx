import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import GiftApp from './GiftApp.jsx'
import { loadAdSenseScript } from '../../components/AdSlot.jsx'
import '../../styles.css'
import './gift.css'

loadAdSenseScript()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GiftApp />
  </StrictMode>,
)
