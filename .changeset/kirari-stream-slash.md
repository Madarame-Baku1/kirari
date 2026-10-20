---
"@vortexlabs/kirari": patch
---

Fix streamed JavaScript and TypeScript names whose function check reads past a slash on the last line. The answer was final even though more input could turn the slash into a regex literal and change it; it now stays revisable until that line ends.
