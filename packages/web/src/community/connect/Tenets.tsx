import Carousel from 'nuka-carousel'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import PagingDots from 'src/carousel/PagingDots'
import { H2, H3, H4 } from 'src/fonts/Fonts'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import Fade from 'src/shared/AwesomeFade'
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
      <View nativeID={hashNav.connect.tenets} style={standardStyles.sectionMarginBottom}>
        <GridRow
          allStyle={standardStyles.centered}
          mobileStyle={standardStyles.sectionMarginMobile}
          tabletStyle={standardStyles.sectionMarginTablet}
          desktopStyle={standardStyles.sectionMargin}
        >
          <Cell span={Spans.three4th}>
            <Fade distance={'20px'}>
              <View style={standardStyles.centered}>
                <H2 style={[textStyles.center, standardStyles.elementalMarginBottom]}>
                  {t('tenetTitle')}
                </H2>
                <H4 style={[textStyles.center]}>{t('tenetSubtitle')}</H4>
              </View>
            </Fade>
          </Cell>
        </GridRow>
        <Fade distance={'20px'}>
          <Carousel
            heightMode={'current'}
            autoplay={false}
            dragging={true}
            swiping={true}
            renderCenterLeftControls={null}
            renderCenterRightControls={null}
            renderBottomCenterControls={PagingDots}
          >
            {TENET_ILLOS.map((image, index) => {
              const number = index + 1
              return (
                <Tenet
                  key={number}
                  title={t(`tenets.${number}`)}
                  number={number}
                  copy={t(`tenets.text.${number}`)}
                  headline={t(`tenets.subtitles.${number}`)}
                  imageKey={image}
                />
              )
            })}
          </Carousel>
        </Fade>
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
      <View style={styles.tenet}>
        <GridRow tabletStyle={styles.tabletStyle}>
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
  tenet: {
    marginBottom: 100,
  },
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
