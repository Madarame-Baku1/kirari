'use client'

import styles from './SegmentedControl.module.css'
import { createContext, useContext } from 'react'
import classNames from 'classnames'
import type * as Types from './SegmentedControl.types'

const SegmentedControlContext = createContext<Types.Context | null>(null)

const useSegmentedControl = () => {
	const context = useContext(SegmentedControlContext)
	if (!context) throw new Error('SegmentedControl.Item must be rendered inside SegmentedControl')
	return context
}

const Root = <Value extends string>(props: Types.Props<Value>) => {
	const { label, value, onChange, className, children } = props

	return (
		<SegmentedControlContext
			value={{
				value,
				onChange: onChange as Types.Context['onChange'],
			}}
		>
			<fieldset className={classNames(styles.root, className)} aria-label={label}>
				{children}
			</fieldset>
		</SegmentedControlContext>
	)
}

const Item = (props: Types.ItemProps) => {
	const { value, children } = props
	const context = useSegmentedControl()

	return (
		<button
			type="button"
			className={styles.item}
			aria-pressed={context.value === value}
			onClick={() => context.onChange(value)}
		>
			{children}
		</button>
	)
}

export const SegmentedControl = Object.assign(Root, {
	Item,
})
