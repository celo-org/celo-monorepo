/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import Footer from 'components/Footer'
import Head from 'components/Head'
import Holdings from 'components/Holdings'
import NavBar from 'components/Navbar'
import ReserveAddresses from 'components/ReserveAddresses'
import Section from 'components/Section'
import { flexCol } from 'components/styles'
import TargetGraph from 'components/TargetGraph'
import about from 'content/home/about.md'
import attestations from 'content/home/attestations.md'
import initialTarget from 'content/home/initial-target.md'
import intro from 'content/home/intro.md'
import matter from 'front-matter'
import fetchAddresses from 'service/addresses'
import { Addresses, HoldingsData } from 'service/Data'
import fetchData from 'service/holdings'

const INTRO = matter<{ title: string }>(intro)
const INITIAL_TARGET = matter<{ title: string }>(initialTarget)
const ABOUT = matter<{ title: string }>(about)
const ATTESTATIONS = matter<{ title: string }>(attestations)

export default function Home(props: HoldingsData & Addresses) {
  return (
    <>
      <Head />
      <div css={rootStyle}>
        <div css={containerStyle}>
          <NavBar />
          <main css={mainStyle}>
            <Section title={INTRO.attributes.title} content={INTRO.body} />
            <Section
              title={'Current Reserve Holdings'}
              subHeading={<Updated date={props.updatedDate} />}
            >
              <Holdings
                total={props.total}
                inCustody={props.inCustody}
                onChain={props.onChain}
                cUSD={props.cUSD}
                DAI={props.DAI}
                BTC={props.BTC}
                ETH={props.ETH}
                ratio={props.ratio}
              />
            </Section>
            <Section title={'Reserve Addresses'}>
              <ReserveAddresses
                dai={props.daiAddress}
                btc={props.btcAddress}
                eth={props.ethAddress}
                celo={props.celoAddress}
                custody={props.custodyAddress}
              />
            </Section>
            <Section title={INITIAL_TARGET.attributes.title} content={INITIAL_TARGET.body}>
              <TargetGraph />
            </Section>

            <Section title={ABOUT.attributes.title} content={ABOUT.body} />
            <Section title={ATTESTATIONS.attributes.title} content={ATTESTATIONS.body} />
          </main>
        </div>
        <Footer />
      </div>
    </>
  )
}

function Updated({ date }) {
  return (
    <small css={dateStyle}>
      <strong>Updated </strong>
      {new Date(date).toLocaleDateString('default', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}
    </small>
  )
}

const rootStyle = css({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  flex: 1,
  alignItems: 'center',
  justifyContent: ' space-between',
})

const mainStyle = css({
  width: '100%',
  maxWidth: 960,
})

const containerStyle = css(flexCol, { flex: 1, width: '100%', alignItems: 'center' })

export async function getStaticProps() {
  const [addresses, holdings] = await Promise.all([fetchAddresses(), fetchData()])
  return {
    props: { ...addresses, ...holdings },
    // we will attempt to re-generate the page:
    // - when a request comes in
    // - at most once every X seconds
    unstable_revalidate: 60,
  }
}

const dateStyle = css({ marginBottom: 36, display: 'block' })
