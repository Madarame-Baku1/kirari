import styles from './CodeBlock.module.css'
import { HighlightedCode } from '../HighlightedCode'
import { CopyButton } from '../CopyButton'
import type * as Types from './CodeBlock.types'

export const CodeBlock = (props: Types.Props) => {
	const {
		id,
		label,
		text,
		children,
		html,
		preClassName = 'kirari',
		codeClassName,
		copyLabel = `Copy ${label} example`,
	} = props

	return (
		<div className={`${styles.root} code-block`}>
			<div className={`code-meta ${styles.codeMeta}`}>
				<span>{label}</span>
				<CopyButton
					className={`icon-button ${styles.iconButton}`}
					target={id}
					text={text}
					label={copyLabel}
				/>
			</div>
			<pre className={preClassName}>
				{html === undefined ? (
					<code id={id} className={codeClassName}>
						{children}
					</code>
				) : (
					<HighlightedCode id={id} className={codeClassName} html={html} />
				)}
			</pre>
		</div>
	)
}
