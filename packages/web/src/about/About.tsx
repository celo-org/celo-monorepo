import * as React from 'react'
import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native'
import Backers from 'src/about/Backers'
import { sacredEconBack, team } from 'src/about/images'
import PressMedia from 'src/about/PressMedia'
import Team from 'src/about/Team'
import CeloValues from 'src/about/Values'
import VideoCover from 'src/about/VideoCover'
import { H1 } from 'src/fonts/Fonts'
import OpenGraph from 'src/header/OpenGraph'
import { I18nProps, withNamespaces } from 'src/i18n'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import SideTitledSection from 'src/layout/SideTitledSection'
import LogoLightBg from 'src/logos/LogoLightBg'
import menuItems from 'src/shared/menu-items'
import { fonts, standardStyles, textStyles } from 'src/styles'

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
        <View>
          <VideoCover />
          {/* Below Fold */}
          <GridRow
            desktopStyle={[styles.logoArea, standardStyles.sectionMarginTop]}
            tabletStyle={[styles.logoArea, standardStyles.sectionMarginTopTablet]}
            mobileStyle={standardStyles.sectionMarginTopMobile}
          >
            <Cell span={Spans.three4th}>
              <LogoLightBg height={47} />
            </Cell>
          </GridRow>
          <SideTitledSection title={t('MissionTitle')}>
            <H1>{t('MissionText')}</H1>
          </SideTitledSection>
          <SideTitledSection title={t('MeaningTile')}>
            <H1>{t('MeaningText')}</H1>
            <Text style={[fonts.p, standardStyles.elementalMargin]}>{t('MeaningCopy')}</Text>
          </SideTitledSection>
          <ImageBackground
            source={sacredEconBack}
            style={[styles.sacredEconImage, standardStyles.centered]}
            resizeMode={'cover'}
          >
            <Text style={[fonts.h1, styles.quote, textStyles.invert, textStyles.center]}>
              {t('beautifulLifeQuote')}
            </Text>
            <Text style={[fonts.h1, textStyles.invert, standardStyles.blockMarginTopTablet]}>
              – {t('beautifulLifeSource')}
            </Text>
          </ImageBackground>
          <SideTitledSection title={t('SacredEconTitle')}>
            <H1>{t('SacredEconText')}</H1>
          </SideTitledSection>
          <SideTitledSection title={t('ValuesTitle')}>
            <H1>{t('ValuesText')}</H1>
            <Text style={[fonts.p, standardStyles.elementalMargin]}>
              {t('ValuesCopy', { celoCLabs: 'Celo\u00a0– C\u00a0Labs' })}
            </Text>
          </SideTitledSection>
          <CeloValues />
          <Image source={team} style={styles.teamImage} resizeMode={'cover'} />
          <Team randomSeed={randomSeed} />
          <Backers />
          <PressMedia />
        </View>
      </>
    )
  }
}

const styles = StyleSheet.create({
  sacredEconImage: { width: '100%', height: 511 },
  teamImage: { width: '100%', height: 649 },
  logoArea: { justifyContent: 'flex-end' },
  quote: {
    fontSize: 65,
    lineHeight: 72,
    fontStyle: 'italic',
  },
})

export default withNamespaces('about')(About)
