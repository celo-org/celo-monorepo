import Carousel from 'nuka-carousel'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Fade from 'react-reveal/Fade'
import PagingDots from 'src/carousel/PagingDots'
import { H2, H3, H4 } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import { hashNav } from 'src/shared/menu-items'
import ResponsiveImage from 'src/shared/ResponsiveImage'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'

type Props = I18nProps

const TENET_ILLOS = ['design', 'innovate', 'beauty', 'humility']

const IMAGE_MAP = {
  design: {
    large: require('src/community/connect/01-Tenets.jpg'),
    medium: require('src/community/connect/01-Tenets-427.jpg'),
    small: require('src/community/connect/01-Tenets-460.jpg'),
  },
  innovate: {
    large: require('src/community/connect/02-Tenets.jpg'),
    medium: require('src/community/connect/02-Tenets-427.jpg'),
    small: require('src/community/connect/02-Tenets-460.jpg'),
  },
  beauty: {
    large: require('src/community/connect/03-Tenets.jpg'),
    medium: require('src/community/connect/03-Tenets-427.jpg'),
    small: require('src/community/connect/03-Tenets-460.jpg'),
  },
  humility: {
    large: require('src/community/connect/04-Tenets.jpg'),
    medium: require('src/community/connect/04-Tenets-427.jpg'),
    small: require('src/community/connect/04-Tenets-460.jpg'),
  },
}

class Tenets extends React.PureComponent<Props> {
  componentDidMount() {
    // ensure the Carousel sizes correctly
    setImmediate(() => window.dispatchEvent(new Event('resize')))
  }
  render() {
    const { t } = this.props
    return (
      <View nativeID={hashNav.connect.tenets}>
        <GridRow
          mobileStyle={standardStyles.sectionMarginTopMobile}
          tabletStyle={standardStyles.sectionMarginTopTablet}
          desktopStyle={standardStyles.sectionMarginTop}
        >
          <Cell span={Spans.three4th}>
            <Fade bottom={true} distance={'20px'}>
              <View>
                <H3>{t('tenetSubtitle')}</H3>
                <H2 style={standardStyles.elementalMargin}>{t('tenetTitle')}</H2>
              </View>
            </Fade>
          </Cell>
        </GridRow>
        {TENET_ILLOS.map((image, index) => {
          const number = index + 1
          return (
            <Fade key={number} bottom={true} distance={'20px'}>
              <Tenet
                title={t(`tenets.${number}`)}
                number={number}
                copy={t(`tenets.text.${number}`)}
                headline={t(`tenets.subtitles.${number}`)}
                imageKey={image}
              />
            </Fade>
          )
        })}
      </View>
    )
  }
}

interface TenetProps {
  title: string
  number: number
  copy: string
  headline: string
  imageKey: string
}

class Tenet extends React.PureComponent<TenetProps> {
  render() {
    const { number, title, headline, imageKey, copy } = this.props
    return (
      <View>
        <GridRow
          desktopStyle={standardStyles.blockMarginTop}
          tabletStyle={[standardStyles.blockMarginTopTablet, styles.tabletStyle]}
          mobileStyle={standardStyles.blockMarginTopMobile}
        >
          <Cell span={Spans.half} style={styles.innerPadding}>
            <H3 style={standardStyles.elementalMarginBottom}>
              {number}. {title}
            </H3>
            <H4 style={standardStyles.elementalMarginBottom}>{headline}</H4>
            <ResponsiveImage
              ratio={1015 / 650}
              sources={IMAGE_MAP[imageKey]}
              resizeMode="contain"
            />
          </Cell>
          <Cell span={Spans.half}>
            <Text style={fonts.p}>{copy}</Text>
          </Cell>
        </GridRow>
      </View>
    )
  }
}

const DOT_SIZE = 13
const styles = StyleSheet.create({
  tabletStyle: {
    marginHorizontal: 15,
  },
  dotContainer: {
    flexDirection: 'row',
  },
  innerPadding: { paddingRight: 30 },
  dot: {
    margin: DOT_SIZE / 2,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE,
  },
  inactive: {
    backgroundColor: colors.gray,
  },
  active: { backgroundColor: colors.primary },
  image: { height: '100%', width: '100%' },
})

export default withNamespaces('community')(Tenets)
