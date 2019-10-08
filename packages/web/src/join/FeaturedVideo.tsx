import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import { H2 } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import VideoModal from 'src/shared/VideoModal'
import { colors, standardStyles, textStyles } from 'src/styles'
const image = require('src/join/claire-video-banner.jpg')

class FeaturedVideo extends React.PureComponent<I18nProps> {
  render() {
    return (
      <View style={styles.container}>
        <GridRow
          mobileStyle={standardStyles.sectionMarginTopMobile}
          tabletStyle={standardStyles.sectionMarginTopTablet}
          desktopStyle={standardStyles.sectionMarginTop}
          allStyle={[standardStyles.centered, standardStyles.elementalMarginBottom]}
        >
          <Cell span={Spans.three4th}>
            <Fade bottom={true} distance={'20px'}>
              <View style={standardStyles.centered}>
                <H2 style={[textStyles.center, styles.heading]}>
                  {this.props.t('buildAMonetarySys')}
                </H2>
              </View>
            </Fade>
          </Cell>
        </GridRow>
        <GridRow
          mobileStyle={standardStyles.sectionMarginBottomMobile}
          tabletStyle={standardStyles.sectionMarginBottomTablet}
          desktopStyle={standardStyles.sectionMarginBottom}
        >
          <Cell span={Spans.full}>
            {
              <VideoModal
                previewImage={image}
                videoID={'F5SnS1v9fNo'}
                ariaDescription="Video on working on Celo"
              />
            }
          </Cell>
        </GridRow>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.deepBlue,
    width: '100%',
    paddingBottom: 40,
  },
  heading: {
    color: colors.white,
  },
})

export default withNamespaces('jobs')(FeaturedVideo)
