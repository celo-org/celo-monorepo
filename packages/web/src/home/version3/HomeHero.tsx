import * as React from 'react'
import FadeIn from 'react-lazyload-fadein'
import { Image, StyleSheet, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import { H2 } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import Inclusive from 'src/illustrations/03-Inclusive-money-(light-bg).png'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import VideoModal from 'src/shared/VideoModal'
import { standardStyles, textStyles } from 'src/styles'

import image from 'src/join/claire-video-banner.jpg'

type Props = I18nProps

const ILLO_HEIGHT = 125

class HomeHero extends React.PureComponent<Props> {
  render() {
    return (
      <>
        <GridRow
          allStyle={standardStyles.centered}
          mobileStyle={[standardStyles.sectionMarginTopMobile]}
          tabletStyle={standardStyles.sectionMarginTopTablet}
          desktopStyle={[standardStyles.sectionMarginTop]}
        >
          <Cell style={styles.center} span={Spans.three4th}>
            <FadeIn height={ILLO_HEIGHT}>
              {(onload) => (
                <Image
                  resizeMode="contain"
                  onLoad={onload}
                  style={styles.illo}
                  source={{ uri: Inclusive }}
                />
              )}
            </FadeIn>
            <Fade bottom={true} distance="20px">
              <View style={styles.maxWidth}>
                <H2 style={textStyles.center}>{this.props.t('hero3')}</H2>
              </View>
            </Fade>
          </Cell>
        </GridRow>
        <GridRow
          allStyle={[standardStyles.centered, standardStyles.elementalMarginTop]}
          mobileStyle={standardStyles.blockMarginBottomMobile}
          tabletStyle={standardStyles.blockMarginBottomTablet}
          desktopStyle={standardStyles.blockMarginBottom}
        >
          <Cell span={Spans.full}>
            <VideoModal
              previewImage={image}
              videoID={'vwfHiaVzc2E'}
              ariaDescription="Video on working on Celo"
            />
          </Cell>
        </GridRow>
      </>
    )
  }
}

export default withNamespaces('home')(HomeHero)

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
  },
  maxWidth: {
    maxWidth: 550,
  },
  illo: {
    width: 242,
    height: 126,
  },
})
