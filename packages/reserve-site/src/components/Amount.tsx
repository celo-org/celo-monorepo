/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { BreakPoints } from 'src/components/styles'

interface AmountProps {
  label: string
  units: number
  gridArea: string
  context?: string
}
export default function Amount({ label, units, gridArea, context }: AmountProps) {
  const display = new Intl.NumberFormat('default').format(units)

  return (
    <div title={context} css={css(amountStyle, { gridArea })}>
      <p>{label}</p>
      <span css={numberStyle}>{display}</span>
    </div>
  )
}

const numberStyle = css({
  fontSize: 36,
  [BreakPoints.tablet]: {
    fontSize: 28,
    marginBottom: 8,
  },
})

const amountStyle = css({
  [BreakPoints.tablet]: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
})
