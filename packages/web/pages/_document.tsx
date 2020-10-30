import Document, { DocumentContext, Head, Main, NextScript } from 'next/document'
import * as React from 'react'
import { AppRegistry, I18nManager } from 'react-native-web'
import { setDimensionsForScreen } from 'src/layout/ScreenSize'
import { getSentry } from 'src/utils/sentry'
import { isLocaleRTL } from '../server/i18nSetup'

interface NextReq {
  locale: string
}

interface Props {
  locale: string
}

interface PropContext {
  req: DocumentContext['req'] & NextReq
}

export default class MyDocument extends Document<Props> {
  static async getInitialProps(context: DocumentContext & PropContext) {
    const locale = context.req.locale
    const userAgent = context.req.headers['user-agent']
    setDimensionsForScreen(userAgent)

    AppRegistry.registerComponent('Main', () => Main)

    // Use RTL layout for appropriate locales. Remember to do this client-side too.
    I18nManager.setPreferredLanguageRTL(isLocaleRTL(locale))

    // Get the html and styles needed to render this page.
    const { getStyleElement } = AppRegistry.getApplication('Main')
    const page = context.renderPage()
    const styles = React.Children.toArray([
      // <style key={'normalize-style'} dangerouslySetInnerHTML={{ __html: normalizeNextElements }} />,
      getStyleElement(),
    ])

    if (context.err) {
      const Sentry = await getSentry()
      Sentry.captureException(context.err)
    }

    return { ...page, locale, styles: React.Children.toArray(styles), pathname: context.pathname }
  }

  render() {
    const { locale } = this.props
    return (
      <html lang={locale} style={{ height: '100%', width: '100%' }}>
        <Head>
          <link rel="stylesheet" href={'/normalize.css'} />

          <link
            rel="stylesheet"
            href="https://indestructibletype.com/fonts/Jost.css"
            type="text/css"
          />
          <link
            href="https://fonts.googleapis.com/css?family=EB+Garamond:400,500,500i,700&display=swap"
            rel="stylesheet"
          />

          <link key="favicon" rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </html>
    )
  }
}
