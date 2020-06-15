import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { agree, disagree, showVisitorCookieConsent } from 'src/analytics/analytics'
import { I18nProps, withNamespaces } from 'src/i18n'
import Link from 'src/shared/Link'
import Responsive from 'src/shared/Responsive'
import { CONSENT_HEIGHT } from 'src/shared/Styles'
import { colors, fonts } from 'src/styles'
import { initSentry } from 'src/utils/sentry'

interface State {
  showConsent: boolean
}

export class CookieConsent extends React.PureComponent<I18nProps, State> {
  state = {
    showConsent: false,
  }

  async componentDidMount() {
    this.setState({
      showConsent: await showVisitorCookieConsent(),
    })
  }

  onAgree = async () => {
    await agree()
    this.setState({
      showConsent: false,
    })
    await initSentry()
  }

  onDisagree = () => {
    disagree()
    this.setState({
      showConsent: false,
    })
  }

  render() {
    const { t } = this.props

    if (!this.state.showConsent) {
      return null
    }

    return (
      <View style={styles.container}>
        <Text style={[fonts.p, styles.infoMessageText]}>
          <Text style={styles.infoMessageTextPrefix}>{t('weUseCookies')} </Text>
          {t('weUseCookiesReasons')}
        </Text>
        <Text style={[fonts.p, styles.infoMessageText]}>
          {t('cookiesPrivacyInfo')}{' '}
          <Link href="/privacy">
            <Text style={[fonts.p, styles.link]}>{t('cookiesPrivacyPolicy')}</Text>
          </Link>
        </Text>

        <Responsive medium={styles.buttonContainerMedium} large={styles.buttonsContainer}>
          <View style={styles.buttonContainerMedium}>
            <Responsive
              medium={[styles.buttonMedium, styles.disagreeButton]}
              large={[styles.button, styles.disagreeButton]}
            >
              <View style={[styles.buttonMedium, styles.disagreeButton]} onClick={this.onDisagree}>
                <Text style={[fonts.navigation, styles.buttonText]}>{t('cookiesDisagree')}</Text>
              </View>
            </Responsive>
            <Responsive
              medium={[styles.buttonMedium, styles.agreeButton]}
              large={[styles.button, styles.agreeButton]}
            >
              <View style={[styles.buttonMedium, styles.agreeButton]} onClick={this.onAgree}>
                <Text style={[fonts.navigation, styles.buttonText]}>{t('cookiesAgree')}</Text>
              </View>
            </Responsive>
          </View>
        </Responsive>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    bottom: 0,
    position: 'fixed',
    backgroundColor: colors.deepBlue,
    width: '100%',
    minHeight: CONSENT_HEIGHT,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  infoMessageText: {
    textAlign: 'center',
    color: colors.white,
  },
  infoMessageTextPrefix: {
    textAlign: 'center',
    fontWeight: '600',
  },
  buttonsContainer: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  buttonContainerMedium: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 30,
    width: 160,
    marginTop: 30,
    cursor: 'pointer',
  },
  buttonMedium: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 26,
    width: 160,
    marginTop: 18,
    cursor: 'pointer',
  },
  disagreeButton: {
    borderWidth: 1,
    borderRadius: 2,
    marginLeft: 10,
    borderColor: '#3C9BF4',
  },
  agreeButton: {
    borderWidth: 1,
    borderRadius: 2,
    marginLeft: 10,
    borderColor: colors.white,
  },
  buttonText: {
    textAlign: 'center',
    color: colors.white,
    textRendering: 'geometricPrecision',
  },
  link: {
    color: colors.white,
    cursor: 'pointer',
    textDecorationLine: 'underline',
  },
})

export default withNamespaces('common')(CookieConsent)
