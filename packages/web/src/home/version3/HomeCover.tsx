import * as React from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { H4 } from 'src/fonts/Fonts'
import EmailForm from 'src/forms/EmailForm'
import changeStoryPlaceHolder from 'src/home/change-story.png'
import TextAnimation from 'src/home/TextAnimation'
import { NameSpaces, useTranslation } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenSizes, useScreenSize } from 'src/layout/ScreenSize'
import AspectRatio from 'src/shared/AspectRatio'
import { BANNER_HEIGHT, HEADER_HEIGHT } from 'src/shared/Styles'
import { standardStyles } from 'src/styles'

export default function HomeCover() {
  const { t } = useTranslation(NameSpaces.home)
  const { isMobile, screen } = useScreenSize()
  return (
    <GridRow
      allStyle={{ paddingTop: BANNER_HEIGHT + HEADER_HEIGHT }}
      tabletStyle={standardStyles.sectionMarginTablet}
      desktopStyle={standardStyles.sectionMargin}
    >
      <Cell span={Spans.full} style={[styles.container, !isMobile && standardStyles.row]}>
        <View
          style={[styles.animationHolder, standardStyles.blockMarginTablet, getplacement(screen)]}
        >
          <AspectRatio ratio={814 / 216}>
            <Image
              source={changeStoryPlaceHolder}
              style={{ width: '100%', height: '100%', zIndex: 10 }}
            />
          </AspectRatio>
        </View>
        <View style={[styles.contentHolder, standardStyles.blockMarginTablet]}>
          <TextAnimation playing={true} />
          <H4 style={standardStyles.elementalMargin}>{t('coverText')}</H4>
          <EmailForm submitText={'Sign Up'} route={'/contacts'} isDarkMode={false} />
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
    minWidth: 300,
    paddingRight: 20,
    zIndex: 10,
  },
  animationPlaceDesktop: {
    transform: [
      {
        // @ts-ignore
        translateX: '-10%',
      },
    ],
  },
  animationPlaceTablet: {
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
  },
  container: {
    paddingVertical: 50,
    flexWrap: 'wrap',
  },
})
