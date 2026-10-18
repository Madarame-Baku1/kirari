import type { Language } from '../types.js'
import { c } from './c.js'

export const cpp: Language = {
  ...c,
  name: 'cpp',
  keywords: [...c.keywords!, ...'alignas alignof and and_eq asm bitand bitor catch class compl concept consteval constinit const_cast co_await co_return co_yield decltype delete dynamic_cast explicit export friend mutable namespace new noexcept not not_eq operator or or_eq private protected public reinterpret_cast requires static_cast template this thread_local throw try typeid typename using virtual xor xor_eq'.split(' ')],
  types: [...c.types!, 'char8_t', 'char16_t', 'char32_t', 'wchar_t'],
  rules: [
    { type: 'string', pattern: /(?:u8|[uUL])?R"([^ ()\\\t\r\n]{0,16})\([\s\S]*?(?:\)\1"|$)/ },
    ...c.rules,
  ],
}
