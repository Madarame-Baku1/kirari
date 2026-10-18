import type { Language } from '../types.js'

const symbol = /[^\s,()[\]{}";@^`~\\:#'][^\s,()[\]{}";@^`~\\]*/
const boundary = /(?=[\s,()[\]{}";@^`~\\]|$)/
const keywords = 'def defn defn- defmacro defonce defmulti defmethod defprotocol defrecord deftype fn fn* let let* letfn loop loop* recur if if-let if-not when when-let when-not cond case do quote var set! throw try catch finally new . monitor-enter monitor-exit ns in-ns require import use binding for doseq lazy-seq'.split(' ')

export const clojure: Language = {
  name: 'clojure',
  rules: [
    { type: 'text', pattern: /[\s,]+/ },
    { type: 'comment', pattern: /;[^\r\n]*|#![^\r\n]*/ },
    { type: 'regex', pattern: /#"(?:\\(?:[\s\S]|$)|[^"\\])*(?:"|$)/ },
    { type: 'string', pattern: /"(?:\\(?:[\s\S]|$)|[^"\\])*(?:"|$)/ },
    { type: 'string', pattern: /\\(?:[a-zA-Z][a-zA-Z0-9]*|[\s\S]|$)/u },
    { type: 'property', pattern: /::?[^\s,()[\]{}";@^`~\\]+/ },
    { type: 'boolean', pattern: new RegExp(`(?:true|false)${boundary.source}`) },
    { type: 'null', pattern: new RegExp(`nil${boundary.source}`) },
    { type: 'number', pattern: new RegExp(`(?:##(?:-?Inf|NaN)|[+-]?(?:0[xX][\\da-fA-F]+N?|\\d+[rR][\\da-zA-Z]+N?|\\d+/\\d+|\\d+(?:\\.\\d*)?(?:[eE][+-]?\\d+)?[MN]?))${boundary.source}`) },
    { type: 'keyword', pattern: new RegExp(`(?:${keywords.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})${boundary.source}`) },
    // shortcut: discarded forms and reader conditionals retain ordinary lexical tokens; use a reader to resolve their structure.
    { type: 'punctuation', pattern: /#\?@?|#[_'({]|~@|[()\[\]{}'`~@^]/ },
    { type: 'tag', pattern: /#[^\s,()[\]{}";@^`~\\]+/ },
    { type: 'variable', pattern: symbol },
  ],
}
