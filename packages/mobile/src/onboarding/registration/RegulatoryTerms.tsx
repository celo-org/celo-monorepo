import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import * as React from 'react'
import { Trans, WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { SafeAreaInsetsContext, SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { acceptTerms } from 'src/account/actions'
import { PincodeType } from 'src/account/reducer'
import DevSkipButton from 'src/components/DevSkipButton'
import { CELO_TERMS_LINK } from 'src/config'
import { Namespaces, withTranslation } from 'src/i18n'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { navigateToURI } from 'src/utils/linking'

const MARGIN = 24

interface StateProps {
  pincodeType: PincodeType
}

function mapStateToProps(state: RootState): StateProps {
  return { pincodeType: state.account.pincodeType }
}

interface DispatchProps {
  acceptTerms: typeof acceptTerms
}

const mapDispatchToProps: DispatchProps = {
  acceptTerms,
}

type Props = WithTranslation & DispatchProps & StateProps

export class RegulatoryTerms extends React.Component<Props> {
  static navigationOptions = nuxNavigationOptions

  onPressAccept = () => {
    this.props.acceptTerms()
    this.goToNextScreen()
  }

  goToNextScreen = () => {
    if (this.props.pincodeType === PincodeType.Unset) {
      navigate(Screens.PincodeSet)
    } else {
      navigate(Screens.EnterInviteCode)
    }
  }

  onPressGoToTerms = () => {
    navigateToURI(CELO_TERMS_LINK)
  }

  render() {
    const { t } = this.props

    return (
      <SafeAreaView style={styles.container}>
        <DevSkipButton nextScreen={Screens.PincodeSet} />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          testID="scrollView"
        >
          <Text style={styles.header}>{t('terms.heading1')}</Text>
          <Text style={styles.disclaimer}>
            <Trans ns={Namespaces.nuxNamePin1} i18nKey={'terms.privacy'}>
              <Text onPress={this.onPressGoToTerms} style={styles.disclaimerLink}>
                celo.org/terms
              </Text>
            </Trans>
          </Text>
          <Text style={styles.header}>{t('terms.heading2')}</Text>
          <Text style={styles.disclaimer}>{t('terms.goldDisclaimer')}</Text>
        </ScrollView>
        <SafeAreaInsetsContext.Consumer>
          {(insets) => (
            <Button
              style={[styles.button, insets && insets.bottom <= MARGIN && { marginBottom: MARGIN }]}
              type={BtnTypes.ONBOARDING}
              size={BtnSizes.FULL}
              text={t('global:accept')}
              onPress={this.onPressAccept}
              testID={'AcceptTermsButton'}
            />
          )}
        </SafeAreaInsetsContext.Consumer>
      </SafeAreaView>
    )
  }
}

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation<Props>(Namespaces.nuxNamePin1)(RegulatoryTerms))

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    marginTop: 40,
  },
  scrollContent: {
    paddingTop: 40,
    paddingHorizontal: MARGIN,
  },
  terms: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  header: {
    ...fontStyles.h2,
    marginBottom: 10,
  },
  disclaimer: {
    ...fontStyles.small,
    marginBottom: 15,
  },
  disclaimerLink: {
    textDecorationLine: 'underline',
  },
  button: {
    marginTop: MARGIN,
    marginHorizontal: MARGIN,
  },
})
