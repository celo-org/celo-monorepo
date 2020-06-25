/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { HoldingsData } from 'src/service/Data'

export default function Holdings(props: Omit<HoldingsData, 'updatedDate'>) {
  return (
    <div css={rootStyle}>
      <Heading title="CELO" gridArea="celo" iconSrc="/assets/CELO.png" />
      <Amount label="Total" units={props.total} gridArea="total" />
      <Amount label="In Reserve Contract" units={props.onChain} gridArea="onChain" />
      <Amount label="In Custody" units={props.inCustody} gridArea="custody" />
      <Heading title="Additional Crypto Assets" gridArea="crypto" marginTop={30} />
      <Amount label="BTC" units={props.BTC} gridArea="btc" />
      <Amount label="ETH" units={props.ETH} gridArea="eth" />
      <Amount label="DAI" units={props.DAI} gridArea="dai" />
    </div>
  )
}

export function StableTokens(props) {
  return (
    <div css={stableTokenStyle}>
      <Heading title="cUSD" gridArea="cUSD" iconSrc="/assets/CUSD.png" />
      <Amount label="Outstanding" units={props.cUSD} gridArea="outstanding" />
    </div>
  )
}

export function Info(props) {
  return (
    <div css={infoThingsStyle}>
      <div css={css({ gridArea: 'ratio' })}>
        <span css={numberStyle}>{props.ratio}</span>
      </div>
      <div css={infoStyle}>
        <div css={finePrintStyle}>
          <small>
            ratio between the size of the reserve and the total value of all outstanding cUSD (and
            other future stabilized tokens supported by the reserve)
          </small>
        </div>
      </div>
    </div>
  )
}

const BREAK_POINT = '@media (max-width: 777px)'

const amountStyle = css({
  [BREAK_POINT]: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
})

interface AmountProps {
  label: string
  units: number
  gridArea: string
  context?: string
}

function Amount({ label, units, gridArea, context }: AmountProps) {
  const display = new Intl.NumberFormat('default').format(units)

  return (
    <div title={context} css={css(amountStyle, { gridArea })}>
      <p>{label}</p>
      <span css={numberStyle}>{display}</span>
    </div>
  )
}

interface HeadingProps {
  title: string
  gridArea: string
  iconSrc?: string
  marginTop?: number
}

function Heading({ title, gridArea, iconSrc, marginTop }: HeadingProps) {
  return (
    <div css={css(headingStyle, { gridArea, marginTop })}>
      <h4 css={headingTextStyle}>
        {iconSrc && <img src={iconSrc} css={iconStyle} alt={`${title} token icon`} />}
        {title}
      </h4>
    </div>
  )
}

const iconStyle = css({ height: 29, width: 29, marginRight: 8 })

const rootStyle = css({
  display: 'grid',
  gridColumnGap: 20,
  gridRowGap: 12,
  gridTemplateAreas: `"celo celo celo"
                     "total onChain custody"
                     "crypto crypto crypto"
                     "btc eth dai"
                    `,
  [BREAK_POINT]: {
    gridTemplateAreas: `"celo"
                        "onChain" 
                        "custody"
                        "total"
                        "crypto"
                        "btc"
                        "eth" 
                        "dai"`,
  },
})

const stableTokenStyle = css(rootStyle, {
  gridTemplateAreas: `"cUSD cUSD cUSD"
                     "outstanding . ."`,
  [BREAK_POINT]: {
    gridTemplateAreas: `"cUSD"
                        "outstanding"`,
  },
})

const infoThingsStyle = css({
  display: 'grid',
  gridAutoColumns: '1fr',
  gridColumnGap: 20,
  gridRowGap: 12,
  gridTemplateAreas: `
                     "ratio . ."
                     "info info ."
                     `,
  [BREAK_POINT]: {
    gridTemplateAreas: `"ratio"
                        "info"`,
  },
})

const headingStyle = css({
  borderBottom: 1,
  borderBottomColor: 'rgba(46, 51, 56, 0.3)',
  borderBottomStyle: 'solid',
})

const headingTextStyle = css({
  display: 'inline-flex',
  alignItems: 'center',
  marginBottom: 16,
})

const numberStyle = css({
  fontSize: 36,
  [BREAK_POINT]: {
    fontSize: 28,
    marginBottom: 8,
  },
})

const finePrintStyle = css({
  paddingBottom: 24,
})

const infoStyle = css({
  gridArea: 'info',
})
