import styles from './Link.module.css'
import NextLink from 'next/link'
import classNames from 'classnames'
import { Icon } from '@/components/ui/Icon'
import type * as Types from './Link.types'

const externalProps = {
	target: '_blank',
	rel: 'noopener noreferrer',
}

export const Link = (props: Types.Props) => {
	const {
		variant = 'plain',
		external = false,
		arrow = false,
		className,
		children,
		...linkProps
	} = props

	return (
		<NextLink
			{...(external && externalProps)}
			{...linkProps}
			// `plain` has no styles; avoid rendering an empty class attribute.
			className={
				classNames(styles[variant], arrow && styles.withArrow, className) || undefined
			}
		>
			{children}
			{arrow && (
				<span className={styles.arrow}>
					<Icon name="arrow" size={15} />
				</span>
			)}
			{external && <span className="sr-only">(opens in a new tab)</span>}
		</NextLink>
	)
}
