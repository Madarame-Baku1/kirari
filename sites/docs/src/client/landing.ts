import { gsap } from 'gsap'
import { render, type Token } from '@vortexlabs/kirari/core'
import { typescript } from '@vortexlabs/kirari/languages/typescript'
import { createTokenStream } from '@vortexlabs/kirari/stream'
import { streamSample } from './stream-sample.js'
import { get, reducedMotion, revealOnScroll, setupCommon } from './common.js'

setupCommon()

const demoWindow = get('.demo-window')
const tabs = [...document.querySelectorAll<HTMLButtonElement>('[data-demo]')]

const select = (index: number, focus = false) => {
  tabs.forEach((tab, tabIndex) => {
    const selected = tabIndex === index
    tab.setAttribute('aria-selected', String(selected))
    tab.tabIndex = selected ? 0 : -1
    get(`#demo-${tab.dataset.demo}`).hidden = !selected
  })
  if (focus) tabs[index]!.focus()
  if (!reducedMotion.matches) gsap.fromTo(`#demo-${tabs[index]!.dataset.demo}`, { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: .25, ease: 'power2.out', clearProps: 'opacity,transform' })
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => select(index))
  tab.addEventListener('keydown', event => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    select((index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length, true)
  })
})

document.querySelectorAll<HTMLButtonElement>('[data-demo-palette]').forEach(button => {
  button.addEventListener('click', () => {
    demoWindow.dataset.palette = button.dataset.demoPalette
    document.querySelectorAll('[data-demo-palette]').forEach(item => item.setAttribute('aria-pressed', String(item === button)))
  })
})

/** Glint across the headline every 3 seconds, paused while the hero is offscreen. */
const shineTitle = () => {
  const shine = gsap.timeline({ repeat: -1, repeatDelay: 1.6 })
    .fromTo('.glint-text', { backgroundPosition: '100% 0' }, { backgroundPosition: '0% 0', duration: 1.4, ease: 'power2.inOut' }, 0)
  new IntersectionObserver(([entry]) => { if (entry!.isIntersecting) shine.resume(); else shine.pause() }).observe(get('.hero-title'))
}

/** Type the sample through a real token stream, re-rendering after every patch. */
const setupStream = () => {
  const output = get('#stream-output')
  const status = get('#stream-status')
  const replay = get<HTMLButtonElement>('#stream-replay')
  const frame = get('.stream-window')
  const stream = createTokenStream(typescript)
  const tokens: Token[] = []
  let typing: gsap.core.Tween | undefined

  const play = () => {
    typing?.kill()
    stream.reset()
    tokens.length = 0
    let offset = 0
    let patches = 0
    frame.dataset.streaming = ''
    const step = () => {
      const size = 1 + Math.floor(Math.random() * 6)
      const chunk = streamSample.slice(offset, offset + size)
      offset += chunk.length
      const done = offset >= streamSample.length
      const patch = done ? stream.end(chunk) : stream.write(chunk)
      const stale = tokens.findIndex(token => token.start >= patch.from)
      if (stale >= 0) tokens.length = stale
      tokens.push(...patch.tokens)
      patches++
      output.innerHTML = render(tokens) + (done ? '' : '<span class="stream-caret"></span>')
      status.textContent = done ? `reply.ts · ${patches} patches, ${stream.mode} mode` : `streaming · ${patches} patches`
      if (done) delete frame.dataset.streaming
      else typing = gsap.delayedCall(.018 + Math.random() * .05, step)
    }
    step()
  }

  replay.addEventListener('click', play)
  if (reducedMotion.matches) return
  new IntersectionObserver(([entry], observer) => {
    if (!entry!.isIntersecting) return
    observer.disconnect()
    play()
  }, { rootMargin: '0px 0px -20% 0px' }).observe(frame)
}

/** Language pills lean toward the pointer, the label a little further, and spring back on leave. */
const magnetize = () => {
  if (reducedMotion.matches || !matchMedia('(hover: hover) and (pointer: fine)').matches) return
  document.querySelectorAll<HTMLElement>('.language-cloud a').forEach(pill => {
    const label = pill.firstElementChild as HTMLElement
    let box: DOMRect | undefined
    // Measure once per hover: the pill moves while hovered, so live rects would chase the cursor.
    pill.addEventListener('pointerenter', () => { gsap.set([pill, label], { x: 0, y: 0 }); box = pill.getBoundingClientRect() })
    pill.addEventListener('pointermove', event => {
      if (!box) return
      const x = event.clientX - box.left - box.width / 2
      const y = event.clientY - box.top - box.height / 2
      gsap.to(pill, { x: x * .35, y: y * .45, duration: .3, ease: 'power3.out', overwrite: true })
      gsap.to(label, { x: x * .15, y: y * .2, duration: .3, ease: 'power3.out', overwrite: true })
    })
    pill.addEventListener('pointerleave', () => {
      box = undefined
      gsap.to([pill, label], { x: 0, y: 0, duration: .7, ease: 'elastic.out(1, .4)', overwrite: true })
    })
  })
}

const countStats = () => {
  if (reducedMotion.matches) return
  document.querySelectorAll<HTMLElement>('[data-count]').forEach(element => {
    const target = Number(element.dataset.count)
    const decimals = element.dataset.count!.split('.')[1]?.length ?? 0
    const value = { n: 0 }
    element.textContent = (0).toFixed(decimals)
    new IntersectionObserver(([entry], observer) => {
      if (!entry!.isIntersecting) return
      observer.disconnect()
      gsap.to(value, { n: target, duration: 1.2, ease: 'power2.out', onUpdate: () => { element.textContent = value.n.toFixed(decimals) } })
    }).observe(element)
  })
}

if (!reducedMotion.matches) {
  gsap.timeline({ defaults: { ease: 'power3.out', clearProps: 'opacity,transform' } })
    .from('.hero-title', { y: 16, opacity: 0, duration: .7 })
    .from('.hero-lede, .hero-cta', { y: 12, opacity: 0, duration: .6, stagger: .08 }, .15)
    .from('.demo-window', { y: 28, opacity: 0, duration: .8 }, .3)
    .add(shineTitle, .55)
}
setupStream()
magnetize()
countStats()
revealOnScroll()
