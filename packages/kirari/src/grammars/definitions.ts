import { isSignificant } from '../types.js'
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

// Modifiers that may precede a function literal, such as `async move |x|` in Rust.
const modifiers: Record<string, RegExp> = {
  csharp: /^(async|static)$/, php: /^static$/i, rust: /^(async|move)$/,
}

const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}', '#(': ')', '@(': ')', '@{': '}' }

/**
 * Indexes bracket structure over significant tokens: `closes` maps an opening index to its
 * closing index (including `<…>` generics), `opens` maps a closing `>` back, and `parents`
 * maps each token to its innermost enclosing bracket. `open` lists the closing values of
 * brackets opened before `parts`, outermost first; tokens inside them get the parent `-1`.
 * Without `generics`, `<` and `>` stay comparison operators.
 */
const matchBrackets = (parts: readonly Token[], open: readonly string[], generics: boolean) => {
  const closes = new Map<number, number>()
  const opens = new Map<number, number>()
  const parents = new Map<number, number>()
  const stack: { index: number; close: string }[] = open.map(close => ({ index: -1, close }))
  const angles: number[] = []
  for (let index = 0; index < parts.length; index++) {
    const token = parts[index]!
    if (stack.length) parents.set(index, stack.at(-1)!.index)
    if (token.type === 'punctuation') {
      if (pairs[token.value]) stack.push({ index, close: pairs[token.value]! })
      else if (token.value === stack.at(-1)?.close) {
        const opening = stack.pop()!.index
        if (opening >= 0) closes.set(opening, index)
      }
    }
    if (!generics) continue
    if (token.type === 'operator' && token.value === '<') angles.push(index)
    else if (token.type === 'operator' && /^>+$/.test(token.value)) {
      for (const _ of token.value) if (angles.length) {
        const opening = angles.pop()!
        closes.set(opening, index)
        opens.set(index, opening)
      }
    } else if (/^[;{}]$/.test(token.value)) angles.length = 0
  }
  return { closes, opens, parents }
}

