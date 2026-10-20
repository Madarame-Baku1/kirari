'use client'

import styles from './ClipboardProvider.module.css'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type * as Types from './ClipboardProvider.types'

const ClipboardContext = createContext<Types.Copy | null>(null)

export const ClipboardProvider = (props: Types.Props) => {
	const { children } = props
	const [message, setMessage] = useState('')
	const [failed, setFailed] = useState(false)
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
	const fallback = useRef<HTMLTextAreaElement>(null)
	useEffect(() => () => clearTimeout(timer.current), [])

	const copy = useCallback<Types.Copy>(async (text, success = 'Copied to clipboard') => {
		let copied = false
		try {
			if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text)
			else {
				const previous = document.activeElement as HTMLElement | null
				const field = fallback.current!
				field.value = text
				field.select()
				const result = document.execCommand('copy')
				previous?.focus({
					preventScroll: true,
				})
				if (!result) throw new Error('Clipboard unavailable')
			}
			copied = true
		} catch {
			/* Keep failure feedback available to keyboard and screen-reader users. */
		}
		clearTimeout(timer.current)
		setFailed(!copied)
		setMessage(copied ? success : 'Couldn’t copy. Select the text and copy it manually.')
		timer.current = setTimeout(() => setMessage(''), 2400)
		return copied
	}, [])

	return (
		<ClipboardContext value={copy}>
			{children}
			<textarea
				ref={fallback}
				className="sr-only"
				tabIndex={-1}
				aria-hidden="true"
				readOnly
			/>
			<div
				className={failed ? styles.root : 'sr-only'}
				id="toast"
				role="status"
				aria-live="polite"
				hidden={!message}
			>
				{message}
			</div>
		</ClipboardContext>
	)
}

export const useClipboard = () => {
	const copy = useContext(ClipboardContext)
	if (!copy) throw new Error('Clipboard controls require ClipboardProvider')
	return copy
}

/** Copies `text` and reports a short-lived `copied` flag for confirmation UI. */
export const useCopy = (options: Types.CopyOptions) => {
	const { text, message, onCopied } = options
	const copyText = useClipboard()
	const [copied, setCopied] = useState(false)
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
	useEffect(() => () => clearTimeout(timer.current), [])

	const copy = async () => {
		if (!(await copyText(typeof text === 'function' ? text() : text, message))) return
		clearTimeout(timer.current)
		setCopied(true)
		timer.current = setTimeout(() => setCopied(false), 1600)
		onCopied?.()
	}

	return {
		copied,
		copy,
	}
}
