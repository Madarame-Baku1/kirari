import type { Token } from '../types.js'

type Result = { function: boolean; pending: boolean }
type Group = { end: number; close: number; complete: boolean }

export const createFunctionLookup = (source: string, typed: boolean, scan: (start: number) => Generator<Token, void, number | undefined>) => {
  // Reuse nested groups, including unfinished ones, instead of rescanning each signature suffix.
  const groups = new Map<number, Group>()
  return (start: number, annotation: boolean, generic: boolean, property: boolean, asyncModifier: boolean): Result => {
    let reader = scan(start)
    let token: Token | undefined
    let limit = source.length
    let pending = false
    const result = (value: boolean): Result => ({ function: value, pending: pending || limit === source.length && (!token || token.end === limit && /^[=/]$/.test(token.value)) })
    const is = (value: string): boolean => token?.value === value
    const next = (): void => {
      do {
        const value = reader.next()
        token = value.done || value.value.start >= limit ? undefined : value.value
      } while (token?.type === 'text' || token?.type === 'comment')
    }
    const jump = (position: number): void => { reader = scan(position); next() }
    const group = (): Group => {
      const opening = token!
      const cached = groups.get(opening.start)
      if (cached) { jump(cached.end); return cached }
      const angles = opening.value === '<'
      const stack: { token: Token; close: string }[] = []
      const closers: Record<string, string> = { '(': ')', '[': ']', '{': '}', '${': '}', '<': '>' }
      while (token) {
        const value = token.value
        if (token.type === 'punctuation' && closers[value] || angles && value === '<') {
          stack.push({ token, close: closers[value]! })
        } else if (token.type === 'punctuation' && /^[)\]}]$/.test(value) || angles && token.type === 'operator' && /^>/.test(value)) {
          const count = value[0] === '>' ? /^>+/.exec(value)![0].length : 1
          for (let index = 0; index < count; index++) {
            const frame = stack.pop()
            if (!frame || frame.close !== value[index]) {
              const failed = { end: token.start, close: token.start, complete: false }
              groups.set(opening.start, failed)
              return failed
            }
            const closed = { end: token.start + index + 1, close: token.start + index, complete: true }
            groups.set(frame.token.start, closed)
            if (!stack.length) { jump(closed.end); return closed }
          }
        }
        next()
      }
      const incomplete = { end: limit, close: limit, complete: false }
      for (const frame of stack) groups.set(frame.token.start, incomplete)
      return incomplete
    }
    const until = (value: string): boolean => {
      while (token && token.value !== value) {
        if (/^[([{<]$/.test(token.value)) {
          if (!group().complete) return false
        } else if (/^[;\]}]$/.test(token.value) || is('=') && value !== '=') return false
        else next()
      }
      return token?.value === value
    }
    const continuation = (): boolean => !token || /^[;,\]}]$/.test(token.value)
    const body = (): boolean => {
      let operand = true
      while (token) {
        if (is('{') && !operand) return true
        if (/^[([{<]$/.test(token.value)) {
          if (!group().complete) return false
          operand = false
        } else {
          if (/^[;=\]}]$/.test(token.value)) return false
          operand = /^(\||&|\?|:|=>)$/.test(token.value)
          next()
        }
      }
      return false
    }

    next()
    if (typed && generic && token && /^[?!]$/.test(token.value)) next()
    if (is('(')) {
      if (!asyncModifier) return result(true)
      if (!group().complete) return result(false)
      return result(!is('=>') && !(typed && is(':')))
    }
    if (typed && is('<') && (generic || token!.start === start)) {
      if (!group().complete) return result(false)
      return result(is('('))
    }
    if (!is('=') && !is(':')) return result(false)
    const colon = is(':')
    if (colon && !annotation && !property) return result(false)
    next()
    if (typed && (annotation || property) && colon && token && !/^(\(|<|async|function)$/.test(token.value)) {
      if (!until('=')) return result(false)
      next()
    }

    while (token) {
      if (is('async')) {
        next()
        if (is('=>')) return result(true)
      }
      if (is('function')) {
        next()
        if (is('*')) next()
        if (token && /^(variable|keyword|function)$/.test(token.type)) next()
        if (typed && is('<') && !group().complete) return result(true)
        if (!is('(') || !group().complete) return result(true)
        if (typed && is(':')) { next(); if (!body()) return result(true) }
        if (!is('{') || !group().complete) return result(true)
        return result(continuation())
      }
      if (typed && is('<') && !group().complete) return result(false)
      if (is('(')) {
        const opening = token
        const closed = group()
        if (!closed.complete) return result(false)
        if (is('=>')) return result(true)
        if (typed && is(':')) { next(); return result(until('=>')) }
        if (!continuation()) return result(false)
        pending ||= !token && limit === source.length
        limit = closed.close
        jump(opening.end)
        continue
      }
      if (token && /^(variable|keyword|function)$/.test(token.type)) {
        next()
        return result(is('=>'))
      }
      return result(false)
    }
    return result(false)
  }
}
