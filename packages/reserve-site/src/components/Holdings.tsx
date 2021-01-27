/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import Amount from 'src/components/Amount'
import Heading from 'src/components/Heading'
import { BreakPoints } from 'src/components/styles'
import { HoldingsData } from 'src/service/Data'

export default function Holdings(props: Omit<HoldingsData, 'updatedDate'>) {
  return (
    <div css={rootStyle}>
      <Heading title="CELO" gridArea="celo" iconSrc="/assets/CELO.png" />
      <Amount label="Frozen" units={props.frozen} gridArea="total" />
      <Amount label="Unfrozen" units={props.unfrozen} gridArea="onChain" />
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

interface RatioProps {
  total: number
  unfrozen: number
}

export function Ratios(props: RatioProps) {
  return (
    <div css={ratiosSectionStyle}>
      <Amount label="Total" units={props.total} gridArea="ratio" />
      <Amount label="Unfrozen" units={props.unfrozen} gridArea="unfrozen" />

      <div css={infoStyle}>
        <div css={finePrintStyle}>
          <small>
            Ratios of the value of the reserve in USD (for total and for unfrozen) to the value of
            all outstanding cUSD (as well as other future stabilized tokens supported by the
            reserve)
          </small>
        </div>
      </div>
    </div>
  )
}

const ratiosSectionStyle = css({
  display: 'grid',
  gridAutoColumns: '1fr',
  gridColumnGap: 20,
  gridRowGap: 12,
  gridTemplateAreas: `
                     "ratio unfrozen ."
                     "info info ."
                     `,
  [BreakPoints.tablet]: {
    gridTemplateAreas: `
    "unfrozen"
    "ratio"
    "info"
    `,
  },
})

const rootStyle = css({
  display: 'grid',
  gridColumnGap: 20,
  gridRowGap: 12,
  gridTemplateAreas: `"celo celo celo"
                     "total onChain custody"
                     "crypto crypto crypto"
                     "btc eth dai"
                    `,
  [BreakPoints.tablet]: {
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
  [BreakPoints.tablet]: {
    gridTemplateAreas: `"cUSD"
                        "outstanding"`,
  },
})

const finePrintStyle = css({
  paddingBottom: 24,
})

const infoStyle = css({
  gridArea: 'info',
})
