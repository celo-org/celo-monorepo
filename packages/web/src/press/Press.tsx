import * as React from 'react'
import { Image, ImageRequireSource, StyleSheet, View } from 'react-native'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import Responsive from 'src/shared/Responsive'
import { standardStyles } from 'src/styles'
const forbes = require('./forbes-logo.png')
const fortune = require('./fortune@2x.png')
const coindesk = require('./coindesk-logo@2x.png')
const techcrunch = require('./techcrunch-logo@2x.png')
const wsj = require('./wsj-logo@2x.png')

class Press extends React.PureComponent<I18nProps> {
  render() {
    const { t } = this.props
    return (
      <GridRow
        mobileStyle={standardStyles.sectionMarginBottomMobile}
        tabletStyle={standardStyles.sectionMarginBottomTablet}
        desktopStyle={standardStyles.sectionMarginBottom}
      >
        <Cell span={Spans.full} style={standardStyles.centered}>
          <View style={styles.logoContainer}>
            {logos.map((logo) => (
              <a key={logo.source} href={logo.url} target={'_blank'} rel="noopener">
                <Responsive key={logo.source} medium={[styles.logo, styles.largeLogo, logo.size]}>
                  <Image
                    resizeMode={'contain'}
                    source={logo.source}
                    style={[styles.logo, logo.size]}
                  />
                </Responsive>
              </a>
            ))}
          </View>
          <View style={[styles.linkContainer, standardStyles.elementalMarginTop]}>
            <Button
              text={t('recentNews')}
              kind={BTN.NAKED}
              size={SIZE.normal}
              href={
                'https://www.coindesk.com/libra-minus-facebook-why-celo-is-2020s-buzzy-token-project'
              }
            />
          </View>
        </Cell>
      </GridRow>
    )
  }
}

const styles = StyleSheet.create({
  logo: {
    height: 25,
    width: 130,
    marginVertical: 20,
    marginHorizontal: '5vw',
    cursor: 'pointer',
  },
  largeLogo: {
    marginHorizontal: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkContainer: {
    alignItems: 'center',
  },
})

interface Logo {
  source: ImageRequireSource
  size: { height?: number; width?: number }
  url: string
}

const logos: Logo[] = [
  {
    source: forbes,
    size: {},
    url:
      'https://www.forbes.com/sites/stevenehrlich/2019/07/17/as-facebook-struggles-for-blockchain-support-a-truly-decentralized-challenger-emerges/#72fb490119eb',
  },
  {
    source: wsj,
    size: { height: 50, width: 180 },
    url:
      'https://www.wsj.com/articles/startup-celo-aims-to-make-crypto-accessible-to-mainstream-mobile-users-11554204600',
  },
  {
    source: fortune,
    size: {},
    url:
      'https://fortune.com/2018/06/22/phone-android-blockchain-godaddy-celo-twitter-linkedin-venmo/',
  },
  {
    source: coindesk,
    size: {},
    url: 'https://www.coindesk.com/libra-minus-facebook-why-celo-is-2020s-buzzy-token-project',
  },
  {
    source: techcrunch,
    size: {},
    url:
      'https://techcrunch.com/2018/09/05/googles-launchpad-studio-accelerator-welcomes-a-cohort-of-blockchain-and-finance-startups/',
  },
]
export default withNamespaces('home')(Press)
