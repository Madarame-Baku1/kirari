import styles from './CodeBlock.module.css'
import classNames from 'classnames'
import { HighlightedCode } from '../HighlightedCode'
import { CopyIconButton } from '../CopyIconButton'
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
		elevated = false,
		className,
	} = props

	return (
		<div className={classNames(styles.root, elevated && styles.elevated, className)}>
			<div className={styles.codeMeta}>
				<span>{label}</span>
				<CopyIconButton
					className={styles.copyButton}
					text={text}
					label={copyLabel}
					size="sm"
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
