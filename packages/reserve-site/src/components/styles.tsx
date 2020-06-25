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
  smallPhone = '@media (max-width: 320)',
  mediumPhone = '@media (max-width: 420)',
  phablet = '@media (max-width: 500)',
  smallTablet = '@media (max-width: 590)',
  tablet = '@media (max-width: 777)',
}
