---
"@vortexlabs/kirari": patch
---

Fix JSX and TSX highlighting for adjacent element snippets without requiring a fragment wrapper. Component names and attributes retain their token types across siblings, while comparisons after JSX remain JavaScript.
