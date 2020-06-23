/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { HoldingsData } from 'src/service/Data'
import Button from './Button'

export default function Holdings(props: Omit<HoldingsData, 'updatedDate'>) {
  return (
    <div css={rootStyle}>
      <Heading title="CELO Native Asset" gridArea="celo" iconSrc="/assets/CELO.png" />
      <Amount label="Total" units={props.total} gridArea="total" />
      <Amount label="Celo on-chain" units={props.onChain} gridArea="onChain" />
      <Amount label="Celo in Custody" units={props.inCustody} gridArea="custody" />
      <Heading title="Additional Crypto Assets" gridArea="crypto" marginTop={30} />
      <Amount label="BTC" units={props.BTC} gridArea="btc" />
      <Amount label="ETH" units={props.ETH} gridArea="eth" />
      <Amount label="DAI" units={props.DAI} gridArea="dai" />
      <Heading title="cUSD Asset" gridArea="cUSD" iconSrc="/assets/CUSD.png" marginTop={30} />
      <Amount label="cUSD outstanding" units={props.cUSD} gridArea="outstanding" />
      <Amount label="Reserve Ratio*" units={props.ratio} gridArea="ratio" />
      <div css={infoStyle}>
        <div css={finePrintStyle}>
          <small>
            *ratio between the size of the reserve and the total value of all outstanding cUSD (and
            other future stabilized tokens supported by the reserve)
          </small>
        </div>
        <Button href="https://docs.celo.org/command-line-interface/reserve">
          Query Reserve Holdings
        </Button>
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

function Amount({ label, units, gridArea }) {
  const display = new Intl.NumberFormat('default').format(units)

  return (
    <div css={css(amountStyle, { gridArea })}>
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
                     "cUSD cUSD cUSD"
                     "outstanding ratio ."
                     "info info ."
                     `,
  [BREAK_POINT]: {
    gridTemplateAreas: `"celo"
                        "onChain" 
                        "custody"
                        "total"
                        "crypto"
                        "btc"
                        "eth" 
                        "dai"
                        "cUSD"
                        "outstanding" 
                        "ratio"
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
  marginTop: 36,
})
