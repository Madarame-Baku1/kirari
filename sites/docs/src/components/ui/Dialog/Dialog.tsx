'use client'

import styles from './Dialog.module.css'
import { createContext, useContext, useEffect, useRef } from 'react'
import classNames from 'classnames'
import { Icon } from '@/components/ui/Icon'
import { IconButton } from '@/components/ui/IconButton'
import type * as Types from './Dialog.types'

const DialogContext = createContext<Types.Context | null>(null)

const useDialog = () => {
	const context = useContext(DialogContext)
	if (!context) throw new Error('Dialog parts must be rendered inside Dialog')
	return context
}

const Root = (props: Types.Props) => {
	const { open, onClose, className, children, ...dialogProps } = props
	const dialog = useRef<HTMLDialogElement>(null)
	useEffect(() => {
		if (open) dialog.current?.showModal()
		else dialog.current?.close()
	}, [
		open,
	])

	return (
		<DialogContext
			value={{
				onClose,
			}}
		>
			<dialog
				{...dialogProps}
				ref={dialog}
				className={classNames(styles.root, className)}
				onCancel={onClose}
				onClose={onClose}
				onPointerDown={event => {
					const bounds = event.currentTarget.getBoundingClientRect()
					if (
						event.target === event.currentTarget &&
						(event.clientX < bounds.left ||
							event.clientX > bounds.right ||
							event.clientY < bounds.top ||
							event.clientY > bounds.bottom)
					)
						onClose()
				}}
			>
				{children}
			</dialog>
		</DialogContext>
	)
}

const Close = (props: Types.CloseProps) => {
	const { label = 'Close', id, children = <Icon name="close" /> } = props
	const { onClose } = useDialog()

	return (
		<IconButton id={id} label={label} onClick={onClose}>
			{children}
		</IconButton>
	)
}

export const Dialog = Object.assign(Root, {
	Close,
})
