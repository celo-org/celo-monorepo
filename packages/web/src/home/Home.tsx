import getConfig from 'next/config'
import Head from 'next/head'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import celoHero from 'src/home/celo-hero.png'
import HomeBackers from 'src/home/HomeBackers'
import HomeCarousel from 'src/home/HomeCarousel'
import HomeSystems from 'src/home/HomeSystems'
import HomeCover from 'src/home/version3/HomeCover'
import HomeEmail from 'src/home/version3/HomeEmail'
import HomeHero from 'src/home/version3/HomeHero'
import HomeWork from 'src/home/version3/HomeWork'
import { I18nProps, withNamespaces } from 'src/i18n'
import Press from 'src/press/Press'

interface State {
  mobile: boolean
}

const DESCRIPTION =
  'Celo is building a monetary system that creates the conditions for prosperity for all. Our stablecoin uses phone numbers as identity and is built on a secure and proven platform.'

export class Home extends React.Component<I18nProps, State> {
  state: State

  render() {
    const { t } = this.props
    const { publicRuntimeConfig } = getConfig()
    const BASE_URL = publicRuntimeConfig.BASE_URL
    const metaImage = BASE_URL + celoHero

    return (
      <View style={styles.container}>
        <Head>
          <title>{t('pageTitle')}</title>
          <meta name="description" content={DESCRIPTION} />

          <meta property="og:url" content={BASE_URL} />
          <meta property="og:title" content={t('pageTitle')} />
          <meta property="og:type" content="website" />
          <meta property="og:image" content={metaImage} />
          <meta property="og:description" content={DESCRIPTION} />

          <meta name="twitter:title" content={t('pageTitle')} />
          <meta name="twitter:description" content={DESCRIPTION} />
          <meta name="twitter:image" content={metaImage} />
          <meta name="twitter:card" content="summary_large_image" />
        </Head>
        <HomeCover />
        <HomeHero />
        <Press />
        <HomeSystems />
        <HomeWork />
        <HomeCarousel />
        <HomeBackers />
        <HomeEmail />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    position: 'relative',
    flexDirection: 'column',
    overflow: 'hidden',
    maxWidth: '100vw',
  },
})

export default withNamespaces('home')(Home)
