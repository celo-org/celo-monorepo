import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import AppLogo from 'src/download/AppLogo'
import PhoneIllo from 'src/download/PhoneIllo'
// import { RequestType } from 'src/fauceting/FaucetInterfaces'
// import RequestFunds from 'src/fauceting/RequestFunds'
import { H1, H4 } from 'src/fonts/Fonts'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import Android from 'src/icons/Android'
import Apple from 'src/icons/Apple'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import { CeloLinks } from 'src/shared/menu-items'
import { colors, standardStyles, textStyles } from 'src/styles'

export default withScreenSize(
  withNamespaces(NameSpaces.download)(function DownloadCover({
    t,
    screen,
  }: I18nProps & ScreenProps) {
    const isMobile = screen === ScreenSizes.MOBILE
    return (
      <View style={styles.zIndex}>
        <GridRow
          allStyle={standardStyles.centered}
          desktopStyle={standardStyles.sectionMargin}
          tabletStyle={standardStyles.sectionMarginTablet}
          mobileStyle={standardStyles.blockMarginMobile}
        >
          <Cell
            span={Spans.three4th}
            tabletSpan={Spans.full}
            style={[
              styles.container,
              screen === ScreenSizes.TABLET && { justifyContent: 'center' },
              !isMobile ? standardStyles.row : styles.mobileContainer,
            ]}
          >
            <View style={[styles.flex1, styles.content, isMobile && standardStyles.centered]}>
              <AppLogo />
              <H1 style={[textStyles.invert, isMobile ? styles.titleMobile : styles.title]}>
                {t('coverTitle')}
              </H1>
              <H4 style={[textStyles.invert, isMobile && textStyles.center]}>
                {t('coverSubTitle')}
              </H4>
              <Button
                style={styles.button}
                iconLeft={<Android size={18} color={colors.primary} />}
                kind={BTN.NAKED}
                size={SIZE.big}
                text={'Android'}
                href={CeloLinks.playStoreDevWallet}
              />
              <Button
                style={styles.button}
                iconLeft={<Apple size={18} color={colors.primary} />}
                kind={BTN.NAKED}
                size={SIZE.big}
                text={'iOS'}
                href={CeloLinks.appStoreDevWallet}
              />
            </View>
            <View style={[standardStyles.centered, styles.flex1, phoneStyle(screen)]}>
              <PhoneIllo />
            </View>
          </Cell>
        </GridRow>
      </View>
    )
  })
)

function phoneStyle(screen: ScreenSizes) {
  switch (screen) {
    case ScreenSizes.MOBILE:
      return styles.mobilePhone
    case ScreenSizes.TABLET:
      return styles.tabletPhone
    default:
      return styles.phone
  }
}

const styles = StyleSheet.create({
  button: {
    marginTop: 30,
  },
  container: {
    justifyContent: 'space-between',
  },
  mobileContainer: {
    flexDirection: 'column-reverse',
    alignItems: 'center',
  },
  title: {
    marginTop: 20,
  },
  titleMobile: { marginTop: 20, textAlign: 'center' },
  flex1: {
    flex: 1,
  },
  content: {
    justifyContent: 'center',
    marginHorizontal: 20,
    maxWidth: 350,
  },
  phone: {
    height: '50vh',
    maxWidth: 275,
  },
  tabletPhone: {
    height: '35vh',
    maxWidth: 240,
  },
  mobilePhone: {
    height: '33vh',
    maxHeight: 300,
    marginBottom: 20,
    maxWidth: '60vw',
  },
  zIndex: {
    zIndex: 20,
  },
})
