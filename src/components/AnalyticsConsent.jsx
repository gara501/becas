import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ANALYTICS_ENABLED, analyticsChoice, saveAnalyticsChoice, startAnalytics, trackPageView } from '../analytics.js'

export default function AnalyticsConsent() {
  const [choice, setChoice] = useState(analyticsChoice)
  const [open, setOpen] = useState(false)
  const location = useLocation()
  if (!ANALYTICS_ENABLED) return null

  const choose = (nextChoice) => {
    saveAnalyticsChoice(nextChoice)
    setChoice(nextChoice)
    setOpen(false)
    if (nextChoice === 'accepted') {
      startAnalytics()
      trackPageView(location.pathname)
    }
  }

  return <>
    <button className="privacy-settings" type="button" onClick={() => setOpen(true)}>Preferencias de analítica</button>
    {(!choice || open) ? <section className="analytics-consent" aria-label="Preferencias de analítica" aria-live="polite">
      <div className="consent-index">PRIVACIDAD / 01</div>
      <div className="consent-body"><h2>Tu recorrido, tu decisión.</h2><p>La analítica opcional nos ayuda a entender qué destinos se consultan y cuándo una búsqueda no da resultados. No añadimos tu texto de búsqueda ni tus becas guardadas a los eventos. El sitio funciona igual si la rechazas. <a href="#/privacidad">Cómo usamos estos datos</a>.</p></div>
      <div className="consent-actions"><button type="button" onClick={() => choose('rejected')}>Solo esenciales</button><button type="button" onClick={() => choose('accepted')}>Permitir analítica</button></div>
    </section> : null}
  </>
}
