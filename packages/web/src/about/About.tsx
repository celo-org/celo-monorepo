import * as React from 'react'
import { Image, StyleSheet, View } from 'react-native'
import Backers from 'src/about/Backers'
import { mintPlaza, teamHero } from 'src/about/images'
import Team from 'src/about/Team'
import VideoCover from 'src/about/VideoCover'
import { H1, H4 } from 'src/fonts/Fonts'
import OpenGraph from 'src/header/OpenGraph'
import MissionText from 'src/home/MissionText'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import AspectRatio from 'src/shared/AspectRatio'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import menuItems from 'src/shared/menu-items'
import Responsive from 'src/shared/Responsive'
import { Colors, HEADER_HEIGHT, MENU_MAX_WIDTH } from 'src/shared/Styles'
import { standardStyles } from 'src/styles'

const IMAGE_HEIGHT = 938
const IMAGE_WIDTH = 835

interface Props {
  randomSeed: number
}

export class About extends React.Component<Props & I18nProps> {
  static getInitialProps() {
    return { randomSeed: Math.random() }
  }

  render() {
    const { t, randomSeed } = this.props

    return (
      <>
        <OpenGraph
          path={menuItems.ABOUT_US.link}
          title={t('pageTitle')}
          description={t('description')}
        />
        <View style={styles.container}>
          <VideoCover />
          <MissionText />
          <Team randomSeed={randomSeed} />
          <GridRow
            desktopStyle={standardStyles.sectionMargin}
            tabletStyle={standardStyles.sectionMarginTablet}
            mobileStyle={standardStyles.sectionMarginMobile}
          >
            <Cell span={Spans.half}>
              <AspectRatio style={styles.sacredEcon} ratio={505 / 366}>
                <Image resizeMode={'contain'} source={{ uri: teamHero }} style={styles.mintPlaza} />
              </AspectRatio>
            </Cell>
            <Cell span={Spans.half}>
              <H4 style={standardStyles.elementalMarginBottom}>{t('joinUsText')}</H4>
              <Button
                size={SIZE.big}
                kind={BTN.PRIMARY}
                text={t('joinUsBtn')}
                href={menuItems.JOBS.link}
              />
            </Cell>
          </GridRow>
          <Backers />
        </View>
      </>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  sacredEcon: {
    width: '100%',
    height: 300,
  },
  background: {
    backgroundColor: Colors.TAN,
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  absolute: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  maxWidth: {
    flex: 1,
    maxWidth: MENU_MAX_WIDTH,
    position: 'relative',
  },
  mintPlaza: {
    width: '100%',
    height: '100%',
  },
  mintPlazaContainer: {
    flex: 1,
    height: IMAGE_HEIGHT / 2,
    width: IMAGE_WIDTH / 2,
    marginTop: HEADER_HEIGHT + 100,
  },
  mediumMintPlaza: {
    marginTop: HEADER_HEIGHT + 150,
  },
  largeMintPlaza: {
    height: IMAGE_HEIGHT,
    width: IMAGE_WIDTH,
    marginTop: HEADER_HEIGHT + 25,
  },
  hero: {
    position: 'absolute',
    left: 20,
    top: HEADER_HEIGHT + 30,
  },
  mediumHero: {
    position: 'absolute',
    left: 60,
    top: 150,
  },
  largeHero: {
    position: 'absolute',
    left: 80,
    top: 260,
  },
  teamHero: {
    width: 505,
    maxWidth: '100vw',
    flex: 1,
  },
})

export default withNamespaces('about')(About)
