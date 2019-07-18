import * as React from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { BACKER_ID } from 'src/about/Backers'
import { ah, coinbase, gc, lakestar, polychain, svAngel } from 'src/home/logos/logos'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Button, { BTN } from 'src/shared/Button.3'
import menuItems from 'src/shared/menu-items'
import Responsive from 'src/shared/Responsive'
import { standardStyles } from 'src/styles'

const homeBackers = [
  { image: ah, height: 36 },
  { image: polychain, height: 26 },
  { image: gc, height: 33 },
  { image: coinbase, height: 37 },
  { image: lakestar, height: 47 },
  { image: svAngel, height: 55 },
]

const HomeBackers = ({ t }: I18nProps) => {
  return (
    <GridRow
      mobileStyle={standardStyles.sectionMarginTopMobile}
      tabletStyle={standardStyles.sectionMarginTopTablet}
      desktopStyle={standardStyles.sectionMarginTop}
    >
      <Cell span={Spans.full} style={standardStyles.centered}>
        <Responsive medium={[styles.logoContainerTablet]} large={[styles.logoContainerDesktop]}>
          <View style={styles.logoContainer}>
            {homeBackers.map((backer) => (
              <Image
                resizeMode={'contain'}
                style={[styles.backerLogo, { height: backer.height }]}
                key={backer.image}
                source={{ uri: backer.image }}
              />
            ))}
          </View>
        </Responsive>
        <View style={[styles.linkContainer, standardStyles.elementalMarginTop]}>
          <Button
            kind={BTN.NAKED}
            href={`${menuItems.ABOUT_US.link}#${BACKER_ID}`}
            text={t('hero.backers')}
          />
        </View>
      </Cell>
    </GridRow>
  )
}

const styles = StyleSheet.create({
  logoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  logoContainerTablet: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    alignItems: 'center',
    flex: 1,
  },
  logoContainerDesktop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  backerLogo: {
    height: 50,
    width: 135,
    margin: 20,
  },
  link: {
    cursor: 'pointer',
    textDecorationLine: 'underline',
  },
  linkContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default withNamespaces('home')(HomeBackers)
