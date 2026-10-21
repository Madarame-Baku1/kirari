'use client'

import styles from './CompareTable.module.css'
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent } from 'react'
import { focusableWhenScrollable } from '@/client/scrollable'
import type * as Types from './CompareTable.types'

const initial: Types.State = {
	row: {
		start: 0,
		size: 0,
	},
	column: {
		start: 0,
		size: 0,
	},
	rowVisible: false,
	columnVisible: false,
	snap: true,
}

const bandStyle = (band: Types.Band) =>
	({
		'--start': `${band.start}px`,
		'--band-scale': band.size,
	}) as CSSProperties

/**
 * Scrolls a wide table sideways with fading edges where more columns hide, and highlights the
 * hovered row and column with two bands that glide between cells.
 */
export const CompareTable = (props: Types.Props) => {
	const { label, children } = props
	const scroller = useRef<HTMLElement>(null)
	const [state, setState] = useState(initial)
	const [overflow, setOverflow] = useState<Types.Overflow>({
		start: false,
		end: false,
	})
	useEffect(() => {
		const element = scroller.current
		if (!element) return
		const update = () => {
			const max = element.scrollWidth - element.clientWidth
			setOverflow({
				start: element.scrollLeft > 1,
				end: element.scrollLeft < max - 1,
			})
		}
		const resize = new ResizeObserver(update)
		resize.observe(element)
		element.addEventListener('scroll', update, {
			passive: true,
		})
		update()
		const release = focusableWhenScrollable(element)
		return () => {
			resize.disconnect()
			element.removeEventListener('scroll', update)
			release?.()
		}
	}, [])
	const clear = () =>
		setState(current => ({
			...current,
			rowVisible: false,
			columnVisible: false,
		}))
	const track = (event: PointerEvent<HTMLDivElement>) => {
		if (event.pointerType !== 'mouse') return
		const cell = (event.target as Element).closest('td, th')
		const table = cell?.closest('table')
		const row = cell?.parentElement
		if (!(cell instanceof HTMLTableCellElement) || !table || !row) return
		const header = row.parentElement?.tagName === 'THEAD'
		const labelCell = cell.cellIndex === 0
		if (header && labelCell) return clear()
		setState(current => ({
			row: header
				? current.row
				: {
						start: table.offsetTop + row.offsetTop,
						size: row.offsetHeight,
					},
			column: labelCell
				? current.column
				: {
						start: table.offsetLeft + cell.offsetLeft,
						size: cell.offsetWidth,
					},
			rowVisible: !header,
			columnVisible: !labelCell,
			snap: !current.rowVisible && !current.columnVisible,
		}))
	}

	return (
		<div
			className={styles.frame}
			data-overflow-start={overflow.start || undefined}
			data-overflow-end={overflow.end || undefined}
		>
			<section ref={scroller} className={styles.scroller} aria-label={label}>
				<div className={styles.root} onPointerOver={track} onPointerLeave={clear}>
					{children}
					<div
						className={styles.row}
						aria-hidden="true"
						data-visible={state.rowVisible || undefined}
						data-snap={state.snap || undefined}
						style={bandStyle(state.row)}
					/>
					<div
						className={styles.column}
						aria-hidden="true"
						data-visible={state.columnVisible || undefined}
						data-snap={state.snap || undefined}
						style={bandStyle(state.column)}
					/>
				</div>
			</section>
		</div>
	)
}
