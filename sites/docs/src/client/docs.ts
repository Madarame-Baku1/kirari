import { copyText, get, setupCommon } from './common.js'
import { sections } from '../navigation.js'

setupCommon()

document.querySelectorAll<HTMLButtonElement>('.anchor-copy').forEach(button => button.addEventListener('click', () => {
  const url = new URL(location.href)
  url.hash = button.dataset.anchor!
  void copyText(url.href, button, 'Link copied')
}))

let scrollPending = false
const updateNavigation = () => {
  const atBottom = innerHeight + scrollY >= document.documentElement.scrollHeight - 4
  const active = atBottom
    ? sections[sections.length - 1]!.id
    : [...sections].reverse().find(section => get(`#${section.id}`).getBoundingClientRect().top <= 140)?.id ?? sections[0]!.id
  document.querySelectorAll<HTMLAnchorElement>('[data-nav]').forEach(link => {
    if (link.dataset.nav === active) link.setAttribute('aria-current', 'location')
    else link.removeAttribute('aria-current')
  })
  scrollPending = false
}
window.addEventListener('scroll', () => {
  if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateNavigation) }
}, { passive: true })
updateNavigation()

const languageLinks = [...document.querySelectorAll<HTMLAnchorElement>('.language-item')]
get<HTMLInputElement>('#language-filter').addEventListener('input', event => {
  const query = (event.target as HTMLInputElement).value.trim().toLowerCase()
  let visible = 0
  for (const link of languageLinks) {
    link.hidden = !link.dataset.search!.includes(query)
    if (!link.hidden) visible++
  }
  get('#language-count').textContent = `${visible} ${visible === 1 ? 'language' : 'languages'}`
  get('#language-empty').hidden = visible !== 0
})
