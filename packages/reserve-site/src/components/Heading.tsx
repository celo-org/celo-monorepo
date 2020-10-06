/** @jsx jsx */
import { css, jsx } from '@emotion/core'

interface HeadingProps {
  title: string
  gridArea: string
  iconSrc?: string
  marginTop?: number
}
export default function Heading({ title, gridArea, iconSrc, marginTop }: HeadingProps) {
  return (
    <div css={css(headingStyle, { gridArea, marginTop })}>
      <h4 css={headingTextStyle}>
        {iconSrc && <img src={iconSrc} css={iconStyle} alt={`${title} token icon`} />}
        {title}
      </h4>
    </div>
  )
}
const headingTextStyle = css({
  display: 'inline-flex',
  alignItems: 'center',
  marginBottom: 16,
})
const headingStyle = css({
  borderBottom: 1,
  borderBottomColor: 'rgba(46, 51, 56, 0.3)',
  borderBottomStyle: 'solid',
})
const iconStyle = css({ height: 29, width: 29, marginRight: 8 })
