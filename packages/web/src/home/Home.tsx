import getConfig from 'next/config'
import Head from 'next/head'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import celoHero from 'src/home/celo-hero.png'
import HomeBackers from 'src/home/HomeBackers'
import HomeBenefits from 'src/home/HomeBenefits'
import ImagePanes from 'src/home/ImagePanes'
import Involvement from 'src/home/Involvement'
import { TwoAssets } from 'src/home/TwoAssets'
import HomeCover from 'src/home/version3/HomeCover'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import Press from 'src/press/Press'
import FlowerArea from './FlowerArea'

interface State {
  mobile: boolean
}

const DESCRIPTION =
  'Celo is an open platform that makes financial tools accessible to anyone with a mobile phone'

export class Home extends React.Component<I18nProps, State> {
  static getInitialProps() {
    return { namespacesRequired: [NameSpaces.home, NameSpaces.common] }
  }

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
        <ImagePanes />
        <HomeBenefits />
        <FlowerArea />
        <TwoAssets />
        <Press />
        <Involvement />
        <HomeBackers />
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

export default withNamespaces(NameSpaces.home)(Home)
