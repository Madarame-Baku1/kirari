import { Link } from '../Link'
import type * as Types from './ButtonBase.types'

const isAnchor = (props: Types.Props): props is Types.AnchorProps => props.href !== undefined

/** Renders a link when given `href`, otherwise a native button. Styling is left to callers. */
export const ButtonBase = (props: Types.Props) => {
	if (isAnchor(props)) return <Link {...props} />
	const { type = 'button', ...buttonProps } = props
	return <button type={type} {...buttonProps} />
}
