import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { H4 } from 'src/fonts/Fonts'
import EmailForm from 'src/forms/EmailForm'
import ChangeStory from 'src/home/change-story/ChangeStory'
import TextAnimation, { WORDS } from 'src/home/TextAnimation'
import { NameSpaces, useTranslation } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenSizes, useScreenSize } from 'src/layout/ScreenSize'
import AspectRatio from 'src/shared/AspectRatio'
import { BANNER_HEIGHT, HEADER_HEIGHT } from 'src/shared/Styles'
import { fonts, standardStyles } from 'src/styles'

export default function HomeCover() {
  const [currentWordIndex, setWord] = React.useState(0)
  const [isReady, setReady] = React.useState(false)

  const changeWord = React.useCallback(() => {
    if (currentWordIndex !== WORDS.length - 1) {
      setWord(currentWordIndex + 1)
    } else {
      setWord(0)
    }
  }, [currentWordIndex])

  const onReady = React.useCallback(() => setReady(true), [])

  const { t } = useTranslation(NameSpaces.home)
  const { isMobile, screen, isDesktop } = useScreenSize()

  return (
    <GridRow
      desktopStyle={styles.desktopContainer}
      tabletStyle={styles.tabletContainer}
      mobileStyle={styles.mobileContainer}
    >
      <Cell
        span={Spans.full}
        style={[styles.container, isDesktop && styles.centerMe, !isMobile && standardStyles.row]}
      >
        <View style={[styles.animationHolder, getplacement(screen)]}>
          <AspectRatio ratio={970 / 270}>
            <ChangeStory onReady={onReady} onLooped={changeWord} />
          </AspectRatio>
        </View>
        <View style={[styles.contentHolder, standardStyles.blockMarginTablet]}>
          <TextAnimation currentWord={currentWordIndex} isAnimating={isReady} />
          <H4 style={styles.coverText}>{t('coverText')}</H4>
          <Text style={[fonts.h6, styles.coverJoinList]}>{t('coverJoinList')}</Text>
          <EmailForm
            placeholder={'saluton@celo.org'}
            submitText={'Submit'}
            route={'/contacts'}
            isDarkMode={false}
          />
        </View>
      </Cell>
    </GridRow>
  )
}

function getplacement(screen: ScreenSizes) {
  switch (screen) {
    case ScreenSizes.DESKTOP:
      return styles.animationPlaceDesktop
    case ScreenSizes.TABLET:
      return styles.animationPlaceTablet
    default:
      return styles.animationPlaceMobile
  }
}

const styles = StyleSheet.create({
  desktopContainer: {
    paddingTop: BANNER_HEIGHT + HEADER_HEIGHT,
    maxHeight: '110vw',
    height: '100vh',
  },
  tabletContainer: {
    paddingTop: BANNER_HEIGHT + HEADER_HEIGHT,
    marginTop: 90,
    height: '100vh',
    marginBottom: 100,
  },
  mobileContainer: { paddingTop: BANNER_HEIGHT + HEADER_HEIGHT, marginTop: 90, minHeight: '100vh' },
  animationHolder: {
    flex: 4,
    minWidth: 350,
    flexBasis: '50%',
    zIndex: 10,
  },
  centerMe: {
    alignSelf: 'center',
  },
  animationPlaceDesktop: {
    marginTop: 30,
    paddingTop: '6%',
    paddingRight: 30,
    transform: [
      {
        // @ts-ignore
        translateX: '-17%',
      },
      { scale: 1.1 },
    ],
  },
  animationPlaceTablet: {
    paddingTop: '10%',
    paddingRight: 40,

    transform: [
      {
        translateX: -80,
      },
    ],
  },
  animationPlaceMobile: {
    paddingBottom: 15,
    transform: [
      {
        translateX: -60,
      },
    ],
  },
  contentHolder: {
    flexGrow: 1,
    flexBasis: 370,
    maxWidth: '90vw',
  },
  container: {
    flexWrap: 'wrap',
  },
  coverText: {
    marginTop: 10,
    marginBottom: 30,
    maxWidth: 450,
  },
  coverJoinList: {
    paddingTop: 10,
    paddingLeft: 3,
    paddingBottom: 2,
  },
})
