import { gsap } from 'gsap'

export const get = <T extends HTMLElement>(selector: string): T => {
  const element = document.querySelector<T>(selector)
  if (!element) throw new Error(`Missing docs element: ${selector}`)
  return element
}

export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')

export const animateIn = (target: gsap.TweenTarget) => {
  if (reducedMotion.matches) return
  gsap.killTweensOf(target)
  gsap.fromTo(target, { opacity: .6, y: 4 }, { opacity: 1, y: 0, duration: .2, ease: 'power2.out', clearProps: 'opacity,transform' })
}

let toastTimer: ReturnType<typeof setTimeout>
export const notify = (message: string) => {
  const toast = get('#toast')
  clearTimeout(toastTimer)
  toast.textContent = message
  toast.hidden = false
  animateIn(toast)
  toastTimer = setTimeout(() => { toast.hidden = true }, 2400)
}

const copiedTimers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>()

/** Copy text; pass the clicked button to morph its copy glyph into a tick. */
export const copyText = async (text: string, button?: HTMLElement, message = 'Copied to clipboard') => {
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text)
    else {
      const field = document.createElement('textarea')
      field.value = text
      field.className = 'sr-only'
      const previous = document.activeElement as HTMLElement | null
      document.body.append(field)
      field.select()
      const copied = document.execCommand('copy')
      field.remove()
      previous?.focus({ preventScroll: true })
      if (!copied) throw new Error('Clipboard unavailable')
    }
    notify(message)
    if (button) {
      clearTimeout(copiedTimers.get(button))
      button.dataset.copied = ''
      copiedTimers.set(button, setTimeout(() => { delete button.dataset.copied }, 1600))
    }
  } catch {
    notify('Couldn’t copy. Select the text and copy it manually.')
  }
}

interface SearchEntry { title: string, description: string, category: string, href: string, keywords?: string }

const setupSearch = () => {
  const dialog = get<HTMLDialogElement>('#search-dialog')
  const input = get<HTMLInputElement>('#doc-search')
  const results = get('#search-results')
  const index: SearchEntry[] = JSON.parse(get('#search-index').textContent ?? '[]')

  const update = () => {
    const query = input.value.trim().toLowerCase()
    const matches = index
      .filter(entry => query ? `${entry.title} ${entry.description} ${entry.keywords ?? ''}`.toLowerCase().includes(query) : entry.category !== 'Language')
      .slice(0, 12)
    results.replaceChildren()
    for (const match of matches) {
      const link = document.createElement('a')
      link.className = 'search-result'
      link.href = match.href
      const text = document.createElement('span')
      const title = document.createElement('strong')
      title.textContent = match.title
      const description = document.createElement('small')
      description.textContent = match.description
      text.append(title, description)
      const category = document.createElement('span')
      category.textContent = match.category
      link.append(text, category)
      link.addEventListener('click', () => dialog.close())
      results.append(link)
    }
    if (!matches.length) {
      const empty = document.createElement('p')
      empty.className = 'search-empty'
      empty.textContent = 'No matches. Try a language name, “themes”, or “API”.'
      results.append(empty)
    }
  }

  const open = () => {
    input.value = ''
    update()
    dialog.showModal()
    input.focus()
    animateIn(dialog)
  }

  get('#open-search').addEventListener('click', open)
  input.addEventListener('input', update)
  get('.close-search').addEventListener('click', event => { event.preventDefault(); dialog.close() })
  dialog.querySelector('form')!.addEventListener('submit', event => {
    event.preventDefault()
    results.querySelector<HTMLAnchorElement>('a')?.click()
  })
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    const links = [...results.querySelectorAll<HTMLAnchorElement>('a')]
    if (!links.length) return
    event.preventDefault()
    const current = links.indexOf(document.activeElement as HTMLAnchorElement)
    const step = event.key === 'ArrowDown' ? 1 : -1
    const next = current < 0 ? (step > 0 ? 0 : links.length - 1) : (current + step + links.length) % links.length
    links[next]!.focus()
  })
  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault()
      if (dialog.open) dialog.close()
      else { get<HTMLDialogElement>('#mobile-menu').close(); open() }
    }
  })
}

const setupMenu = () => {
  const menu = get<HTMLDialogElement>('#mobile-menu')
  get('#open-menu').addEventListener('click', () => { menu.showModal(); animateIn(menu) })
  get('#close-menu').addEventListener('click', () => menu.close())
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => menu.close()))
}

const closeOnBackdrop = (dialog: HTMLDialogElement) => {
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect()
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close()
  })
}

const setupTopbar = () => {
  const topbar = get('.topbar')
  const update = () => topbar.toggleAttribute('data-scrolled', scrollY > 8)
  window.addEventListener('scroll', update, { passive: true })
  update()
}

/** Fade sections up as they enter the viewport. */
export const revealOnScroll = (selector = '[data-reveal]') => {
  const elements = [...document.querySelectorAll<HTMLElement>(selector)]
  if (reducedMotion.matches || !('IntersectionObserver' in window)) return
  gsap.set(elements, { opacity: 0, y: 18 })
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      observer.unobserve(entry.target)
      gsap.to(entry.target, { opacity: 1, y: 0, duration: .6, ease: 'power3.out', clearProps: 'opacity,transform' })
    }
  }, { rootMargin: '0px 0px -10% 0px' })
  elements.forEach(element => observer.observe(element))
}

export const setupCommon = () => {
  setupSearch()
  setupMenu()
  setupTopbar()
  for (const dialog of document.querySelectorAll('dialog')) closeOnBackdrop(dialog)
  document.querySelectorAll<HTMLButtonElement>('[data-copy-target]').forEach(button => button.addEventListener('click', () => void copyText(get(`#${button.dataset.copyTarget}`).textContent ?? '', button)))
}