// Classify after grammar-specific lexing so quoted names work and opaque literals stay opaque.
//
// Works on significant tokens only (`parts`) in two steps: index bracket structure, then visit
// each name and mark it as a function when it is declared (`def name`), called (`name(`), or
// bound to a function literal (`name = fn …`). Streams pass `open` when `tokens` start inside brackets.
export const classifyDefinitions = (tokens: Token[], language: string, open: readonly string[] = []): Token[] => {
  if (!Object.hasOwn(declarations, language)) return tokens
  const declaration = declarations[language]
  const positions: number[] = []
  const parts = tokens.filter((token, index) => {
    if (!isSignificant(token.type)) return false
    positions.push(index)
    return true
  })
  const { closes, opens, parents } = matchBrackets(parts, open, language !== 'python')
  const lineBreakBefore = (index: number): boolean => {
    for (let at = positions[index - 1]! + 1; at < positions[index]!; at++) if (endsLine(tokens[at]!.value)) return true
    return false
  }
  const value = (index: number): string => parts[index]?.value ?? ''
  const invoked = (end: number): boolean => /^(\(|\[|\.|\?\.|::)$/.test(value(end + 1))
  const block = (start: number): boolean => {
    const end = closes.get(start)
    return end === undefined || !invoked(end)
  }
  const arrow = language === 'java' || language === 'julia' ? '->' : '=>'
  const arrows = /^(csharp|dart|java|julia|scala)$/.test(language)

  // Language-specific function literal forms; undefined when `first` starts none of them.
  const specialForm = (first: string, start: number, limit: number): boolean | undefined => {
    switch (language) {
      case 'clojure': return first === '#(' || first === '(' && /^fn\*?$/.test(value(start + 1))
      case 'rust': return first === '|' || first === '||' ? true : undefined
      case 'elixir': return first === '&' ? true : undefined
      case 'ruby': {
        if (first !== '->') return undefined
        let body = start + 1
        if (value(body) === '(') body = (closes.get(body) ?? limit) + 1
        return value(body) === 'do' || value(body) === '{' && block(body)
      }
      case 'groovy': case 'kotlin': case 'powershell': case 'swift':
        return first === '{' ? block(start) : undefined
      case 'scala': {
        // `{ case … => … }` and `{ x => … }`
        if (first !== '{') return undefined
        for (let cursor = start + 1; cursor < (closes.get(start) ?? limit); cursor++) {
          if (value(cursor) === '=>') return block(start)
          if (pairs[value(cursor)] && !closes.has(cursor)) return false
          cursor = closes.get(cursor) ?? cursor
        }
        return false
      }
      case 'cpp': {
        // `[captures](params) specifiers -> type { … }`
        if (first !== '[') return undefined
        let cursor = (closes.get(start) ?? limit) + 1
        while (cursor < limit) {
          if (value(cursor) === '{') return block(cursor)
          if (/^[;=}]$/.test(value(cursor))) return false
          if (pairs[value(cursor)] && !closes.has(cursor)) return false
          cursor = (closes.get(cursor) ?? cursor) + 1
        }
        return false
      }
    }
    return undefined
  }

  // A literal introduced by a keyword such as `func`, `fun`, `lambda`, or `delegate`.
  const keywordLiteral = (start: number, limit: number): boolean => {
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

  // Whether the expression starting at `start` is a function literal.
  const literal = (start: number, limit = parts.length): boolean => {
    while (start < limit) {
      const first = value(start)
      if (modifiers[language]?.test(first)) { start++; continue }
      const special = specialForm(first, start, limit)
      if (special !== undefined) return special
      if (literals[language]?.test(first)) return keywordLiteral(start, limit)
      // Type parameters: Dart `<T>(x) => …` continues; Scala `[T] => …` decides here.
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

  // Qualified declarations such as `def self.name` or `function obj:name` record each
  // qualifier so the final segment still counts as declared.
  const qualifiers = new Set<number>()
  for (let index = 0; index < parts.length; index++) {
    const token = parts[index]!
    if (!/^(variable|property|type|function|keyword)$/.test(token.type)) continue
    // Find the token before the name, skipping a `*`/`&` marker and type parameters (`fun <T> name`).
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
    // Calls: `name(` and generic `name<T>(`.
    if (!member && language !== 'clojure' && (!/^[$@]/.test(token.value) || language === 'csharp')) {
      if (value(next) === '(') isFunction = true
      if (value(next) === '<' && /^(cpp|csharp|dart|java|rust|swift)$/.test(language)
        && (parts[next]?.start === token.end || /^(type|variable)$/.test(parts[index - 1]?.type ?? ''))
        && value((closes.get(next) ?? parts.length) + 1) === '(') isFunction = true
    }
    // Bindings to function literals, skipping a type annotation (`name: T = …`, Go `var name T = …`).
    if (!member) {
      if (value(next) === ':' && /^(python|kotlin|scala|swift|rust)$/.test(language)
        || language === 'go' && value(index - 1) === 'var' && value(next) !== '=') {
        while (++next < parts.length) {
          // A top-level Python annotation ends with its logical line.
          if (language === 'python' && !parents.has(index) && lineBreakBefore(next)) { next = -1; break }
          if (value(next) === '=') break
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

/** Whether text contains a newline that is not a backslash line continuation. */
export const endsLine = (text: string): boolean => /[\r\n]/.test(text.replace(/\\(?:\r\n|\r|\n)/g, ''))

const memberAccess = /^(\.|\?\.|->|\?->|::)$/
const nameType = /^(variable|property|type|function|keyword|boolean|null)$/
const backReference = /^(def|\*|&|\.|:|\?\.|->|\?->|::|>+)$/

/**
 * Significant-token state before a point in Python source, tracked so a stream can tell when
 * `classifyDefinitions` results before that point no longer depend on later tokens.
 */
export interface DefinitionState {
  /** Open brackets, as in `matchBrackets`, with the value before each opening. */
  brackets: { close: string; before: string }[]
  /** Bracket depths of `name:` annotation scans that have not reached `=` or a stop token. */
  annotations: number[]
  /** The last three significant tokens, oldest first. */
  recent: Token[]
  /** For a token that closed a bracket, the value before its opening. */
  closed: string | undefined
}

export const createDefinitionState = (): DefinitionState => {
  return { brackets: [], annotations: [], recent: [], closed: undefined }
}

export const copyDefinitionState = (state: DefinitionState): DefinitionState => {
  return { ...state, brackets: [...state.brackets], annotations: [...state.annotations], recent: [...state.recent] }
}

/** Ends top-level annotation scans at a logical line break, as `classifyDefinitions` does. */
export const breakDefinitionLine = (state: DefinitionState): void => {
  if (!state.brackets.length) state.annotations = state.annotations.filter(level => level !== 0)
}

/** Advances `state` past one significant token. */
export const advanceDefinitionState = (state: DefinitionState, token: Token): void => {
  const value = token.value
  const p1 = state.recent.at(-1)
  const p2 = state.recent.at(-2)
  const depth = state.brackets.length
  state.annotations = state.annotations.filter(level => level !== depth || !/^([;{},):\]=]|val|var|let|def)$/.test(value))
  // Declared names are functions whatever follows, so only variables and properties start a scan.
  if (value === ':' && (p1?.type === 'variable' || p1?.type === 'property') && !memberAccess.test(p2?.value ?? '')) state.annotations.push(depth)
  state.closed = undefined
  if (token.type === 'punctuation') {
    if (pairs[value]) state.brackets.push({ close: pairs[value]!, before: p1?.value ?? '' })
    else if (value === state.brackets.at(-1)?.close) state.closed = state.brackets.pop()!.before
  }
  state.recent.push(token)
  if (state.recent.length > 3) state.recent.shift()
}

/**
 * Whether Python definitions on each side of this point classify the same as in the whole
 * source: no function literal's parentheses or annotation spans it, and the tokens
 * just before it cannot look ahead past `next` or be looked back to as a declaration, qualifier,
 * or member access. `next` is the first significant token after the point, once it is final.
 */
export const isDefinitionBoundary = (state: DefinitionState, next: Token | undefined): boolean => {
  if (state.annotations.length) return false
  if (state.brackets.some(bracket => bracket.close === ')' && /^(=|:=)$/.test(bracket.before))) return false
  const [p3, p2, p1] = [undefined, undefined, undefined, ...state.recent].slice(-3)
  if (!p1) return true
  if ((p1.type === 'variable' || p1.type === 'property') && (!next || /^(:|=)$/.test(next.value))) return false
  if (/^(=|:=|<)$/.test(p1.value)) return false
  // A name after the point, or one reached by skipping `*` or `&`, would look back at `p1`.
  if (backReference.test(p1.value) && p1.value !== ':' && (!next || nameType.test(next.type) || /^[*&]$/.test(next.value))) return false
  // A declared name followed by `.`, `:`, or `<` is a qualifier instead.
  if (nameType.test(p1.type) && backReference.test(p2?.value ?? '') && (!next || /^(\.|:|<)$/.test(next.value))) return false
  if (p1.value === ':' && p2 && nameType.test(p2.type) && backReference.test(p3?.value ?? '')) return false
  if (/^[)\]}]$/.test(p1.value) && /^(=|:=)$/.test(state.closed ?? '') && !next) return false
  return true
}
