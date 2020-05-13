import Button, { BtnTypes } from '@celo/react-components/components/Button'
import KeyboardAwareScrollView from '@celo/react-components/components/KeyboardAwareScrollView'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import SearchUser from '@celo/react-components/icons/SearchUser'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { BackHandler, StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { NavigationInjectedProps } from 'react-navigation'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import componentWithAnalytics from 'src/analytics/wrapper'
import { Namespaces, withTranslation } from 'src/i18n'
import LoadingSpinner from 'src/icons/LoadingSpinner'

type Props = WithTranslation & NavigationInjectedProps

class PhoneNumberLookupQuotaScreen extends React.Component<Props> {
  static navigationOptions = { gestureEnabled: false, header: null }

  state = { isSending: false }

  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', this.onSkip)
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.onSkip)
  }

  onSkip = () => {
    CeloAnalytics.track(CustomEventNames.phone_number_quota_purchase_skip)
    this.props.navigation.getParam('onSkip')()
    return true
  }

  onBuy = () => {
    this.setState({ isSending: true })
    CeloAnalytics.track(CustomEventNames.phone_number_quota_purchase_success)
    this.props.navigation.getParam('onBuy')()
  }

  render() {
    const { isSending } = this.state
    const { t } = this.props
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps={'always'}
        >
          <SearchUser width={88} height={100} />
          <Text style={styles.h1}>{t('quotaLookup.title')}</Text>
          <Text style={styles.body}>{t('quotaLookup.body1')}</Text>
          <Text style={styles.body}>{t('quotaLookup.body2')}</Text>
          <View style={styles.spinnerContainer}>{isSending && <LoadingSpinner />}</View>
        </KeyboardAwareScrollView>
        <View>
          <Button
            onPress={this.onBuy}
            disabled={isSending}
            text={t('quotaLookup.cta')}
            standard={false}
            type={BtnTypes.PRIMARY}
            testID="QuotaBuyButton"
          />
          <Button
            onPress={this.onSkip}
            disabled={isSending}
            text={t('global:skip')}
            standard={false}
            type={BtnTypes.SECONDARY}
            testID="QuotaSkipButton"
          />
        </View>
        <KeyboardSpacer />
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  h1: {
    ...fontStyles.h1,
    marginTop: 20,
  },
  body: {
    ...fontStyles.bodyLarge,
    textAlign: 'center',
    marginBottom: 20,
  },
  spinnerContainer: {
    height: 40,
  },
})

export default componentWithAnalytics(
  withTranslation(Namespaces.nuxVerification2)(PhoneNumberLookupQuotaScreen)
)
