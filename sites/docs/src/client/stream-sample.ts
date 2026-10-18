/** Typed into the streaming demo by the client; rendered in full for no-JS and reduced motion. */
export const streamSample = `// Highlight a reply while it is still arriving
const stream = createTokenStream(typescript)
const tokens: Token[] = []

for await (const chunk of response) {
  const patch = stream.write(chunk)
  const stale = tokens.findIndex(token => token.start >= patch.from)
  if (stale >= 0) tokens.length = stale
  tokens.push(...patch.tokens)
  view.innerHTML = render(tokens)
}`
