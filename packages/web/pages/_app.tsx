import App, { Container } from 'next/app'
import * as React from 'react'
import { View } from 'react-native'
import config from 'react-reveal/globals'
import Header from 'src/header/Header.3'
import { ScreenSizeProvider } from 'src/layout/ScreenSize'
import Footer from 'src/shared/Footer.3'
import { scrollTo } from 'src/utils/utils'
import { appWithTranslation } from '../src/i18n'

config({ ssrReveal: true })
class MyApp extends App {
  componentDidMount() {
    if (window.location.hash) {
      setTimeout(() => {
        scrollTo(window.location.hash.slice(1), 'start')
      }, 200)
    }
    setTimeout(() => {
      if (document.getElementsByTagName('h1').length > 1) {
        console.warn(
          'To many h1 tags on page. This decreases search rank, please limit to 1 per page',
          Array.from(document.getElementsByTagName('h1')).map((el) => el.innerText)
        )
      }
    }, 500)
  }

  // there are a few pages we dont want the header on for artist reasons
  // currently this is just the animation demo pages
  skipHeader() {
    return this.props.router.asPath.startsWith('/animation')
  }

  render() {
    const { Component, pageProps } = this.props
    return (
      <Container>
        <ScreenSizeProvider>
          {this.skipHeader() || <Header />}
          <Component {...pageProps} />
          {this.skipHeader() || (
            <View>
              <Footer />
            </View>
          )}
        </ScreenSizeProvider>
      </Container>
    )
  }
}

export default appWithTranslation(MyApp)
