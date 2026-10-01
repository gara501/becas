import { useEffect } from 'react'

export function usePanelFocus(panel, closeButton, onClose) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const background = [...document.querySelectorAll('.site-header, .main-content, .site-footer')]
    background.forEach((element) => { element.inert = true })
    closeButton.current?.focus()
    function onKeyDown(event) {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
      if (event.key !== 'Tab') return
      const focusable = [...panel.current.querySelectorAll('a[href], button:not([disabled])')]
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => { document.body.style.overflow = previousOverflow; background.forEach((element) => { element.inert = false }); document.removeEventListener('keydown', onKeyDown) }
  }, [panel, closeButton, onClose])
}
