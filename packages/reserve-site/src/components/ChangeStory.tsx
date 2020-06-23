/** @jsx jsx */
import { jsx, css } from '@emotion/core'

export default function ChangeStory() {
  return (
    <div css={rootStyle}>
      <img src="/world-spin.gif" alt="globe" css={imageStyle} />
      <span css={pipeStyle}>|</span>
      <span css={textStyle}>Change the Story</span>
    </div>
  )
}

const pipeStyle = css({ marginLeft: 8, marginRight: 8 })

const rootStyle = {
  display: 'flex',
  marginTop: 16,
}

const textStyle = css({
  fontStyle: 'italic',
  fontSize: 16,
})

const imageStyle = css({
  width: 18,
  height: 18,
})
