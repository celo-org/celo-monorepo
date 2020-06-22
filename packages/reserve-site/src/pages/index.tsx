/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import Footer from 'src/components/Footer'
import Head from 'src/components/Head'
import Holdings from 'src/components/Holdings'
import NavBar from 'src/components/Navbar'
import ReserveAddresses from 'src/components/ReserveAddresses'
import Section from 'src/components/Section'
import { flexCol } from 'src/components/styles'
import TargetGraph from 'src/components/TargetGraph'
import { Addresses, HoldingsData } from 'src/service/Data'

interface Props {
  INTRO: any
  INITIAL_TARGET: any
  ABOUT: any
  ATTESTATIONS: any
}

export default function Home(props: HoldingsData & Addresses & Props) {
  return (
    <>
      <Head />
      <div css={rootStyle}>
        <div css={containerStyle}>
          <NavBar />
          <main css={mainStyle}>
            <Section title={props.INTRO.attributes.title} content={props.INTRO.body} />
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
            <Section
              title={props.INITIAL_TARGET.attributes.title}
              content={props.INITIAL_TARGET.body}
            >
              <TargetGraph />
            </Section>

            <Section title={props.ABOUT.attributes.title} content={props.ABOUT.body} />
            <Section
              title={props.ATTESTATIONS.attributes.title}
              content={props.ATTESTATIONS.body}
            />
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

const dateStyle = css({ marginBottom: 36, display: 'block' })

const containerStyle = css(flexCol, { flex: 1, width: '100%', alignItems: 'center' })

export async function getStaticProps() {
  const about = await import('src/content/home/about.md').then((mod) => mod.default)
  const attestations = await import('src/content/home/attestations.md').then((mod) => mod.default)
  const initialTarget = await import('src/content/home/initial-target.md').then(
    (mod) => mod.default
  )
  const intro = await import('src/content/home/intro.md').then((mod) => mod.default)
  const matter = await import('front-matter').then((mod) => mod.default)

  const INTRO = matter<{ title: string }>(intro)
  const INITIAL_TARGET = matter<{ title: string }>(initialTarget)
  const ABOUT = matter<{ title: string }>(about)
  const ATTESTATIONS = matter<{ title: string }>(attestations)

  const fetchData = await import('src/service/holdings').then((mod) => mod.default)
  const fetchAddresses = await import('src/service/addresses').then((mod) => mod.default)

  const [addresses, holdings] = await Promise.all([fetchAddresses(), fetchData()])
  return {
    props: { ...addresses, ...holdings, INTRO, INITIAL_TARGET, ABOUT, ATTESTATIONS },
    // we will attempt to re-generate the page:
    // - when a request comes in
    // - at most once every X seconds
    unstable_revalidate: 60,
  }
}
