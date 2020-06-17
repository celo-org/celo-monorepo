/** @jsx jsx */
import MarkdownJSX from 'markdown-to-jsx'
import * as React from 'react'
import Button from './Button'
import { css, jsx } from '@emotion/core'

export interface Attributes {
  title: string
  description?: string
}

function Paragraph({ children }) {
  return <p css={paragrahStyle}>{children}</p>
}

function H3({ children }) {
  return <h3 css={contentStyle}>{children}</h3>
}

function H4({ children }) {
  return <h4 css={contentStyle}>{children}</h4>
}

const OPTIONS = {
  overrides: {
    a: Button,
    p: Paragraph,
    h3: H3,
    h4: H4,
  },
}

export default function Markdown({ source }) {
  return <MarkdownJSX children={source} options={OPTIONS} />
}

const contentStyle = css({ maxWidth: 480 })

const paragrahStyle = css(contentStyle, { marginBottom: 24 })
