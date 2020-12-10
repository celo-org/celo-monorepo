import * as React from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { ah, coinbase, gc, lakestar, polychain, svAngel } from 'src/home/logos/logos'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import menuItems, { hashNav } from 'src/shared/menu-items'
import Responsive from 'src/shared/Responsive'
import { standardStyles } from 'src/styles'

const homeBackers = [
  { image: ah, height: 36, id: 'ah' },
  { image: polychain, height: 26, id: 'pc' },
  { image: gc, height: 33, id: 'gc' },
  { image: coinbase, height: 37, id: 'cb' },
  { image: lakestar, height: 47, id: 'ls' },
  { image: svAngel, height: 55, id: 'sv' },
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
                key={backer.id}
                source={{ uri: backer.image }}
              />
            ))}
          </View>
        </Responsive>
        <View style={[styles.linkContainer, standardStyles.elementalMarginTop]}>
          <Button
            kind={BTN.NAKED}
            size={SIZE.normal}
            href={`${menuItems.ABOUT_US.link}#${hashNav.about.backers}`}
            text={t('backers')}
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
