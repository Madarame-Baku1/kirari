import type { Language } from '../types.js'

export const dockerfile: Language = {
  name: 'dockerfile',
  rules: [
    { type: 'text', pattern: /\s+/ },
    { type: 'comment', pattern: /^[ \t]*#[^\r\n]*/m },
    { type: 'keyword', pattern: /(?<=^[ \t]*)(?:FROM|RUN|CMD|LABEL|MAINTAINER|EXPOSE|ENV|ADD|COPY|ENTRYPOINT|VOLUME|USER|WORKDIR|ARG|ONBUILD|STOPSIGNAL|HEALTHCHECK|SHELL)\b/im },
    { type: 'keyword', pattern: /\bAS\b/i },
    { type: 'property', pattern: /--[\w-]+/ },
    { type: 'variable', pattern: /\$(?:\{[^}\r\n]*(?:\}|(?=[\r\n])|$)|[a-zA-Z_]\w*)|[a-zA-Z_]\w*(?==)/ },
    { type: 'string', pattern: /"(?:\\(?:[^]|$)|[^"\\])*(?:"|$)|'(?:\\(?:[^]|$)|[^'\\])*(?:'|$)/ },
    { type: 'operator', pattern: /\\\r?\n|&&|\|\||[=|;]/ },
    { type: 'number', pattern: /\b\d+(?:\.\d+)*\b/ },
    { type: 'text', pattern: /[a-zA-Z_][\w./:-]*/ },
    { type: 'punctuation', pattern: /[\[\]{},]/ },
  ],
}
