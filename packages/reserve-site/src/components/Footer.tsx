/** @jsx jsx */
import { jsx, css } from '@emotion/core'
import ChangeStory from './ChangeStory'
import { fineStyle } from './styles'

export default function Footer() {
  return (
    <footer css={rootStyle}>
      <div css={contentStyle}>
        <div css={wordMark}>Celo Reserve</div>
        <div css={fineStyle}>
          <strong>Disclaimer</strong> Nothing herein constitutes an offer to sell, or the
          solicitation of an offer to buy, any securities or tokens.
        </div>
      </div>
      <ChangeStory />
    </footer>
  )
}

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
