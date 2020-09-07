/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import ChangeStory from './ChangeStory'
import { fineStyle } from './styles'

export default function Footer({ year }) {
  return (
    <footer css={rootStyle}>
      <div css={contentStyle}>
        <div css={wordMark}>Celo Reserve</div>
        <div css={fineStyle}>
          <strong>Disclaimer</strong> Nothing herein constitutes an offer to sell, or the
          solicitation of an offer to buy, any securities or tokens.
        </div>
        <div css={copyRightStyle}>© {year} AP Reserve Foundation</div>
      </div>
      <div>
        <a css={navStyle} href="/legal/terms">
          Terms
        </a>
        <a css={navStyle} href="/legal/privacy">
          Privacy
        </a>
        <ChangeStory />
      </div>
    </footer>
  )
}

const copyRightStyle = css(fineStyle, {
  marginTop: 15,
})

const rootStyle = css({
  boxSizing: 'border-box',
  display: 'flex',
  maxWidth: 1280,
  width: '100%',
  paddingLeft: 16,
  paddingRight: 16,
  paddingBottom: 24,
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  flexWrap: 'wrap',
})

const wordMark = css({
  fontSize: 20,
  paddingBottom: 12,
})

const contentStyle = css({
  maxWidth: 380,
})

const navStyle = css({
  padding: 10,
  marginLeft: 10,
})
