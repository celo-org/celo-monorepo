import { memo } from 'react'
import FadeIn from 'react-lazyload-fadein'
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import Title from 'src/dev/Title'
import { H1, H4 } from 'src/fonts/Fonts'
import { I18nProps, NameSpaces, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenProps, ScreenSizes, withScreenSize } from 'src/layout/ScreenSize'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import { CeloLinks } from 'src/shared/menu-items'
import { standardStyles, textStyles } from 'src/styles'

const playLogo = require('src/download/play-store.png')
const appStoreLogo = require('src/download/app-store.png')

export default withNamespaces(NameSpaces.download)(
  memo(function AppStores({ t }: I18nProps) {
    return (
      <View>
        <Title title={t('availableOnAndroid')} />
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
            <Fade distance={'20px'} bottom={true}>
              <View style={standardStyles.centered}>
                <H1 style={[textStyles.center, standardStyles.elementalMargin]} ariaLevel={'2'}>
                  {t('haveAccount')}
                </H1>
                <H4 style={[textStyles.center, standardStyles.elementalMargin, styles.seedPhrase]}>
                  {t('useSeed')}
                </H4>
                <Button
                  size={SIZE.normal}
                  kind={BTN.NAKED}
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
        <a href={CeloLinks.playStoreWallet}>
          <FadingImage source={playLogo} />
        </a>
      </TouchableOpacity>
      {isMobile || <View style={[standardStyles.verticalLine, styles.verticalLine]} />}
      <FadingImage source={appStoreLogo} />
    </Cell>
  )
})

const styles = StyleSheet.create({
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
  seedPhrase: { maxWidth: 450 },
})
