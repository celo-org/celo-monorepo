/** @jsx jsx */
import * as React from 'react'
import { jsx, css } from '@emotion/core'
import Markdown from 'components/Markdown'

interface Props {
  title: string
  content?: string
  children?: React.ReactNode
}

export default function Section({ title, content, children }: Props) {
  return (
    <section css={rootStyle}>
      <div css={headingAreaStyle}>
        <h2 css={titleCSS}>{title}</h2>
      </div>
      <div css={contentAreaStyle}>
        {content && <Markdown source={content} />}
        {children}
      </div>
    </section>
  )
}

const rootStyle = css({
  display: 'flex',
  flexWrap: 'wrap',
  flex: 1,
  paddingLeft: 16,
  paddingRight: 16,
  marginBottom: 20,
})

const headingAreaStyle = css({
  paddingRight: 20,
  marginTop: 5,
  minWidth: 220,
})

const contentAreaStyle = css({ flex: 1, minWidth: 320 })

const titleCSS = css({
  '@media (max-width: 590px)': {
    fontSize: 28,
    lineHeight: 1.5,
  },
})
