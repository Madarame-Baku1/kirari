import type { RenderOptions, Token } from './types.js'

export const escape = (value: string): string => {
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

/** Extra classes for a token from the `classes` map and the `className` callback. */
export const tokenClasses = (token: Token, options: RenderOptions): string => {
  const mapped = options.classes && Object.hasOwn(options.classes, token.type)
    ? options.classes[token.type] : undefined
  return [mapped, options.className?.(token)].filter(Boolean).join(' ')
}

export const render = (tokens: readonly Token[], options: RenderOptions = {}): string => {
  return tokens.map(token => {
    const extra = tokenClasses(token, options)
    const value = escape(token.value)
    if (token.type === 'text' && !extra) return value
    const classes = `kirari-${token.type}${extra ? ` ${extra}` : ''}`
    return `<span class="${escape(classes)}">${value}</span>`
  }).join('')
}
