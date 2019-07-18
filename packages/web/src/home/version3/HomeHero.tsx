import * as React from 'react'
import FadeIn from 'react-lazyload-fadein'
import { Image, StyleSheet, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import { H1 } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { standardStyles, textStyles } from 'src/styles'
const image = require('src/home/merchant.jpg')

type Props = I18nProps

const IMAGE_HEIGHT = 313

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
            <Fade bottom={true} distance="20px">
              <View style={styles.maxWidth}>
                <H1 accessibilityRole={'heading'} style={[textStyles.center]}>
                  {this.props.t('hero3')}
                </H1>
              </View>
            </Fade>
          </Cell>
        </GridRow>
        <GridRow
          allStyle={standardStyles.centered}
          mobileStyle={[standardStyles.blockMarginMobile]}
          tabletStyle={[standardStyles.blockMarginTablet]}
          desktopStyle={[standardStyles.blockMargin]}
        >
          <FadeIn height={IMAGE_HEIGHT}>
            {(onload) => <Image onLoad={onload} style={styles.image} source={{ uri: image }} />}
          </FadeIn>
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
  image: {
    height: IMAGE_HEIGHT,
    width: 622,
  },
  maxWidth: {
    maxWidth: 600,
  },
})
