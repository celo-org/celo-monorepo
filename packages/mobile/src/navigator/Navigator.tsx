import { createStackNavigator } from '@react-navigation/stack'
import * as React from 'react'
import { Platform } from 'react-native'
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
import Security from 'src/account/Security'
import Support from 'src/account/Support'
import SupportContact from 'src/account/SupportContact'
import Debug from 'src/app/Debug'
import ErrorScreen from 'src/app/ErrorScreen'
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
import { Screens, Stacks } from 'src/navigator/Screens'
import TabNavigator from 'src/navigator/TabNavigator'
import IncomingPaymentRequestListScreen from 'src/paymentRequest/IncomingPaymentRequestListScreen'
import OutgoingPaymentRequestListScreen from 'src/paymentRequest/OutgoingPaymentRequestListScreen'
import PaymentRequestConfirmation from 'src/paymentRequest/PaymentRequestConfirmation'
import PincodeEducation from 'src/pincode/PincodeEducation'
import PincodeEnter from 'src/pincode/PincodeEnter'
import PincodeSet from 'src/pincode/PincodeSet'
import QRCode from 'src/qrcode/QRCode'
import QRScanner from 'src/qrcode/QRScanner'
import JoinCelo from 'src/registration/JoinCelo'
import RegulatoryTerms from 'src/registration/RegulatoryTerms'
import FeeEducation from 'src/send/FeeEducation'
import Send from 'src/send/Send'
import SendAmount from 'src/send/SendAmount'
import SendConfirmation from 'src/send/SendConfirmation'
import SetClock from 'src/set-clock/SetClock'
import TransactionReviewScreen from 'src/transactions/TransactionReviewScreen'
import VerificationEducationScreen from 'src/verify/VerificationEducationScreen'
import VerificationInputScreen from 'src/verify/VerificationInputScreen'
import VerificationInterstitialScreen from 'src/verify/VerificationInterstitialScreen'
import VerificationLearnMoreScreen from 'src/verify/VerificationLearnMoreScreen'
import VerificationLoadingScreen from 'src/verify/VerificationLoadingScreen'
import VerificationSuccessScreen from 'src/verify/VerificationSuccessScreen'

const Stack = createStackNavigator()

export const headerArea = {
  // Force this for now on iOS so screen transitions look normal
  // given we intentionally hide the bottom separator from the nav bar
  headerMode: 'screen',
  defaultNavigationOptions: {
    headerStyle: {
      ...Platform.select({
        android: {
          elevation: 0,
        },
        ios: {
          borderBottomWidth: 0,
          borderBottomColor: 'transparent',
        },
      }),
    },
  },
}

const createStackNavigatorStub = (...args) => {
  console.log(args)
}

