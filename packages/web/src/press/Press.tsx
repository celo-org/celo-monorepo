import * as React from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Button, { BTN } from 'src/shared/Button.3'
import Responsive from 'src/shared/Responsive'
import { standardStyles } from 'src/styles'
const ventureBeat = require('./venture-beat-logo@2x.png')
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
              <Responsive key={logo.source} medium={[styles.logo, styles.largeLogo, logo.size]}>
                <Image
                  resizeMode={'contain'}
                  source={{ uri: logo.source }}
                  style={[styles.logo, logo.size]}
                />
              </Responsive>
            ))}
          </View>
          <View style={[styles.linkContainer, standardStyles.elementalMarginTop]}>
            {/* <Button text={t('recentNews')} kind={BTN.NAKED} href={'https://medium.com/celohq'} /> */}
            <Button
              text={t('recentNews')}
              kind={BTN.NAKED}
              href={
                'https://www.wsj.com/articles/startup-celo-aims-to-make-crypto-accessible-to-mainstream-mobile-users-11554204600'
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
const logos = [
  { source: wsj, size: { height: 50, width: 180 } },
  { source: ventureBeat, size: {} },
  { source: fortune, size: {} },
  { source: coindesk, size: {} },
  { source: techcrunch, size: {} },
]
export default withNamespaces('home')(Press)
