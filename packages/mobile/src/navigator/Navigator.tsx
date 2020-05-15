import colors from '@celo/react-components/styles/colors'
import { RouteProp } from '@react-navigation/core'
import { createStackNavigator } from '@react-navigation/stack'
import * as React from 'react'
import { Platform } from 'react-native'
import SplashScreen from 'react-native-splash-screen'
import { useSelector } from 'react-redux'
import Account from 'src/account/Account'
import Analytics from 'src/account/Analytics'
import DataSaver from 'src/account/DataSaver'
import DollarEducation from 'src/account/DollarEducation'
import EditProfile from 'src/account/EditProfile'
import FiatExchange from 'src/account/FiatExchange'
import GoldEducation from 'src/account/GoldEducation'
import Invite from 'src/account/Invite'
import InviteReview from 'src/account/InviteReview'
import Licenses from 'src/account/Licenses'
import PhotosEducation from 'src/account/PhotosEducation'
import Profile from 'src/account/Profile'
import { PincodeType } from 'src/account/reducer'
import Security from 'src/account/Security'
import Support from 'src/account/Support'
import SupportContact from 'src/account/SupportContact'
import AppLoading from 'src/app/AppLoading'
import Debug from 'src/app/Debug'
import ErrorScreen from 'src/app/ErrorScreen'
import { getAppLocked } from 'src/app/selectors'
import UpgradeScreen from 'src/app/UpgradeScreen'
import BackupComplete from 'src/backup/BackupComplete'
import BackupIntroduction from 'src/backup/BackupIntroduction'
import BackupPhrase from 'src/backup/BackupPhrase'
import BackupQuiz from 'src/backup/BackupQuiz'
import BackupSocial from 'src/backup/BackupSocial'
import BackupSocialIntro from 'src/backup/BackupSocialIntro'
import DappKitAccountScreen from 'src/dappkit/DappKitAccountScreen'
import DappKitSignTxScreen from 'src/dappkit/DappKitSignTxScreen'
import DappKitTxDataScreen from 'src/dappkit/DappKitTxDataScreen'
import EscrowedPaymentListScreen from 'src/escrow/EscrowedPaymentListScreen'
import ReclaimPaymentConfirmationScreen from 'src/escrow/ReclaimPaymentConfirmationScreen'
import ExchangeReview from 'src/exchange/ExchangeReview'
import ExchangeTradeScreen from 'src/exchange/ExchangeTradeScreen'
import FeeExchangeEducation from 'src/exchange/FeeExchangeEducation'
import ImportWallet from 'src/import/ImportWallet'
import ImportWalletEmpty from 'src/import/ImportWalletEmpty'
import ImportWalletSocial from 'src/import/ImportWalletSocial'
import EnterInviteCode from 'src/invite/EnterInviteCode'
import Language from 'src/language/Language'
import SelectLocalCurrency from 'src/localCurrency/SelectLocalCurrency'
import { exchangeHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import TabNavigator from 'src/navigator/TabNavigator'
import { StackParamList } from 'src/navigator/types'
import IncomingPaymentRequestListScreen from 'src/paymentRequest/IncomingPaymentRequestListScreen'
import OutgoingPaymentRequestListScreen from 'src/paymentRequest/OutgoingPaymentRequestListScreen'
import PaymentRequestConfirmation from 'src/paymentRequest/PaymentRequestConfirmation'
import PincodeEducation from 'src/pincode/PincodeEducation'
import PincodeEnter from 'src/pincode/PincodeEnter'
import PincodeSet from 'src/pincode/PincodeSet'
import QRCode from 'src/qrcode/QRCode'
import QRScanner from 'src/qrcode/QRScanner'
import { RootState } from 'src/redux/reducers'
import { store } from 'src/redux/store'
import JoinCelo from 'src/registration/JoinCelo'
import RegulatoryTerms from 'src/registration/RegulatoryTerms'
import FeeEducation from 'src/send/FeeEducation'
import Send from 'src/send/Send'
import SendAmount from 'src/send/SendAmount'
import SendConfirmation from 'src/send/SendConfirmation'
import SetClock from 'src/set-clock/SetClock'
import TransactionReview from 'src/transactions/TransactionReview'
import VerificationEducationScreen from 'src/verify/VerificationEducationScreen'
import VerificationInputScreen from 'src/verify/VerificationInputScreen'
import VerificationInterstitialScreen from 'src/verify/VerificationInterstitialScreen'
import VerificationLearnMoreScreen from 'src/verify/VerificationLearnMoreScreen'
import VerificationLoadingScreen from 'src/verify/VerificationLoadingScreen'
import VerificationSuccessScreen from 'src/verify/VerificationSuccessScreen'

const Stack = createStackNavigator<StackParamList>()

export const headerArea = {
  // Force this for now on iOS so screen transitions look normal
  // given we intentionally hide the bottom separator from the nav bar
  headerMode: 'screen',
  defaultNavigationOptions: {
    cardStyle: { backgroundColor: colors.background },
    headerStyle: {
      ...Platform.select({
        android: {
          elevation: 0,
        },
        ios: {
          borderBottomWidth: 0,
          borderBottomColor: 'transparent',
          shadowOffset: {
            height: 0,
          },
        },
      }),
    },
  },
}

const commonScreens = (Navigator: typeof Stack) => {
  return (
    <>
      <Navigator.Screen name={Screens.Language} component={Language} />
      <Navigator.Screen name={Screens.PincodeEnter} component={PincodeEnter} />
      <Navigator.Screen name={Screens.ErrorScreen} component={ErrorScreen} />
      <Navigator.Screen name={Screens.UpgradeScreen} component={UpgradeScreen} />
      <Navigator.Screen name={Screens.DappKitAccountAuth} component={DappKitAccountScreen} />
      <Navigator.Screen name={Screens.DappKitSignTxScreen} component={DappKitSignTxScreen} />
      <Navigator.Screen name={Screens.DappKitTxDataScreen} component={DappKitTxDataScreen} />
      <Navigator.Screen name={Screens.Debug} component={Debug} />
      <Navigator.Screen name={Screens.DataSaver} component={DataSaver} />
    </>
  )
}

const verificationScreens = (Navigator: typeof Stack) => {
  return (
    <>
      <Navigator.Screen
        name={Screens.VerificationEducationScreen}
        component={VerificationEducationScreen}
      />
      <Navigator.Screen
        name={Screens.VerificationLearnMoreScreen}
        component={VerificationLearnMoreScreen}
      />
      <Navigator.Screen
        name={Screens.VerificationLoadingScreen}
        component={VerificationLoadingScreen}
      />
      <Navigator.Screen
        name={Screens.VerificationInterstitialScreen}
        component={VerificationInterstitialScreen}
      />
      <Navigator.Screen
        name={Screens.VerificationInputScreen}
        component={VerificationInputScreen}
      />
      <Navigator.Screen
        name={Screens.VerificationSuccessScreen}
        component={VerificationSuccessScreen}
      />
    </>
  )
}

const nuxScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen name={Screens.JoinCelo} component={JoinCelo} />
    <Navigator.Screen name={Screens.RegulatoryTerms} component={RegulatoryTerms} />
    <Navigator.Screen name={Screens.PincodeEducation} component={PincodeEducation} />
    <Navigator.Screen name={Screens.PincodeSet} component={PincodeSet} />
    <Navigator.Screen name={Screens.EnterInviteCode} component={EnterInviteCode} />
    <Navigator.Screen name={Screens.ImportWallet} component={ImportWallet} />
    <Navigator.Screen name={Screens.ImportWalletSocial} component={ImportWalletSocial} />
    <Navigator.Screen name={Screens.ImportWalletEmpty} component={ImportWalletEmpty} />
  </>
)

const sendScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen name={Screens.Send} component={Send} />
    <Navigator.Screen name={Screens.QRScanner} component={QRScanner} />
    <Navigator.Screen name={Screens.QRCode} component={QRCode} />
    <Navigator.Screen name={Screens.SendAmount} component={SendAmount} />
    <Navigator.Screen name={Screens.SendConfirmation} component={SendConfirmation} />
    <Navigator.Screen
      name={Screens.PaymentRequestConfirmation}
      component={PaymentRequestConfirmation}
    />
    <Navigator.Screen
      name={Screens.IncomingPaymentRequestListScreen}
      component={IncomingPaymentRequestListScreen}
    />
    <Navigator.Screen
      name={Screens.OutgoingPaymentRequestListScreen}
      component={OutgoingPaymentRequestListScreen}
    />
    <Navigator.Screen
      name={Screens.EscrowedPaymentListScreen}
      component={EscrowedPaymentListScreen}
    />
    <Navigator.Screen
      name={Screens.ReclaimPaymentConfirmationScreen}
      component={ReclaimPaymentConfirmationScreen}
    />
  </>
)

const exchangeTradeOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.ExchangeTradeScreen>
}) => exchangeHeader(route.params.makerTokenDisplay.makerToken)
const exchangeReviewOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.ExchangeReview>
}) => exchangeHeader(route.params.exchangeInput.makerToken)

const exchangeScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen
      name={Screens.ExchangeTradeScreen}
      component={ExchangeTradeScreen}
      options={exchangeTradeOptions}
    />
    <Navigator.Screen
      name={Screens.ExchangeReview}
      component={ExchangeReview}
      options={exchangeReviewOptions}
    />
    <Navigator.Screen name={Screens.FeeExchangeEducation} component={FeeExchangeEducation} />
  </>
)

const backupScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen name={Screens.BackupIntroduction} component={BackupIntroduction} />
    <Navigator.Screen name={Screens.BackupPhrase} component={BackupPhrase} />
    <Navigator.Screen name={Screens.BackupQuiz} component={BackupQuiz} />
    <Navigator.Screen name={Screens.BackupSocialIntro} component={BackupSocialIntro} />
    <Navigator.Screen name={Screens.BackupSocial} component={BackupSocial} />
    <Navigator.Screen name={Screens.BackupComplete} component={BackupComplete} />
  </>
)

const settingsScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen name={Screens.Account} component={Account} />
    <Navigator.Screen name={Screens.Security} component={Security} />
    <Navigator.Screen name={Screens.Analytics} component={Analytics} />
    <Navigator.Screen name={Screens.EditProfile} component={EditProfile} />
    <Navigator.Screen name={Screens.Profile} component={Profile} />
    <Navigator.Screen name={Screens.Invite} component={Invite} />
    <Navigator.Screen name={Screens.InviteReview} component={InviteReview} />
    <Navigator.Screen name={Screens.SelectLocalCurrency} component={SelectLocalCurrency} />
    <Navigator.Screen name={Screens.Licenses} component={Licenses} />
    <Navigator.Screen name={Screens.Support} component={Support} />
    <Navigator.Screen name={Screens.SupportContact} component={SupportContact} />
    <Navigator.Screen name={Screens.FiatExchange} component={FiatExchange} />
  </>
)

const generalScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen name={Screens.SetClock} component={SetClock} />
    <Navigator.Screen name={Screens.DollarEducation} component={DollarEducation} />
    <Navigator.Screen name={Screens.TransactionReview} component={TransactionReview} />
    <Navigator.Screen name={Screens.PhotosEducation} component={PhotosEducation} />
    <Navigator.Screen name={Screens.GoldEducation} component={GoldEducation} />
    <Navigator.Screen name={Screens.FeeEducation} component={FeeEducation} />
  </>
)

const mapStateToProps = (state: RootState) => {
  return {
    language: state.app.language,
    e164Number: state.account.e164PhoneNumber,
    pincodeType: state.account.pincodeType,
    redeemComplete: state.invite.redeemComplete,
    account: state.web3.account,
    hasSeenVerificationNux: state.identity.hasSeenVerificationNux,
    acceptedTerms: state.account.acceptedTerms,
  }
}

export function AppNavigatorNew() {
  const [initialRouteName, setInitialRoute] = React.useState<Screens | undefined>(undefined)
  React.useEffect(() => {
    const {
      language,
      e164Number,
      pincodeType,
      redeemComplete,
      account,
      hasSeenVerificationNux,
      acceptedTerms,
    } = mapStateToProps(store.getState())

    let initialRoute: Screens | undefined

    if (!language) {
      initialRoute = Screens.Language
    } else if (!e164Number) {
      initialRoute = Screens.JoinCelo
    } else if (!acceptedTerms) {
      initialRoute = Screens.RegulatoryTerms
    } else if (pincodeType === PincodeType.Unset) {
      initialRoute = Screens.PincodeEducation
    } else if (!redeemComplete && !account) {
      initialRoute = Screens.EnterInviteCode
    } else if (!hasSeenVerificationNux) {
      initialRoute = Screens.VerificationEducationScreen
    } else {
      initialRoute = Screens.TabNavigator
    }

    setInitialRoute(initialRoute)

    SplashScreen.hide()
  })
  const appLocked = useSelector(getAppLocked)

  if (!initialRouteName) {
    return <AppLoading />
  }

  return (
    <Stack.Navigator
      headerMode={'none'}
      // @ts-ignore
      initialRouteName={initialRouteName}
    >
      <Stack.Screen name={Screens.TabNavigator} component={TabNavigator} />
      {commonScreens(Stack)}
      {sendScreens(Stack)}
      {nuxScreens(Stack)}
      {verificationScreens(Stack)}
      {exchangeScreens(Stack)}
      {backupScreens(Stack)}
      {settingsScreens(Stack)}
      {generalScreens(Stack)}
    </Stack.Navigator>
  )
}

export default AppNavigatorNew
