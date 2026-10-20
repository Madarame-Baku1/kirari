'use client'

import { createContext, type KeyboardEvent, useContext, useId } from 'react'
import type * as Types from './Tabs.types'

const TabsContext = createContext<Types.Context | null>(null)

const useTabs = () => {
	const context = useContext(TabsContext)
	if (!context) throw new Error('Tabs parts must be rendered inside Tabs')
	return context
}

const tabId = (id: string, value: string) => `${id}-tab-${value}`
const panelId = (id: string, value: string) => `${id}-panel-${value}`

const Root = <Value extends string>(props: Types.Props<Value>) => {
	const { value, onChange, children } = props
	const id = useId()

	return (
		<TabsContext
			value={{
				id,
				value,
				onChange: onChange as Types.Context['onChange'],
			}}
		>
			{children}
		</TabsContext>
	)
}

const List = (props: Types.ListProps) => {
	const { label, className, children } = props
	const { onChange } = useTabs()

	/* Automatic activation: arrow keys move focus and select, per the ARIA tabs pattern. */
	const moveFocus = (event: KeyboardEvent<HTMLDivElement>) => {
		const tabs = [
			...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
		]
		const current = tabs.indexOf(event.target as HTMLButtonElement)
		const last = tabs.length - 1
		const next = {
			ArrowRight: current === last ? 0 : current + 1,
			ArrowLeft: current === 0 ? last : current - 1,
			Home: 0,
			End: last,
		}[event.key]
		if (current < 0 || next === undefined) return
		event.preventDefault()
		tabs[next]?.focus()
		onChange(tabs[next]!.dataset.value!)
	}

	return (
		<div className={className} role="tablist" aria-label={label} onKeyDown={moveFocus}>
			{children}
		</div>
	)
}

const Tab = (props: Types.TabProps) => {
	const { value, className, children } = props
	const context = useTabs()
	const selected = context.value === value

	return (
		<button
			type="button"
			role="tab"
			id={tabId(context.id, value)}
			className={className}
			aria-controls={panelId(context.id, value)}
			aria-selected={selected}
			tabIndex={selected ? 0 : -1}
			data-value={value}
			onClick={() => context.onChange(value)}
		>
			{children}
		</button>
	)
}

const Panel = (props: Types.PanelProps) => {
	const { value, as: Element = 'div', children, ...panelProps } = props
	const context = useTabs()

	return (
		<Element
			{...panelProps}
			id={panelId(context.id, value)}
			role="tabpanel"
			aria-labelledby={tabId(context.id, value)}
			hidden={context.value !== value}
		>
			{children}
		</Element>
	)
}

export const Tabs = Object.assign(Root, {
	List,
	Tab,
	Panel,
})
