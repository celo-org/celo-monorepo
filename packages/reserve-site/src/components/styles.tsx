import { css } from '@emotion/core'

export const flexCol = css({
  display: 'flex',
  flexDirection: 'column',
})

export const fineStyle = css({
  fontSize: 16,
  lineHeight: 1.25,
})

export enum BreakPoints {
  smallPhone = '@media (max-width: 320px)',
  mediumPhone = '@media (max-width: 420px)',
  phablet = '@media (max-width: 500px)',
  smallTablet = '@media (max-width: 590px)',
  tablet = '@media (max-width: 890px)',
}
