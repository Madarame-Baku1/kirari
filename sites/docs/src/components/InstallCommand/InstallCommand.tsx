import styles from './InstallCommand.module.css'
import { site } from '../../site'
import { CopyButton } from '../CopyButton'
import type * as Types from './InstallCommand.types'

export const InstallCommand = (props: Types.Props) => {
	const { id, command = site.install } = props

	return (
		<div className={`${styles.root} install`}>
			<span className={styles.installPrompt} aria-hidden="true">
				$
			</span>
			<code id={id}>{command}</code>
			<CopyButton text={command} target={id} label="Copy install command" />
		</div>
	)
}
