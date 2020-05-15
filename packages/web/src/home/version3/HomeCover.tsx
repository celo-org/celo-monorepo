import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { H4 } from 'src/fonts/Fonts'
import EmailForm from 'src/forms/EmailForm'
import changeStoryWebP from 'src/home/change-story/change-story.webp'
import ChangeStory from 'src/home/change-story/ChangeStory'
import TextAnimation from 'src/home/TextAnimation'
import { NameSpaces, useTranslation } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenSizes, useScreenSize } from 'src/layout/ScreenSize'
import AspectRatio from 'src/shared/AspectRatio'
import { BANNER_HEIGHT, HEADER_HEIGHT } from 'src/shared/Styles'
import { fonts, standardStyles } from 'src/styles'
import { canUseWebP } from 'src/utils/utils'

export default function HomeCover() {
  // on chrome on desktop the lottie file has weird artifacts so we use webp instead.
  const [canWebP, setCanWebP] = React.useState(false)
  React.useEffect(() => {
    setCanWebP(canUseWebP())
  }, [])

  const { t } = useTranslation(NameSpaces.home)
  const { isMobile, screen, isDesktop } = useScreenSize()

  return (
    <GridRow
      desktopStyle={{
        paddingTop: BANNER_HEIGHT + HEADER_HEIGHT,
        maxHeight: '100vw',
        minHeight: '100vh',
      }}
      tabletStyle={{
        paddingTop: BANNER_HEIGHT + HEADER_HEIGHT,
        marginTop: 90,
        minHeight: '80vh',
        marginBottom: 100,
      }}
      mobileStyle={{ paddingTop: BANNER_HEIGHT + HEADER_HEIGHT, marginTop: 90, minHeight: '100vh' }}
    >
      <Cell
        span={Spans.full}
        style={[
          styles.container,
          isDesktop && { alignSelf: 'center' },
          !isMobile && standardStyles.row,
        ]}
      >
        <View style={[styles.animationHolder, getplacement(screen)]}>
          <AspectRatio ratio={970 / 270}>
            {isDesktop && canWebP ? (
              <Image source={changeStoryWebP} style={standardStyles.image} />
            ) : (
              <ChangeStory />
            )}
          </AspectRatio>
        </View>
        <View style={[styles.contentHolder, standardStyles.blockMarginTablet]}>
          <TextAnimation playing={true} />
          <H4 style={styles.coverText}>{t('coverText')}</H4>
          <Text style={[fonts.h6, styles.coverJoinList]}>{t('coverJoinList')}</Text>
          <EmailForm submitText={'Submit'} route={'/contacts'} isDarkMode={false} />
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
  animationHolder: {
    flex: 2,
    minWidth: 350,
    zIndex: 10,
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
    transform: [
      {
        translateX: -60,
      },
    ],
  },
  contentHolder: {
    flexBasis: 370,
    maxWidth: '85vw',
  },
  container: {
    flexWrap: 'wrap',
  },
  coverText: {
    marginTop: 10,
    marginBottom: 30,
  },
  coverJoinList: {
    paddingTop: 10,
    paddingLeft: 3,
    paddingBottom: 2,
  },
})
