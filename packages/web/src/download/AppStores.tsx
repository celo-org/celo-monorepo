import * as React from 'react'
import FadeIn from 'react-lazyload-fadein'
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native'
import Title from 'src/dev/Title'
import { H1, H4 } from 'src/fonts/Fonts'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import Fade from 'src/shared/AwesomeFade'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import { CeloLinks } from 'src/shared/menu-items'
import { standardStyles, textStyles } from 'src/styles'

const playLogo = require('src/download/play-store.png')
const appStoreLogo = require('src/download/app-store.png')

export default withNamespaces(NameSpaces.download)(
  React.memo(function AppStores({ t }: I18nProps) {
    return (
      <View>
        <Title ariaLevel="2" title={t('downloadDirect')} />
        <GridRow desktopStyle={standardStyles.centered}>
          <Logos />
        </GridRow>
        <GridRow
          desktopStyle={standardStyles.sectionMargin}
          tabletStyle={standardStyles.sectionMarginTablet}
          mobileStyle={standardStyles.sectionMarginMobile}
          allStyle={standardStyles.centered}
        >
          <Cell span={Spans.half}>
            <Fade distance={'20px'}>
              <View style={styles.account}>
                <H1 style={[textStyles.center, standardStyles.elementalMargin]} ariaLevel={'2'}>
                  {t('haveAccount')}
                </H1>
                <H4 style={[textStyles.center, standardStyles.elementalMargin]}>{t('useSeed')}</H4>
                <Button
                  size={SIZE.normal}
                  kind={BTN.NAKED}
                  align={'center'}
                  text={t('learnMore')}
                  href={CeloLinks.gettingStarted}
                />
              </View>
            </Fade>
          </Cell>
        </GridRow>
      </View>
    )
  })
)

function FadingImage({ source }) {
  return (
    <FadeIn>
      {(load) => (
        <Image resizeMode="contain" style={styles.appStoreLogo} onLoad={load} source={source} />
      )}
    </FadeIn>
  )
}

const Logos = withScreenSize(({ screen }: ScreenProps) => {
  const isMobile = screen === ScreenSizes.MOBILE
  return (
    <Cell span={Spans.full} style={[!isMobile && standardStyles.row, styles.stores]}>
      <TouchableOpacity>
        <a href={CeloLinks.playStoreDevWallet}>
          <FadingImage source={playLogo} />
        </a>
      </TouchableOpacity>
      {isMobile || <View style={[standardStyles.verticalLine, styles.verticalLine]} />}
      <TouchableOpacity>
        <a href={CeloLinks.appStoreDevWallet}>
          <FadingImage source={appStoreLogo} />
        </a>
      </TouchableOpacity>
    </Cell>
  )
})

const styles = StyleSheet.create({
  account: {
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
  },
  stores: {
    justifyContent: 'space-evenly',
    alignItems: 'center',
    alignContent: 'center',
  },
  verticalLine: {
    height: 200,
  },
  appStoreLogo: {
    width: 212,
    height: 103,
  },
})
