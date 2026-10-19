import styles from './CopyGlyph.module.css'
import { Icon } from '../Icon'
import type * as Types from './CopyGlyph.types'

export const CopyGlyph = (props: Types.Props) => {
	const { size = 15, hash = false } = props

	return (
		<span className={`${styles.root} copy-glyph`} aria-hidden="true">
			{hash ? <span className="hash">#</span> : <Icon name="copy" size={size} />}
			<svg
				aria-hidden="true"
				className={styles.copyCheck}
				width={size}
				height={size}
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<path d="m5 12.5 4.5 4.5L19 7" pathLength="1" />
			</svg>
		</span>
	)
}