const commonScreens = (Navigator: typeof Stack) => {
  return (
    <>
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
    <Navigator.Screen name={Screens.Language} component={Language} />
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
    <Navigator.Screen name={Screens.SendAmount} component={SendAmount} />
    <Navigator.Screen name={Screens.SendConfirmation} component={SendConfirmation} />
  </>
)

const SendStack = createStackNavigatorStub(
  {
    [Screens.Send]: { screen: Send },
    [Screens.QRScanner]: { screen: QRScanner },
    [Screens.SendAmount]: { screen: SendAmount },
    [Screens.SendConfirmation]: { screen: SendConfirmation },
    [Screens.PaymentRequestConfirmation]: { screen: PaymentRequestConfirmation },
  },
  {
    navigationOptions: {
      header: null,
    },
    ...headerArea,
    initialRouteName: Screens.Send,
  }
)

const QRSendStack = createStackNavigatorStub(
  {
    [Screens.QRCode]: { screen: QRCode },
    [Screens.QRScanner]: { screen: QRScanner },
    [Screens.SendAmount]: { screen: SendAmount },
    [Screens.SendConfirmation]: { screen: SendConfirmation },
    [Screens.PaymentRequestConfirmation]: { screen: PaymentRequestConfirmation },
  },
  {
    navigationOptions: {
      header: null,
    },
    ...headerArea,
    initialRouteName: Screens.QRCode,
  }
)

const ExchangeStack = createStackNavigatorStub(
  {
    // Note, ExchangeHomeScreen isn't in this stack because it's part of the tab navigator
    [Screens.ExchangeTradeScreen]: { screen: ExchangeTradeScreen },
    [Screens.ExchangeReview]: { screen: ExchangeReview },
    [Screens.FeeExchangeEducation]: { screen: FeeExchangeEducation },
  },
  {
    navigationOptions: {
      header: null,
    },
    ...headerArea,
    initialRouteName: Screens.ExchangeTradeScreen,
  }
)

const IncomingRequestStack = createStackNavigatorStub(
  {
    [Screens.IncomingPaymentRequestListScreen]: { screen: IncomingPaymentRequestListScreen },
    [Screens.SendConfirmation]: { screen: SendConfirmation },
  },
  {
    navigationOptions: {
      header: null,
    },
    ...headerArea,
    initialRouteName: Screens.IncomingPaymentRequestListScreen,
  }
)

const OutgoingRequestStack = createStackNavigatorStub(
  {
    [Screens.OutgoingPaymentRequestListScreen]: { screen: OutgoingPaymentRequestListScreen },
  },
  {
    navigationOptions: {
      header: null,
    },
    ...headerArea,
    initialRouteName: Screens.OutgoingPaymentRequestListScreen,
  }
)

const EscrowStack = createStackNavigatorStub(
  {
    [Screens.EscrowedPaymentListScreen]: { screen: EscrowedPaymentListScreen },
    [Screens.ReclaimPaymentConfirmationScreen]: {
      screen: ReclaimPaymentConfirmationScreen,
    },
  },
  {
    navigationOptions: {
      header: null,
    },
    ...headerArea,
    initialRouteName: Screens.EscrowedPaymentListScreen,
  }
)

const BackupStack = createStackNavigatorStub(
  {
    [Screens.BackupIntroduction]: { screen: BackupIntroduction },
    [Screens.BackupPhrase]: { screen: BackupPhrase },
    [Screens.BackupQuiz]: { screen: BackupQuiz },
    [Screens.BackupSocialIntro]: { screen: BackupSocialIntro },
    [Screens.BackupSocial]: { screen: BackupSocial },
    [Screens.BackupComplete]: { screen: BackupComplete },
  },
  {
    navigationOptions: {
      header: null,
    },
    ...headerArea,
    initialRouteName: Screens.BackupIntroduction,
  }
)

const SettingsStack = createStackNavigatorStub(
  {
    [Screens.Account]: { screen: Account },
    [Stacks.BackupStack]: { screen: BackupStack },
    [Screens.Language]: { screen: Language },
    [Screens.Security]: { screen: Security },
    [Screens.Analytics]: { screen: Analytics },
    [Screens.DataSaver]: { screen: DataSaver },
    [Screens.EditProfile]: { screen: EditProfile },
    [Screens.Profile]: { screen: Profile },
    [Screens.Invite]: { screen: Invite },
    [Screens.InviteReview]: { screen: InviteReview },
    [Screens.SelectLocalCurrency]: { screen: SelectLocalCurrency },
    [Screens.Licenses]: { screen: Licenses },
    [Screens.Support]: { screen: Support },
    [Screens.SupportContact]: { screen: SupportContact },
    [Screens.FiatExchange]: { screen: FiatExchange },
  },
  {
    navigationOptions: {
      header: null,
    },
    ...headerArea,
    initialRouteName: Screens.Account,
  }
)

const AppStack = createStackNavigatorStub(
  {
    // Note, WalletHome isn't in this stack because it's part of the tab navigator
    // [Screens.TabNavigator]: { screen: TabNavigator },
    [Stacks.SendStack]: { screen: SendStack },
    // Adding this screen, so it possbile to go back to Home screen from it
    [Screens.SendConfirmation]: { screen: SendConfirmation },
    // Adding this screen, so it possbile to go back to Home screen from it
    [Screens.ReclaimPaymentConfirmationScreen]: {
      screen: ReclaimPaymentConfirmationScreen,
    },
    // Adding this stack, so it possbile to go back to Home screen from it
    [Stacks.BackupStack]: { screen: BackupStack },
    [Stacks.QRSendStack]: { screen: QRSendStack },
    [Stacks.ExchangeStack]: { screen: ExchangeStack },
    [Stacks.IncomingRequestStack]: { screen: IncomingRequestStack },
    [Stacks.OutgoingRequestStack]: { screen: OutgoingRequestStack },
    [Stacks.EscrowStack]: { screen: EscrowStack },
    [Stacks.SettingsStack]: { screen: SettingsStack },
    [Screens.SetClock]: { screen: SetClock },
    [Screens.DollarEducation]: { screen: DollarEducation },
    [Screens.TransactionReview]: { screen: TransactionReviewScreen },
    [Screens.PhotosEducation]: { screen: PhotosEducation },
    [Screens.GoldEducation]: { screen: GoldEducation },
    [Screens.FeeEducation]: { screen: FeeEducation },
    [Screens.FeeExchangeEducation]: { screen: FeeExchangeEducation }, // Included so it is possible to go back to Home screen from it
  },
  {
    ...headerArea,
    initialRouteName: Screens.TabNavigator,
  }
)

export function AppNavigatorNew() {
  return (
    <Stack.Navigator headerMode={'none'} initialRouteName={Screens.Language}>
      <Stack.Screen name={Screens.TabNavigator} component={TabNavigator} />
      {commonScreens(Stack)}
      {sendScreens(Stack)}
      {nuxScreens(Stack)}
      {verificationScreens(Stack)}
    </Stack.Navigator>
  )
}

export default AppNavigatorNew
