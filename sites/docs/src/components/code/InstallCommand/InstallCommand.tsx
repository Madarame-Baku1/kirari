import styles from './InstallCommand.module.css'
import { site } from '@/lib/site'
import { CopyIconButton } from '@/components/ui/CopyIconButton'
import type * as Types from './InstallCommand.types'

export const InstallCommand = (props: Types.Props) => {
	const { id, command = site.install } = props

	return (
		<div className={`${styles.root} install`}>
			<span className={styles.installPrompt} aria-hidden="true">
				$
			</span>
			<code id={id}>{command}</code>
			<CopyIconButton text={command} label="Copy install command" />
		</div>
	)
}
