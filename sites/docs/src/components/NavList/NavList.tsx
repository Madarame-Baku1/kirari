import styles from './NavList.module.css'
import classNames from 'classnames'
import { Link } from '../Link'
import type * as Types from './NavList.types'

const Root = (props: Types.Props) => {
	const { variant = 'sidebar', className, children } = props

	return <ul className={classNames(styles.root, styles[variant], className)}>{children}</ul>
}

const Group = (props: Types.GroupProps) => {
	const { title, children } = props

	return (
		<li className={styles.group}>
			<p className={styles.groupTitle}>{title}</p>
			<ul className={styles.groupList}>{children}</ul>
		</li>
	)
}

const Item = (props: Types.ItemProps) => {
	const { href, current = false, onNavigate, children } = props

	return (
		<li>
			<Link
				className={styles.item}
				href={href}
				aria-current={current ? 'page' : undefined}
				onNavigate={onNavigate}
			>
				{children}
			</Link>
		</li>
	)
}

export const NavList = Object.assign(Root, {
	Group,
	Item,
})
