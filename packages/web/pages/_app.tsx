import App from 'next/app'
import getConfig from 'next/config'
import * as React from 'react'
import { View } from 'react-native'
import config from 'react-reveal/globals'
import scrollIntoView from 'scroll-into-view'
import analytics, { canTrack, initializeAnalytics } from 'src/analytics/analytics'
import Header from 'src/header/Header.3'
import { ScreenSizeProvider } from 'src/layout/ScreenSize'
import Footer from 'src/shared/Footer'
import Progress from 'src/shared/Progress'
import { HEADER_HEIGHT } from 'src/shared/Styles'
import { getSentry, initSentry } from 'src/utils/sentry'
import { appWithTranslation } from '../src/i18n'

config({ ssrReveal: true })

class MyApp extends App {
  async componentDidMount() {
    if (window.location.hash) {
      hashScroller(window.location.hash)
    }

    window.addEventListener('hashchange', () => hashScroller(window.location.hash))

    if (getConfig().publicRuntimeConfig.FLAGS.ENV === 'development') {
      checkH1Count()
    }
    await initializeAnalytics()
    if (await canTrack()) {
      await initSentry()
    }
    this.props.router.events.on('routeChangeComplete', async () => {
      await analytics.page()
    })
  }

  // there are a few pages we dont want the header on
  // currently this is just the animation demo pages and BrandKit
  skipHeader() {
    return this.props.router.asPath.startsWith('/animation') || this.isBrand()
  }

  isBrand = () => {
    return this.props.router.asPath.startsWith('/experience')
  }

  componentDidCatch = async (error: Error, info: object) => {
    const Sentry = await getSentry()
    Sentry.withScope((scope) => {
      scope.setExtras(info)
      Sentry.captureException(error)
    })
  }

  render() {
    const { Component, pageProps } = this.props
    return (
      <ScreenSizeProvider>
        <Progress />
        {this.skipHeader() || <Header />}
        <Component {...pageProps} />
        {this.skipHeader() || (
          <View>
            <Footer />
          </View>
        )}
      </ScreenSizeProvider>
    )
  }
}

export default appWithTranslation(MyApp)

function checkH1Count() {
  setTimeout(() => {
    if (document.getElementsByTagName('h1').length > 1) {
      console.warn(
        'To many h1 tags on page. This decreases search rank, please limit to 1 per page',
        Array.from(document.getElementsByTagName('h1')).map((el) => el.innerText)
      )
    }
  }, 500)
}

function hashScroller(id: string) {
  const element = document.getElementById(id.replace('#', ''))

  scrollIntoView(element, { time: 100, align: { top: 0, topOffset: HEADER_HEIGHT + 100 } })
}
