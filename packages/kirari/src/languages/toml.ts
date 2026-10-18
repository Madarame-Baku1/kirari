import type { Language } from '../types.js'

export const toml: Language = {
  name: 'toml',
  rules: [
    { type: 'text', pattern: /\s+/ },
    { type: 'comment', pattern: /#[^\r\n]*/ },
    { type: 'heading', pattern: /^[ \t]*\[\[?[^\]\r\n]*(?:\]\]?|(?=[\r\n])|$)/m },
    { type: 'property', pattern: /(?:[\w-]+|"(?:\\[^]|[^"\\\r\n])*"|'[^'\r\n]*')(?=[ \t]*(?:\.|=))/ },
    { type: 'string', pattern: /"""(?:\\(?:[^]|$)|"(?!"")|[^"\\])*(?:""""{0,2}|$)|'''(?:'(?!'')|[^'])*(?:'''''?|'''|$)/ },
    { type: 'string', pattern: /"(?:\\(?:[^]|$)|[^"\\\r\n])*(?:"|(?=[\r\n])|$)|'[^'\r\n]*(?:'|(?=[\r\n])|$)/ },
    { type: 'number', pattern: /\d{4}-\d\d-\d\d(?:[Tt ]\d\d:\d\d:\d\d(?:\.\d+)?(?:[Zz]|[+-]\d\d:\d\d)?)?|\d\d:\d\d:\d\d(?:\.\d+)?/ },
    { type: 'boolean', pattern: /\b(?:true|false)\b/ },
    { type: 'number', pattern: /[+-]?(?:inf|nan)\b|0[xob][\da-fA-F_]+|[+-]?\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d[\d_]*)?/ },
    { type: 'text', pattern: /[\w-]+/ },
    { type: 'operator', pattern: /=/ },
    { type: 'punctuation', pattern: /[{}[\],.]/ },
  ],
}
