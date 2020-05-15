import * as React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { H4 } from 'src/fonts/Fonts'
import EmailForm from 'src/forms/EmailForm'
import changeStoryGif from 'src/home/change-story/Change-the-story.gif'
import ChangeStory from 'src/home/change-story/ChangeStory'
import TextAnimation from 'src/home/TextAnimation'
import { NameSpaces, useTranslation } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { ScreenSizes, useScreenSize } from 'src/layout/ScreenSize'
import AspectRatio from 'src/shared/AspectRatio'
import { BANNER_HEIGHT, HEADER_HEIGHT } from 'src/shared/Styles'
import { fonts, standardStyles } from 'src/styles'

export default function HomeCover() {
  const { t } = useTranslation(NameSpaces.home)
  const { isMobile, screen, isDesktop } = useScreenSize()
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
          <AspectRatio ratio={970 / 270}>
            {isDesktop ? (
              <Image source={changeStoryGif} style={standardStyles.image} />
            ) : (
              <ChangeStory />
            )}
          </AspectRatio>
        </View>
        <View style={[styles.contentHolder, standardStyles.blockMarginTablet]}>
          <TextAnimation playing={true} />
          <H4 style={standardStyles.elementalMargin}>{t('coverText')}</H4>
          <Text style={fonts.h6}>{t('coverJoinList')}</Text>
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
    minWidth: 300,
    paddingRight: 20,
    zIndex: 10,
  },
  animationPlaceDesktop: {
    transform: [
      {
        // @ts-ignore
        translateX: '-7%',
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
