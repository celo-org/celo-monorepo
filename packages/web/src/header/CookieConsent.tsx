import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { I18nProps, withNamespaces } from 'src/i18n'
import Link from 'src/shared/Link'
import Responsive from 'src/shared/Responsive'
import { Colors, CONSENT_HEIGHT, Fonts, TextStyles } from 'src/shared/Styles'
import { agree, disagree, hasUserGivenCookiesAgreement } from '../analytics/analytics'

const isInEU = require('@segment/in-eu')

interface State {
  showConsent: boolean
}

export class CookieConsent extends React.Component<I18nProps, State> {
  state = {
    showConsent: false,
  }

  componentDidMount() {
    this.setState({
      showConsent: isInEU() && !hasUserGivenCookiesAgreement(),
    })
  }

  render() {
    const { t } = this.props

    const onClickAgree = () => {
      agree()
      this.setState({
        showConsent: false,
      })
    }

    if (!this.state.showConsent) {
      return null
    }

    return (
      <View style={styles.container}>
        <Text style={[styles.infoMessageText, styles.infoMessageTextFirstBlock]}>
          <Text style={styles.infoMessageTextPrefix}>{t('weUseCookies')} </Text>
          {t('weUseCookiesReasons')}
        </Text>
        <Text style={styles.infoMessageText}>
          {t('cookiesPrivacyInfo')}{' '}
          <Link href="/privacy">
            <Text style={styles.link}>{t('cookiesPrivacyPolicy')}</Text>
          </Link>
        </Text>

        <Responsive medium={styles.buttonContainerMedium} large={styles.buttonsContainer}>
          <View style={styles.buttonContainerMedium}>
            <Responsive
              medium={[styles.buttonMedium, styles.disagreeButton]}
              large={[styles.button, styles.disagreeButton]}
            >
              <View style={[styles.buttonMedium, styles.disagreeButton]} onClick={disagree}>
                <Text style={[TextStyles.button, styles.buttonText]}>
                  {t('cookiesDisagree')
                    .toString()
                    .toUpperCase()}
                </Text>
              </View>
            </Responsive>
            <Responsive
              medium={[styles.buttonMedium, styles.agreeButton]}
              large={[styles.button, styles.agreeButton]}
            >
              <View style={[styles.buttonMedium, styles.agreeButton]} onClick={onClickAgree}>
                <Text style={[TextStyles.button, styles.buttonText]}>
                  {t('cookiesAgree')
                    .toString()
                    .toUpperCase()}
                </Text>
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
    // @ts-ignore-next-line
    position: 'fixed',
    backgroundColor: '#3C9BF4',
    width: '100%',
    minHeight: CONSENT_HEIGHT,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  infoMessageText: {
    textAlign: 'center',
    color: Colors.WHITE,
    fontFamily: Fonts.PRIMARY,
    fontSize: 16,
    fontWeight: '300',
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
    borderColor: Colors.WHITE,
  },
  buttonText: {
    textAlign: 'center',
    color: Colors.WHITE,
    fontSize: 13,
  },
  link: {
    color: Colors.WHITE,
    cursor: 'pointer',
    textDecorationLine: 'underline',
  },
})

export default withNamespaces('common')(CookieConsent)
