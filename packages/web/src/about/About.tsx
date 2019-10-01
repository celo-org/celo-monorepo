import * as React from 'react'
import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native'
import Backers from 'src/about/Backers'
import { sacredEconBack, team } from 'src/about/images'
import PressMedia from 'src/about/PressMedia'
import Team from 'src/about/Team'
import VideoCover from 'src/about/VideoCover'
import { H1 } from 'src/fonts/Fonts'
import OpenGraph from 'src/header/OpenGraph'
import { I18nProps, withNamespaces } from 'src/i18n'
import SideTitledSection from 'src/layout/SideTitledSection'
import menuItems from 'src/shared/menu-items'
import { standardStyles, textStyles } from 'src/styles'

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
          {/* Below Fold */}
          <SideTitledSection title={t('aboutMissionTitle')}>
            <H1>{t('aboutMissionText')}</H1>
          </SideTitledSection>
          <SideTitledSection title={t('aboutMeaningTile')}>
            <H1>{t('aboutMeaningText')}</H1>
            <Text>{t('aboutMeaningCopy')}</Text>
          </SideTitledSection>
          <ImageBackground
            source={sacredEconBack}
            style={[{ width: '100%', height: 511 }, standardStyles.centered]}
            resizeMode={'cover'}
          >
            <Text style={[textStyles.invert, textStyles.center]}>{t('beautifulLifeQuote')}</Text>
            <Text style={textStyles.invert}>{t('beautifulLifeSource')}</Text>
          </ImageBackground>
          <SideTitledSection title={t('aboutSacredEconTitle')}>
            <H1>{t('aboutSacredEconText')}</H1>
          </SideTitledSection>
          <SideTitledSection title={t('aboutValuesTile')}>
            <H1>{t('aboutValuesText')}</H1>
            <Text>{t('aboutValuesCopy')}</Text>
          </SideTitledSection>
          <Image source={team} style={[{ width: '100%', height: 649 }]} resizeMode={'cover'} />
          <Team randomSeed={randomSeed} />
          <Backers />
          <PressMedia />
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
  },
  mediumMintPlaza: {},
  largeMintPlaza: {
    height: IMAGE_HEIGHT,
    width: IMAGE_WIDTH,
  },
  hero: {
    position: 'absolute',
    left: 20,
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
