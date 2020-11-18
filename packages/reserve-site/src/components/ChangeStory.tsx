/** @jsx jsx */
import { css, jsx } from '@emotion/core'

export default function ChangeStory() {
  return (
    <div css={rootStyle}>
      <img src="/assets/world-spin.gif" alt="globe" css={imageStyle} />
      <span css={pipeStyle}>|</span>
      <span css={textStyle}>Change the Story</span>
    </div>
  )
}

const pipeStyle = css({ marginLeft: 8, marginRight: 8 })

const rootStyle = css({
  display: 'flex',
  marginTop: 16,
})

const textStyle = css({
  fontStyle: 'italic',
  fontSize: 16,
})

const imageStyle = css({
  width: 18,
  height: 18,
})
