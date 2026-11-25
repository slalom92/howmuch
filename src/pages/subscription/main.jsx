import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import SubscriptionApp from './SubscriptionApp.jsx'
import { loadAdSenseScript } from '../../components/AdSlot.jsx'
import '../../styles.css'
import '../kbo/kbo.css'
import '../apt/apt.css'
import '../jonber/jonber.css'
import '../survive/survive.css'
import './subscription.css'
import '../../design.css'
import '../../design.js'

loadAdSenseScript()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SubscriptionApp />
  </StrictMode>,
)
