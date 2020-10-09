import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import analytics from 'src/analytics/analytics'
import { H1, H4 } from 'src/fonts/Fonts'
import OpenGraph from 'src/header/OpenGraph'
import { I18nProps, withNamespaces } from 'src/i18n'
import fetchLeverJobs, { LeverJob } from 'src/jobs/lever'
import Jobs from 'src/jobs/version3/Jobs'
import Benefits from 'src/join/Benefits'
import FeaturedVideo from 'src/join/FeaturedVideo'
import ImagePanes from 'src/join/ImagePanes'
import previewImage from 'src/join/preview.png'
import Rise from 'src/join/Rise'
import ThreePillars from 'src/join/ThreePillars'
import Fade from 'src/shared/AwesomeFade'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import menuItems, { hashNav } from 'src/shared/menu-items'
import { colors, standardStyles, textStyles } from 'src/styles'
import { scrollTo } from 'src/utils/utils'

const DESCRIPTION =
  'Join us in building financial system that creates the conditions for prosperity for all. We are growing a team with all kinds of different perspectives, experiences and backgrounds to create products that are used and loved by people all around the world.'

interface OwnProps {
  positions: LeverJob[]
}

type Props = I18nProps & OwnProps

function onExploreRoles() {
  scrollTo(hashNav.join.roles)
}

class JoinPage extends React.PureComponent<Props> {
  static async getInitialProps() {
    let positions = []
    try {
      positions = await fetchLeverJobs()
    } catch {
      await analytics.track('Lever Down')
    }
    return { positions }
  }

  render() {
    const { t } = this.props
    return (
      <>
        <OpenGraph
          path={menuItems.JOBS.link}
          title={t('pageTitle')}
          description={DESCRIPTION}
          image={previewImage}
        />
        <View style={[standardStyles.centered, styles.container]}>
          <View style={styles.cover}>
            <View style={styles.heading}>
              <View style={[standardStyles.centered, styles.cloud, styles.inside]}>
                <Fade delay={10} distance={'20px'}>
                  <View style={standardStyles.centered}>
                    <H1
                      ariaLevel="2"
                      style={[textStyles.center, standardStyles.elementalMarginBottom]}
                    >
                      {t('workWithValue')}
                    </H1>
                    <H4 style={[textStyles.center, standardStyles.elementalMarginBottom]}>
                      {t('joinUsToCreateMoney')}
                    </H4>
                  </View>
                </Fade>
              </View>
              <View style={[styles.cloud]}>
                <Fade delay={20} distance={'20px'}>
                  <Button
                    kind={BTN.PRIMARY}
                    text={t('exploreRoles')}
                    onPress={onExploreRoles}
                    size={SIZE.big}
                    align={'center'}
                  />
                </Fade>
              </View>
            </View>
            <Rise />
          </View>
          <FeaturedVideo />
          <ThreePillars />
          <ImagePanes />
          <Jobs positions={this.props.positions} />
          <Benefits />
        </View>
      </>
    )
  }
}

export default withNamespaces('jobs')(JoinPage)

const styles = StyleSheet.create({
  container: {
    maxWidth: '100vw',
    overflow: 'hidden',
  },
  heading: {
    width: '100vw',
    height: '100vh',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
  },
  inside: {
    maxWidth: 800,
  },
  cloud: {
    borderRadius: 100,
    backgroundColor: colors.white,
    padding: 10,
    boxShadow: '0px 5px 30px 10px rgba(255,255,255,1)',
  },
  cover: {
    height: '100vh',
    width: '100%',
    marginBottom: 100,
  },
})
