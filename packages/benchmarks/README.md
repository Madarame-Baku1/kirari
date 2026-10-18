# Kirari benchmarks

Private workspace that measures Kirari's speed and bundle size. Not published.

```sh
bun run benchmark --quick        # Check the harness
bun run benchmark                # Full highlighting benchmark
bun run benchmark:stream --quick # Check the streaming harness
bun run benchmark:stream         # Full streaming benchmark
```

Reports go to `results/` (ignored by Git). Each run replaces the previous report.
Close heavy processes and repeat runs before drawing conclusions.

## Highlighting

- **Inputs:** the 30 corpus fixtures (JavaScript, TypeScript, TSX, Python, JSON,
  shell), plus each fixture repeated to 1 KiB, 16 KiB, and 256 KiB.
- **Timing:** warm `tokenize` + `render` in Bun. Seven batches of ~20 ms each;
  reports the median, min, and max mean time per call.
- **Validation:** every output must decode back to its source. Failures are
  reported and exit nonzero. Validation runs outside timing.
- **Bundles:** minified browser ESM with JavaScript only and with all six
  languages, gzip level 9, CSS excluded.

`latest.json` records the runtime, OS, CPU, raw samples, and SHA-256 hashes of the
build and corpus. Not measured: Node or browser timing, startup, memory.

## Streaming

Compares re-rendering the full prefix on every update with `createTokenStream`
rendering only replacement tokens.

- **Inputs:** JavaScript and JSON at 1K, 4K, and 16K UTF-16 units, plus two 4K
  worst cases (one long line, an unfinished comment).
- **Schedules:** chunks of 16, 64, or 256 units; render every chunk, every four
  chunks, or once at the end.
- **Validation:** every patch must match a full tokenize, token for token.
- **Reported:** time per replay and work amplification (units scanned ÷ final
  length).

Long lines and unfinished multiline tails can still cause quadratic total work.

Token-level accuracy is tested in
[`../kirari/test/corpus`](../kirari/test/corpus/fixtures.ts); known limits are in
[syntax coverage](../../docs/accuracy.md).
