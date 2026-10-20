import styles from './MarkdownContent.module.css'
import { Children, Fragment, isValidElement } from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import rehypeReact from 'rehype-react'
import { markdownProcessor } from '../../content'
import { AnchorCopy } from '../AnchorCopy'
import { CodeBlock } from '../CodeBlock'
import { InstallCommand } from '../InstallCommand'
import { LanguageTable } from '../LanguageTable'
import { Link } from '../Link'
import type * as Types from './MarkdownContent.types'

const text = (node: Types.Node): string =>
	node.type === 'text' ? node.value : 'children' in node ? node.children.map(text).join('') : ''
const elements = (node: Types.Element) =>
	node.children.filter((child): child is Types.Element => child.type === 'element')
const reactElements = (children: Types.ReactNode) =>
	Children.toArray(children).filter(
		isValidElement<{
			children?: Types.ReactNode
		}>,
	)

export const MarkdownContent = async (props: Types.Props) => {
	const { id, title, source } = props
	const tree = (await markdownProcessor.run(markdownProcessor.parse(source))) as Types.Root
	const firstParagraph = tree.children.find(
		node => node.type === 'element' && node.tagName === 'p',
	)
	const firstCode = tree.children.find(node => node.type === 'element' && node.tagName === 'pre')
	const firstList = tree.children.find(node => node.type === 'element' && node.tagName === 'ul')
	const compiler = markdownProcessor().use(rehypeReact, {
		Fragment,
		jsx,
		jsxs,
		passNode: true,
		components: {
			a: (props: Types.ElementProps<'a'>) => {
				const { node: _node, href = '', children, ...rest } = props
				return (
					<Link {...rest} href={href} variant="subtle">
						{children}
					</Link>
				)
			},
			h1: (props: Types.ElementProps<'h1'>) => {
				const { children } = props
				return (
					<h1>
						{children}
						<AnchorCopy id={id} title={title} />
					</h1>
				)
			},
			h2: (props: Types.ElementProps<'h2'>) => {
				const { node, children } = props
				return (
					<h2
						id={
							id === 'overview' && node && text(node) === 'Installation'
								? 'installation'
								: undefined
						}
					>
						{children}
					</h2>
				)
			},
			p: (props: Types.ElementProps<'p'>) => {
				const { node, children } = props
				return (
					<p
						className={
							id === 'overview' && node === firstParagraph ? 'lede' : undefined
						}
					>
						{children}
					</p>
				)
			},
			pre: (props: Types.ElementProps<'pre'>) => {
				const { node, children, className } = props
				if (id === 'overview' && node === firstCode)
					return <InstallCommand id="docs-install" />
				const code = reactElements(children)[0]
				const codeNode = node && elements(node)[0]
				return (
					<CodeBlock
						className={styles.codeBlock}
						id={`${id}-code-${node?.position?.start.line ?? 0}`}
						label="Example"
						text={codeNode ? text(codeNode) : ''}
						preClassName={className}
						codeClassName={codeNode?.properties.className
							?.toString()
							.replaceAll(',', ' ')}
						copyLabel="Copy code example"
					>
						{code?.props.children}
					</CodeBlock>
				)
			},
			ul: (props: Types.ElementProps<'ul'>) => {
				const { node, children } = props
				if (id !== 'overview' || !node || node !== firstList) return <ul>{children}</ul>
				return (
					<div className="intro-cards">
						{elements(node).map(item => {
							const link = elements(item)[0]!
							return (
								<Link
									key={String(link.properties.href)}
									href={String(link.properties.href)}
								>
									<strong>{text(link)}</strong>
									<span>
										{text(item).slice(text(link).length).replace(/^:\s*/, '')}
									</span>
								</Link>
							)
						})}
					</div>
				)
			},
			table: (props: Types.ElementProps<'table'>) => {
				const { node, children } = props
				if (id !== 'languages' || !node)
					return (
						<div className="table-scroll">
							<table>{children}</table>
						</div>
					)
				const [head, body] = reactElements(children)
				const rows = elements(node).find(child => child.tagName === 'tbody')
				return (
					<LanguageTable
						head={head}
						rows={reactElements(body?.props.children).map((row, index) => ({
							text: rows ? text(elements(rows)[index]!) : String(index),
							children: row.props.children,
						}))}
					/>
				)
			},
		},
	})
	return compiler.stringify(tree)
}
