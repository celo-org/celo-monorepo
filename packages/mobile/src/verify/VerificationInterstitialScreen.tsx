import PulsingDot from '@celo/react-components/components/PulsingDot'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { isE2EEnv } from 'src/config'
import { Namespaces, withTranslation } from 'src/i18n'
import { noHeaderGestureDisabled } from 'src/navigator/Headers.v2'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

const SCREEN_DURATION = 6000 // 6s

const AnimatedCircle = () => (
  <View style={styles.iconContainer}>
    <PulsingDot color={colors.inactive} circleStartSize={12} animated={!isE2EEnv} />
  </View>
)

class VerificationInterstitialScreen extends React.Component<WithTranslation> {
  static navigationOptions = noHeaderGestureDisabled

  timeout: number | undefined

  componentDidMount() {
    this.timeout = window.setTimeout(() => {
      navigate(Screens.VerificationInputScreen)
    }, SCREEN_DURATION)
  }

  componentWillUnmount() {
    clearTimeout(this.timeout)
  }

  render() {
    const { t } = this.props
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.iconRowContainer}>
            <AnimatedCircle />
            <AnimatedCircle />
            <AnimatedCircle />
          </View>
          <Text style={fontStyles.h2}>{t('interstitial.header')}</Text>
          <Text style={styles.bodyText}>{t('interstitial.body1')}</Text>
          <Text style={styles.bodyText}>{t('interstitial.body2')}</Text>
        </ScrollView>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: colors.onboardingBackground,
  },
  scrollContainer: {
    flex: 1,
    padding: 35,
    paddingTop: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRowContainer: {
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 40,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    width: 12 * 3,
  },
  bodyText: {
    ...fontStyles.regular,
    marginTop: 20,
  },
})

export default withTranslation(Namespaces.nuxVerification2)(VerificationInterstitialScreen)
