import type { Language } from '../types.js'

export const json: Language = {
  name: 'json',
  rules: [
    { type: 'text', pattern: /\s+/ },
    { type: 'property', pattern: /"(?:\\(?:[\s\S]|$)|[^"\\\r\n])*"(?=\s*:)/ },
    { type: 'string', pattern: /"(?:\\(?:[\s\S]|$)|[^"\\\r\n])*(?:"|(?=[\r\n])|$)/ },
    { type: 'number', pattern: /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/ },
    { type: 'boolean', pattern: /(?:true|false)\b/ },
    { type: 'null', pattern: /null\b/ },
    { type: 'punctuation', pattern: /[{}[\],:]/ },
  ],
}
