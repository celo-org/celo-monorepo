import fetch from 'cross-fetch'
import * as React from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import shuffleSeed from 'shuffle-seed'
import AudioIcon from 'src/about/AudioIcon'
import Backers from 'src/about/Backers'
import { Contributor } from 'src/about/Contributor'
import { sacredEconBack, team } from 'src/about/images'
import PressMedia from 'src/about/PressMedia'
import Team from 'src/about/Team'
import CeloValues from 'src/about/Values'
import VideoCover from 'src/about/VideoCover'
import analytics from 'src/analytics/analytics'
import { H1 } from 'src/fonts/Fonts'
import OpenGraph from 'src/header/OpenGraph'
import { I18nProps, NameSpaces, Trans, withNamespaces } from 'src/i18n'
import BookLayout from 'src/layout/BookLayout'
import { Cell, GridRow, Spans } from 'src/layout/GridRow'
import LogoLightBg from 'src/logos/LogoLightBg'
import BeautifulQuote from 'src/shared/BeautifulQuote'
import Button, { BTN } from 'src/shared/Button.3'
import InlineAnchor from 'src/shared/InlineAnchor'
import menuItems from 'src/shared/menu-items'
import { fonts, standardStyles, textStyles } from 'src/styles'

interface Props {
  contributors: Contributor[]
}

async function pronunceCelo() {
  const audio = document.getElementById('pronunce') as HTMLAudioElement
  await audio.play()
  await analytics.track('pronounced celo')
}

export class About extends React.Component<Props & I18nProps> {
  static async getInitialProps({ req }) {
    let contributors
    if (req) {
      const getContributors = await import('src/../server/getContributors')
      contributors = await getContributors.default()
    } else {
      contributors = await fetch(`/api/contributors`).then((result) => result.json())
    }

    const shuffledTeam = shuffleSeed.shuffle(contributors, Math.random())
    return { contributors: shuffledTeam }
  }

  render() {
    const { t, contributors } = this.props

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
          <BookLayout label={t('MissionTitle')}>
            <H1>{t('MissionText')}</H1>
          </BookLayout>
          <BookLayout label={t('MeaningTile')} endBlock={true}>
            <H1 style={standardStyles.elementalMarginBottom}>
              <Trans
                ns={NameSpaces.about}
                t={t}
                i18nKey={'MeaningText'}
                values={{ phonetic: '/ˈtselo/' }}
                children={[
                  <Text key={1} style={textStyles.italic}>
                    "/ˈtselo/"
                  </Text>,
                  <TouchableOpacity key={2} onPress={pronunceCelo}>
                    <AudioIcon />
                    <audio id="pronunce">
                      <source src="audio/celo-pronunce.ogg" type="audio/ogg" />
                      <source src="audio/celo-pronunce.mp3" type="audio/mp3" />
                    </audio>
                  </TouchableOpacity>,
                ]}
              />
            </H1>
            <Text style={[fonts.p, standardStyles.elementalMargin]}>{t('MeaningCopy')}</Text>
          </BookLayout>
          <Image source={team} style={styles.teamImage} resizeMode={'cover'} />
          <BookLayout label={t('ValuesTitle')}>
            <Text style={[fonts.p, standardStyles.elementalMarginBottom]}>
              <Trans
                ns={NameSpaces.about}
                i18nKey={'ValuesCopy'}
                values={{ celoCLabs: 'Celo\u00a0– C\u00a0Labs' }}
                children={<Strong key="0">M</Strong>}
              />
            </Text>
          </BookLayout>
          <CeloValues />
          <BeautifulQuote
            quote={t('beautifulLifeQuote')}
            imgSource={sacredEconBack}
            citation={`– ${t('beautifulLifeSource')}`}
          />
          <BookLayout label={t('SacredEconTitle')} startBlock={true}>
            <Text style={[fonts.p, standardStyles.blockMarginBottomTablet]}>
              <Trans
                ns={NameSpaces.about}
                i18nKey="SacredEconText"
                children={
                  <InlineAnchor key="sacred" href="http://sacred-economics.com/film/">
                    Sacred Econ
                  </InlineAnchor>
                }
              />
            </Text>
            <Button
              kind={BTN.PRIMARY}
              href="http://sacred-economics.com/film/"
              text={t('learnMore')}
            />
          </BookLayout>
          <BookLayout label={t('theoryOfChangeTitle')} startBlock={true}>
            <Text style={[fonts.p, standardStyles.blockMarginBottomTablet]}>
              {t('theoryOfChangeText')}
            </Text>
            <Button
              kind={BTN.PRIMARY}
              href="https://medium.com/celoOrg/celos-theory-of-change-b916de44945d"
              text={t('learnMore')}
            />
          </BookLayout>
          <Team contributors={contributors} />
          <Backers />
          <PressMedia />
        </View>
      </>
    )
  }
}

function Strong({ children }) {
  return <Text style={textStyles.heavy}>{children}</Text>
}

const styles = StyleSheet.create({
  teamImage: { width: '100%', height: 650 },
  logoArea: { justifyContent: 'flex-end' },
})

export default withNamespaces('about')(About)
