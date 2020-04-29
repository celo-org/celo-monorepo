import Button, { BtnTypes } from '@celo/react-components/components/Button'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { Trans, WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import { acceptTerms } from 'src/account/actions'
import { PincodeType } from 'src/account/reducer'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import DevSkipButton from 'src/components/DevSkipButton'
import { CELO_TERMS_LINK } from 'src/config'
import { Namespaces, withTranslation } from 'src/i18n'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { navigateToURI } from 'src/utils/linking'

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
      navigate(Screens.PincodeEducation)
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
        <DevSkipButton nextScreen={Screens.PincodeEducation} />
        <ScrollView contentContainerStyle={styles.scrollContainer} testID="scrollView">
          <View style={styles.terms}>
            <Text style={fontStyles.h1} testID="Terms">
              {t('terms.title')}
            </Text>
            <Text style={styles.header}>{t('terms.heading1')}</Text>
            <Text style={styles.disclaimer}>
              <Trans ns={Namespaces.nuxNamePin1} i18nKey={'terms.privacy'}>
                <Text onPress={this.onPressGoToTerms} style={styles.disclamerLink}>
                  celo.org/terms
                </Text>
              </Trans>
            </Text>
            <Text style={styles.header}>{t('terms.heading2')}</Text>
            <Text style={styles.disclaimer}>{t('terms.goldDisclaimer')}</Text>
          </View>
        </ScrollView>
        <Button
          standard={false}
          type={BtnTypes.PRIMARY}
          text={t('global:accept')}
          onPress={this.onPressAccept}
          testID={'AcceptTermsButton'}
        />
      </SafeAreaView>
    )
  }
}

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    mapDispatchToProps
  )(withTranslation(Namespaces.nuxNamePin1)(RegulatoryTerms))
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    minHeight: '100%',
    justifyContent: 'space-between',
  },
  terms: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  header: {
    ...fontStyles.body,
    ...fontStyles.semiBold,
    marginBottom: 10,
  },
  disclaimer: {
    ...fontStyles.body,
    marginBottom: 15,
  },
  disclamerLink: {
    ...fontStyles.body,
    textDecorationLine: 'underline',
  },
})
