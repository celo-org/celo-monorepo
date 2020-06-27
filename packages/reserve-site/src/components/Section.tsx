/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import * as React from 'react'
import Markdown from 'src/components/Markdown'

interface Props {
  title: string
  content?: string
  children?: React.ReactNode
  subHeading?: React.ReactNode
}

export default function Section({ title, content, children, subHeading }: Props) {
  return (
    <section css={rootStyle}>
      <div css={headingAreaStyle}>
        <h2 css={titleCSS}>{title}</h2>
        {subHeading}
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
  marginBottom: 60,
})

const headingAreaStyle = css({
  paddingRight: 20,
  marginTop: 5,
  minWidth: 220,
})

const contentAreaStyle = css({
  flex: 1,
  minWidth: 320,
  '@media (max-width: 320px)': {
    minWidth: '100%',
  },
})

const titleCSS = css({
  '@media (max-width: 590px)': {
    fontSize: 28,
    lineHeight: 1.5,
  },
})
