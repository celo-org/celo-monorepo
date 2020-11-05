/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import MarkdownJSX from 'markdown-to-jsx'
import Button from './Button'

export interface Attributes {
  title: string
  description?: string
}

function Paragraph({ children }) {
  return <p css={paragraphStyle}>{children}</p>
}

function H3({ children }) {
  return <h3 css={contentStyle}>{children}</h3>
}

function H4({ children }) {
  return <h4 css={contentStyle}>{children}</h4>
}

const OPTIONS = {
  overrides: {
    p: Paragraph,
    h3: H3,
    h4: H4,
    button: Button,
  },
}

export default function Markdown({ source }) {
  return <MarkdownJSX children={source} options={OPTIONS} />
}

const contentStyle = css({ maxWidth: 480 })

const paragraphStyle = css(contentStyle, { marginBottom: 24 })
