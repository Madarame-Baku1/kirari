import styles from './ThemeCard.module.css'
import { highlight } from '@vortexlabs/kirari'
import { typescript } from '@vortexlabs/kirari/languages/typescript'
import { HighlightedCode } from '../HighlightedCode'
import type * as Types from './ThemeCard.types'

const sample = `// a little light
const name = 'kirari'
shine(name, 42)`

export const ThemeCard = (props: Types.Props) => {
	const { theme } = props

	return (
		<figure className={`${styles.root} theme-card`} data-palette={theme.id}>
			<pre className="kirari">
				<HighlightedCode
					html={highlight(sample, {
						language: typescript,
					})}
				/>
			</pre>
			<figcaption>{theme.label}</figcaption>
		</figure>
	)
}
