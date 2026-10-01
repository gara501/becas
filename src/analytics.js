const rawId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() || ''
export const MEASUREMENT_ID = /^G-[A-Z0-9]+$/.test(rawId) ? rawId : ''
export const ANALYTICS_ENABLED = Boolean(MEASUREMENT_ID && window.location.protocol !== 'file:')
const STORAGE_KEY = 'atlasbecas.analytics.v1'
let active = false
let lastPage = null
let memoryChoice = null

export function analyticsChoice() {
  try {
    const choice = window.localStorage.getItem(STORAGE_KEY)
    return choice === 'accepted' || choice === 'rejected' ? choice : memoryChoice
  } catch {
    return memoryChoice
  }
}

export function saveAnalyticsChoice(choice) {
  memoryChoice = choice
  try { window.localStorage.setItem(STORAGE_KEY, choice) } catch { /* Navegación privada: la elección dura esta visita. */ }
  if (choice === 'rejected' && active) {
    window.gtag?.('consent', 'update', { analytics_storage: 'denied' })
    window[`ga-disable-${MEASUREMENT_ID}`] = true
    active = false
    window.location.reload()
  }
}

export function startAnalytics() {
  if (!ANALYTICS_ENABLED || active || analyticsChoice() !== 'accepted') return false
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() { window.dataLayer.push(arguments) }
  window.gtag('consent', 'default', {
    analytics_storage: 'denied', ad_storage: 'denied',
    ad_user_data: 'denied', ad_personalization: 'denied',
  })
  window.gtag('consent', 'update', { analytics_storage: 'granted' })
  window.gtag('js', new Date())
  window.gtag('config', MEASUREMENT_ID, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  })
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
  document.head.append(script)
  active = true
  return true
}

export function trackPageView(route) {
  if (!active || lastPage === route) return
  const previous = lastPage
  lastPage = route
  const location = `${window.location.origin}${window.location.pathname}#${route}`
  window.gtag('event', 'page_view', {
    page_title: document.title,
    page_location: location,
    ...(previous ? { page_referrer: `${window.location.origin}${window.location.pathname}#${previous}` } : {}),
  })
}

export function trackEvent(name, parameters = {}) {
  if (active) window.gtag('event', name, parameters)
}
