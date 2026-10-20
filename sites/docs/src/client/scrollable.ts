/**
 * Makes a scroll container a tab stop only while its content overflows, so keyboard users
 * can scroll long code without an extra, purposeless stop when everything already fits.
 * Returns a cleanup, so it works as a React ref callback or inside an effect.
 */
export const focusableWhenScrollable = (element: HTMLElement | null) => {
	if (!element) return
	const update = () => {
		const overflows =
			element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight
		if (overflows) element.tabIndex = 0
		else element.removeAttribute('tabindex')
	}
	// Size changes cover resizes and hidden panels being shown; mutations cover new content.
	const resize = new ResizeObserver(update)
	const mutation = new MutationObserver(update)
	resize.observe(element)
	mutation.observe(element, {
		childList: true,
		characterData: true,
		subtree: true,
	})
	update()
	return () => {
		resize.disconnect()
		mutation.disconnect()
	}
}
