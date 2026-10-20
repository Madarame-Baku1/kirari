import styles from './NavList.module.css'
import classNames from 'classnames'
import { Link } from '../Link'
import type * as Types from './NavList.types'

const Root = (props: Types.Props) => {
	const { variant = 'sidebar', className, children } = props

	return <div className={classNames(styles.root, styles[variant], className)}>{children}</div>
}

const Group = (props: Types.GroupProps) => {
	const { title, children } = props

	return (
		<div className={styles.group}>
			<p className={styles.groupTitle}>{title}</p>
			{children}
		</div>
	)
}

const Item = (props: Types.ItemProps) => {
	const { href, current = false, onNavigate, children } = props

	return (
		<Link
			className={styles.item}
			href={href}
			aria-current={current ? 'page' : undefined}
			onNavigate={onNavigate}
		>
			{children}
		</Link>
	)
}

export const NavList = Object.assign(Root, {
	Group,
	Item,
})
