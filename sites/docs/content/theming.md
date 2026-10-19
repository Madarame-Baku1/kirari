# Custom themes

Style token categories with CSS variables and classes.

Every category gets a class and a CSS variable. No inline colors, no re-highlighting when your theme changes.

```css
.my-code {
  --kirari-background: #f8f7fc;
  --kirari-text: #35313f;
  --kirari-keyword: #7452bd;
  --kirari-string: #247060;
  --kirari-variable: #35435f;
  --kirari-comment: #74717c;
}

.my-code .kirari-keyword { font-weight: 600; }
```

Variables need a theme file imported (`theme.css` or any from [Themes](/docs/themes/)); it maps each variable to its class. Set them on any ancestor. No theme file? Style `.kirari-keyword` and the other classes directly.

## A token for every detail

- `--kirari-text`
- `--kirari-keyword`
- `--kirari-variable`
- `--kirari-property`
- `--kirari-function`
- `--kirari-string`
- `--kirari-number`
- `--kirari-boolean`
- `--kirari-null`
- `--kirari-comment`
- `--kirari-operator`
- `--kirari-punctuation`
- `--kirari-type`
- `--kirari-regex`
- `--kirari-inserted`
- `--kirari-deleted`
- `--kirari-heading`
- `--kirari-tag`
- `--kirari-attribute`
- `--kirari-entity`

Plain text renders without a span unless you assign it a custom class. `--kirari-background` controls the optional wrapper background.
