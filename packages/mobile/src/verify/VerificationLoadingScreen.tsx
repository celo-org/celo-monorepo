import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import { errorSelector } from 'src/alert/reducer'
import componentWithAnalytics from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import CancelButton from 'src/components/CancelButton'
import Carousel, { CarouselItem } from 'src/components/Carousel'
import DevSkipButton from 'src/components/DevSkipButton'
import { Namespaces } from 'src/i18n'
import LoadingSpinner from 'src/icons/LoadingSpinner'
import NuxLogo from 'src/icons/NuxLogo'
import {
  cancelVerification,
  receiveAttestationMessage,
  startVerification,
} from 'src/identity/actions'
import { AttestationCode } from 'src/identity/verification'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { currentAccountSelector } from 'src/web3/selectors'

interface StateProps {
  numberVerified: boolean
  e164Number: string
  account: string | null
  attestationCodes: AttestationCode[]
  numCompleteAttestations: number
  verificationFailed: boolean
  underlyingError: ErrorMessages | null | undefined
}

interface DispatchProps {
  startVerification: typeof startVerification
  cancelVerification: typeof cancelVerification
  receiveVerificationMessage: typeof receiveAttestationMessage
  showError: typeof showError
  hideAlert: typeof hideAlert
}

type Props = StateProps & DispatchProps & WithNamespaces

const mapDispatchToProps = {
  startVerification,
  cancelVerification,
  receiveVerificationMessage: receiveAttestationMessage,
  showError,
  hideAlert,
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    numberVerified: state.app.numberVerified,
    e164Number: state.account.e164PhoneNumber,
    attestationCodes: state.identity.attestationCodes,
    numCompleteAttestations: state.identity.numCompleteAttestations,
    verificationFailed: state.identity.verificationFailed,
    account: currentAccountSelector(state),
    underlyingError: errorSelector(state),
  }
}

class VerificationLoadingScreen extends React.Component<Props> {
  static navigationOptions = { header: null }

  onCancel = () => {
    // TODO
  }

  render() {
    const { verificationFailed, e164Number, t } = this.props

    const items: CarouselItem[] = [
      {
        icon: <NuxLogo />,
        text: t('loading.card1'),
      },
      {
        icon: <NuxLogo />,
        text: t('loading.card2'),
      },
      {
        icon: <NuxLogo />,
        text: t('loading.card3'),
      },
    ]
    return (
      <SafeAreaView style={styles.container}>
        {!verificationFailed && (
          <View style={styles.buttonCancelContainer}>
            <CancelButton onCancel={this.onCancel} />
          </View>
        )}
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <DevSkipButton nextScreen={Screens.WalletHome} />
          <View style={styles.statusContainer}>
            <LoadingSpinner />
            <Text style={styles.textPhoneNumber}>
              {t('loading.verifyingNumber', { number: e164Number })}
            </Text>
            <Text style={styles.textOpenTip}>{t('loading.keepOpen')}</Text>
          </View>
          <Carousel containerStyle={styles.carouselContainer} items={items} />
        </ScrollView>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundDarker,
  },
  scrollContainer: {
    flex: 1,
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonCancelContainer: {
    position: 'absolute',
    top: 5,
    left: 0,
    zIndex: 10,
  },
  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textPhoneNumber: {
    ...fontStyles.body,
    ...fontStyles.semiBold,
    marginTop: 20,
  },
  textOpenTip: {
    ...fontStyles.body,
    marginTop: 5,
  },

  carouselContainer: {
    marginVertical: 20,
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    mapDispatchToProps
  )(withNamespaces(Namespaces.nuxVerification2)(VerificationLoadingScreen))
)
