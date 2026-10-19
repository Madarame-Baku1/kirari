import type { Token } from '../types.js'

const declarations: Record<string, RegExp | null> = {
  c: null, cpp: null, csharp: null, dart: null, glsl: null, java: null, groovy: null,
  clojure: /^(defn-?|defmacro|defmulti|defmethod|fn\*?)$/,
  elixir: /^(defp?|defmacro[p]?|defguard[p]?|defdelegate)$/,
  go: /^func$/, julia: /^(function|macro)$/, kotlin: /^fun$/, lua: /^function$/,
  php: /^function$/i, powershell: /^(function|filter|workflow)$/i, python: /^def$/,
  r: null, ruby: /^def$/, rust: /^fn$/, scala: /^def$/, shell: /^function$/,
  swift: /^func$/, zig: /^fn$/, sql: /^(function|procedure)$/i, protobuf: /^rpc$/,
}

const literals: Record<string, RegExp> = {
  csharp: /^delegate$/, elixir: /^fn$/, go: /^func$/, julia: /^function$/,
  kotlin: /^fun$/, lua: /^function$/, php: /^(function|fn)$/i,
  python: /^lambda$/, r: /^(function|\\)$/, ruby: /^(lambda|proc)$/,
}

// Classify after grammar-specific lexing so quoted names work and opaque literals stay opaque.
export const classifyDefinitions = (tokens: Token[], language: string): Token[] => {
  if (!Object.hasOwn(declarations, language)) return tokens
  const declaration = declarations[language]
  const positions: number[] = []
  const parts = tokens.filter((token, index) => {
    if (token.type === 'text' || token.type === 'comment') return false
    positions.push(index)
    return true
  })
  const closes = new Map<number, number>()
  const opens = new Map<number, number>()
  const parents = new Map<number, number>()
  const stack: { index: number; close: string }[] = []
  const angles: number[] = []
  const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}', '#(': ')', '@(': ')', '@{': '}' }
  for (let index = 0; index < parts.length; index++) {
    const token = parts[index]!
    if (stack.length) parents.set(index, stack.at(-1)!.index)
    if (token.type === 'punctuation') {
      if (pairs[token.value]) stack.push({ index, close: pairs[token.value]! })
      else if (token.value === stack.at(-1)?.close) closes.set(stack.pop()!.index, index)
    }
    if (token.type === 'operator' && token.value === '<') angles.push(index)
    else if (token.type === 'operator' && /^>+$/.test(token.value)) {
      for (const _ of token.value) if (angles.length) {
        const opening = angles.pop()!
        closes.set(opening, index)
        opens.set(index, opening)
      }
    } else if (/^[;{}]$/.test(token.value)) angles.length = 0
  }
  const value = (index: number): string => parts[index]?.value ?? ''
  const invoked = (end: number): boolean => /^(\(|\[|\.|\?\.|::)$/.test(value(end + 1))
  const block = (start: number): boolean => {
    const end = closes.get(start)
    return end === undefined || !invoked(end)
  }
  const arrow = language === 'java' || language === 'julia' ? '->' : '=>'
  const arrows = /^(csharp|dart|java|julia|scala)$/.test(language)

  const literal = (start: number, limit = parts.length): boolean => {
    while (start < limit) {
      const first = value(start)
      if ((language === 'rust' && /^(async|move)$/.test(first))
        || (language === 'csharp' && /^(async|static)$/.test(first))
        || (language === 'php' && /^static$/i.test(first))) { start++; continue }
      if (language === 'clojure') return first === '#(' || first === '(' && /^fn\*?$/.test(value(start + 1))
      if (language === 'rust' && (first === '|' || first === '||')) return true
      if (language === 'elixir' && first === '&') return true
      if (language === 'ruby' && first === '->') {
        let body = start + 1
        if (value(body) === '(') body = (closes.get(body) ?? limit) + 1
        return value(body) === 'do' || value(body) === '{' && block(body)
      }
      if (first === '{' && /^(groovy|kotlin|powershell|swift)$/.test(language)) return block(start)
      if (first === '{' && language === 'scala') {
        for (let cursor = start + 1; cursor < (closes.get(start) ?? limit); cursor++) {
          if (value(cursor) === '=>') return block(start)
          if (pairs[value(cursor)] && !closes.has(cursor)) return false
          cursor = closes.get(cursor) ?? cursor
        }
        return false
      }
      if (first === '[' && language === 'cpp') {
        let cursor = (closes.get(start) ?? limit) + 1
        while (cursor < limit) {
          if (value(cursor) === '{') return block(cursor)
          if (/^[;=}]$/.test(value(cursor))) return false
          if (pairs[value(cursor)] && !closes.has(cursor)) return false
          cursor = (closes.get(cursor) ?? cursor) + 1
        }
        return false
      }
      if (literals[language]?.test(first)) {
        if (language === 'ruby' && !/^(\{|do|\()$/.test(value(start + 1))) return false
        // shortcut: recognize explicit literals, not inferred aliases or results of arbitrary expressions.
        if (/^(csharp|go|kotlin|php|ruby)$/.test(language)) {
          for (let cursor = start + 1; cursor < limit; cursor++) {
            if (value(cursor) === '{' && !(language === 'go' && /^(struct|interface)$/.test(value(cursor - 1)))) return block(cursor)
            if (/^(;|=|:=|=>|do|end)$/.test(value(cursor))) break
            if (pairs[value(cursor)] && !closes.has(cursor)) return true
            cursor = closes.get(cursor) ?? cursor
          }
        }
        return true
      }
      if ((first === '<' && language === 'dart') || (first === '[' && language === 'scala')) {
        const end = closes.get(start)
        if (end === undefined) return false
        if (language === 'scala') return value(end + 1) === '=>'
        start = end + 1
        continue
      }
      if (first === '(') {
        const end = closes.get(start)
        if (end === undefined || end >= limit) return false
        if (arrows && value(end + 1) === arrow) return true
        if (language === 'dart') {
          let body = end + 1
          if (value(body) === 'async' || value(body) === 'sync') { body++; if (value(body) === '*') body++ }
          if (value(body) === '=>') return true
          if (value(body) === '{') return block(body)
        }
        if (invoked(end)) return false
        limit = end
        start++
        continue
      }
      return arrows && /^(variable|keyword)$/.test(parts[start]?.type ?? '') && value(start + 1) === arrow
    }
    return false
  }

  const qualifiers = new Set<number>()
  for (let index = 0; index < parts.length; index++) {
    const token = parts[index]!
    if (!/^(variable|property|type|function|keyword)$/.test(token.type)) continue
    let before = index - 1
    if (value(before) === '*' || value(before) === '&') before--
    if (opens.has(before)) before = opens.get(before)! - 1
    const followsDeclaration = !!declaration?.test(value(before))
      || /^(\.|:)$/.test(value(before)) && qualifiers.has(before - 1)
    const qualifierEnd = value(index + 1) === '<' ? closes.get(index + 1) ?? index : index
    const qualified = followsDeclaration && /^(\.|:)$/.test(value(qualifierEnd + 1))
    if (qualified) qualifiers.add(qualifierEnd)
    const declared = followsDeclaration && !qualified
    let isFunction = declared
    const member = /^(\.|\?\.|->|\?->|::)$/.test(value(index - 1))
    let next = index + 1
    if (!declared && token.type !== 'variable' && token.type !== 'property') continue
    if (!member && language !== 'clojure' && (!/^[$@]/.test(token.value) || language === 'csharp')) {
      if (value(next) === '(') isFunction = true
      if (value(next) === '<' && /^(cpp|csharp|dart|java|rust|swift)$/.test(language)
        && (parts[next]?.start === token.end || /^(type|variable)$/.test(parts[index - 1]?.type ?? ''))
        && value((closes.get(next) ?? parts.length) + 1) === '(') isFunction = true
    }
    if (!member) {
      if (value(next) === ':' && /^(python|kotlin|scala|swift|rust)$/.test(language)
        || language === 'go' && value(index - 1) === 'var' && value(next) !== '=') {
        while (++next < parts.length && value(next) !== '=') {
          if (/^[;{},):\]]$/.test(value(next)) || /^(val|var|let|def)$/.test(value(next))) break
          if (pairs[value(next)] && !closes.has(next)) break
          next = closes.get(next) ?? next
        }
      }
      const assignment = value(next) === '=' || language === 'go' && value(next) === ':='
        || language === 'r' && /^(<-|<<-)$/.test(value(next))
      if (assignment && literal(next + 1)) isFunction = true
      if (language === 'clojure') {
        const parent = parents.get(index)
        const binding = /^(def|defonce)$/.test(value(index - 1))
          || parent !== undefined && value(parent) === '[' && /^(let\*?|loop\*?|binding)$/.test(value(parent - 1))
        if (binding && literal(next)) isFunction = true
      }
    }
    if (isFunction) tokens[positions[index]!] = { ...token, type: 'function' }
  }
  return tokens
}
