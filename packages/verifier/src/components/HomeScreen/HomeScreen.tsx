import Avatar from '@celo/react-components/components/Avatar'
import ScrollContainer from '@celo/react-components/components/ScrollContainer'
import Touchable from '@celo/react-components/components/Touchable'
import Settings from '@celo/react-components/icons/Settings'
import { navigate } from '@celo/react-components/services/NavigationService'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import NetInfo from '@react-native-community/netinfo'
import { Namespaces } from 'locales'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { connect } from 'react-redux'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { clearMessage, setAccountAddress, setVerificationState, showMessage } from 'src/app/actions'
import Activity from 'src/components/HomeScreen/Activity'
import Verifying from 'src/components/HomeScreen/Verifying'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { setFcmToken, setIsVerifying } from 'src/services/FirebaseDb'
import VerifierService, { VerifierStatus } from 'src/services/VerifierService'
import logger from 'src/utils/logger'

const SEVEN_DAYS = 604800000 // in milliseconds

interface StateProps {
  name: string
  e164Number: string
  accountAddress: string
  totalEarnings: number
  totalMessages: number
  verifyingOffAt: number | null
  isVerifying: boolean
  countryCode: string
}

interface DispatchProps {
  setAccountAddress: typeof setAccountAddress
  setVerificationState: typeof setVerificationState
  showMessage: typeof showMessage
  clearMessage: typeof clearMessage
}

type Props = StateProps & DispatchProps & WithNamespaces

interface State {
  networkType: string
}

const mapStateToProps = (state: RootState) => ({
  name: state.app.name,
  e164Number: state.app.e164Number,
  accountAddress: state.app.accountAddress,
  totalEarnings: state.app.totalEarnings,
  totalMessages: state.app.totalMessages,
  verifyingOffAt: state.app.verifyingOffAt,
  isVerifying: state.app.isVerifying,
  countryCode: state.app.countryCode,
})

const mapDispatchToProps = {
  setAccountAddress,
  setVerificationState,
  showMessage,
  clearMessage,
}

function isVerifyingDisabledLongTime(verifyingOffAt: StateProps['verifyingOffAt']) {
  if (!verifyingOffAt) {
    return false
  }
  return Date.now() - verifyingOffAt > SEVEN_DAYS
}

function trackVerificationState(isCurrentlyVerifying: boolean) {
  const { verifying_off, verifying_on } = CustomEventNames
  const eventName = isCurrentlyVerifying ? verifying_off : verifying_on
  CeloAnalytics.track(eventName, {})
}

class HomeScreen extends React.Component<Props, State> {
  state = {
    networkType: 'none',
  }

  async componentDidMount() {
    try {
      NetInfo.addEventListener('connectionChange', this.handleNetworkStatusChange)
      if (!this.props.isVerifying && isVerifyingDisabledLongTime(this.props.verifyingOffAt)) {
        setTimeout(() => this.showVerifyingOffLongMessage(), 2000)
      }

      await this.getVerifierStatus()

      /**
       * Note about FCMToken:
       * Because we are getting this from our custom VerifierService, there is no way to subscribe to updates
       * To ensure we keep it up to date, we will retrieve it every time the home page mounts
       * To avoid this, we would need to add the RN Firebase module for messaging and subscribe to its updates
       */
      const fcmToken = await VerifierService.getFCMToken()
      await setFcmToken(fcmToken)
    } catch (err) {
      logger.error('HomeScreen/componentDidMount', err)
    }
  }

  showVerifyingOffLongMessage() {
    this.props.showMessage(
      this.props.t('verifyingOffLong.1'),
      null,
      this.props.t('verifyingOffLong.0')
    )
  }

  componentWillUnmount() {
    NetInfo.removeEventListener('connectionChange', this.handleNetworkStatusChange)
  }

  handleNetworkStatusChange = (reachability: any) => {
    this.setState({ networkType: reachability.type })
  }

  toggleVerifyingService = async () => {
    try {
      const isCurrentlyVerifying = this.props.isVerifying

      // The actual service that receices the verification texts
      VerifierService.toggleVerifierService(!isCurrentlyVerifying)
      // The firebase which lets everyone know we are open for business
      await setIsVerifying(!isCurrentlyVerifying)
      // The Local redux state
      this.props.setVerificationState(!isCurrentlyVerifying)

      // when Turning from On to off, and its the first time (verifyingOffAt never set so null) show message
      if (isCurrentlyVerifying && !this.props.verifyingOffAt) {
        this.showVerifyingOffLongMessage()
      } else {
        this.props.clearMessage()
      }
      trackVerificationState(isCurrentlyVerifying)
    } catch (err) {
      logger.error('HomeScreen/toggleVerifyingService', err)
    }
  }

  getVerifierStatus = async () => {
    try {
      const status = await VerifierService.getVerifierServiceStatus()
      const serviceIsVerifying = status === VerifierStatus.ON

      if (serviceIsVerifying !== this.props.isVerifying) {
        this.props.setVerificationState(serviceIsVerifying)

        logger.info(
          'HomeScreen/getVerifierStatus',
          `getVerifierServiceStatus and store status dont match
                      VerifierService: ${serviceIsVerifying}
                      Store: ${this.props.isVerifying}
                      `
        )
      }
    } catch (e) {
      logger.error('HomeScreen/getVerifierStatus', e)
    }
  }

  goToSettings = () => {
    CeloAnalytics.track(CustomEventNames.profile_view)
    navigate(Screens.Settings)
  }

  render() {
    const state = this.state
    const {
      t,
      name,
      e164Number,
      accountAddress,
      totalEarnings,
      totalMessages,
      isVerifying,
    } = this.props

    const settings = (
      <View style={styles.settingsIconContainer}>
        <Touchable borderless={true} onPress={this.goToSettings} hitSlop={variables.iconHitslop}>
          <Settings color={colors.celoGreen} height={20} width={20} />
        </Touchable>
      </View>
    )

    return (
      <View style={styles.container}>
        <ScrollContainer heading={t('celoRewards')} headerChild={settings}>
          <Avatar
            name={name}
            address={accountAddress}
            e164Number={e164Number}
            defaultCountryCode={this.props.countryCode}
            iconSize={55}
          />
          <View style={[styles.statContainer, !isVerifying ? styles.statContainerInactive : null]}>
            {totalEarnings > 0 && (
              <View style={styles.statItem}>
                <Text style={fontStyles.bodySmall}>{t('totalEarnings')}</Text>
                <Text style={styles.dollar}>${totalEarnings}</Text>
              </View>
            )}
            {totalMessages > 0 && (
              <View style={styles.statItem}>
                <Text style={fontStyles.bodySmall}>{t('totalMessages')}</Text>
                <Text style={styles.message}>{totalMessages}</Text>
              </View>
            )}
          </View>
          <Verifying
            isVerifying={isVerifying}
            networkType={state.networkType}
            toggleVerifyingService={this.toggleVerifyingService}
          />
          <View style={[styles.container, { backgroundColor: colors.celoGreen }]}>
            <Activity isVerifying={isVerifying} accountAddress={accountAddress} />
          </View>
        </ScrollContainer>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  dollar: {
    fontSize: 36,
    color: colors.celoGreen,
  },
  message: {
    fontSize: 36,
    color: colors.darkGrey,
    textAlign: 'right',
  },
  statContainer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statContainerInactive: {
    backgroundColor: colors.inactiveLabelBar,
    borderBottomColor: colors.inactive,
  },
  statItem: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  settingsIconContainer: {
    position: 'absolute',
    right: 5,
    top: 5,
    width: 40,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default withNamespaces(Namespaces.profile)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(HomeScreen)
)
