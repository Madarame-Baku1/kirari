import type { RenderOptions, Token } from './types.js'

const escape = (value: string): string => {
  return value.replace(/[&<>"']/g, char => {
    switch (char) {
      case '&': return '&amp;'
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '"': return '&quot;'
      default: return '&#39;'
    }
  })
}

export const render = (tokens: readonly Token[], options: RenderOptions = {}): string => {
  return tokens.map(token => {
    const mapped = options.classes && Object.hasOwn(options.classes, token.type)
      ? options.classes[token.type] : undefined
    const extra = [mapped, options.className?.(token)].filter(Boolean).join(' ')
    const value = escape(token.value)
    if (token.type === 'text' && !extra) return value
    const classes = `kirari-${token.type}${extra ? ` ${extra}` : ''}`
    return `<span class="${escape(classes)}">${value}</span>`
  }).join('')
}
