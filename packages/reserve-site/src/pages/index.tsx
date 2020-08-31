/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { FrontMatterResult } from 'front-matter'
import Footer from 'src/components/Footer'
import Head from 'src/components/Head'
import Holdings, { Ratios, StableTokens } from 'src/components/Holdings'
import NavBar from 'src/components/Navbar'
import ReserveAddresses from 'src/components/ReserveAddresses'
import Section from 'src/components/Section'
import { flexCol } from 'src/components/styles'
import TargetGraph from 'src/components/TargetGraph'
import { Updated } from 'src/components/Updated'
import { Addresses, HoldingsData } from 'src/service/Data'

interface ContentShape {
  title: string
}

interface Props {
  INTRO: FrontMatterResult<ContentShape>
  INITIAL_TARGET: FrontMatterResult<ContentShape>
  ABOUT: FrontMatterResult<ContentShape>
  ATTESTATIONS: FrontMatterResult<ContentShape>
  year: string
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
                unFrozenRatio={props.unFrozenRatio}
                frozen={props.frozen}
                inCustody={props.inCustody}
                unfrozen={props.unfrozen}
                cUSD={props.cUSD}
                DAI={props.DAI}
                BTC={props.BTC}
                ETH={props.ETH}
                ratio={props.ratio}
              />
            </Section>
            <Section title="Stable Value Assets">
              <StableTokens cUSD={props.cUSD} />
            </Section>
            <Section title="Reserve Ratio">
              <Ratios total={props.ratio} unfrozen={props.unFrozenRatio} />
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
        <Footer year={props.year} />
      </div>
    </>
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
  try {
    const about = await import('src/content/home/about.md').then((mod) => mod.default)
    const attestations = await import('src/content/home/attestations.md').then((mod) => mod.default)
    const initialTarget = await import('src/content/home/initial-target.md').then(
      (mod) => mod.default
    )
    const intro = await import('src/content/home/intro.md').then((mod) => mod.default)
    const matter = await import('front-matter').then((mod) => mod.default)

    const INTRO = matter<ContentShape>(intro)
    const INITIAL_TARGET = matter<ContentShape>(initialTarget)
    const ABOUT = matter<ContentShape>(about)
    const ATTESTATIONS = matter<ContentShape>(attestations)

    const fetchData = await import('src/service/holdings').then((mod) => mod.default)
    const fetchAddresses = await import('src/service/addresses').then((mod) => mod.default)

    const [addresses, holdings] = await Promise.all([fetchAddresses(), fetchData()])
    return {
      props: {
        ...addresses,
        ...holdings,
        INTRO,
        INITIAL_TARGET,
        ABOUT,
        ATTESTATIONS,
        year: new Date().getFullYear(),
      },
      // we will attempt to re-generate the page:
      // - when a request comes in
      // - at most once every X seconds
      revalidate: 60,
    }
  } catch {
    return {
      revalidate: 1,
    }
  }
}
