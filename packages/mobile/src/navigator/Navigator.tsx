import { Platform } from 'react-native'
import { createStackNavigator, createSwitchNavigator, StackNavigatorConfig } from 'react-navigation'
import Account from 'src/account/Account'
import Analytics from 'src/account/Analytics'
import CeloLite from 'src/account/CeloLite'
import DollarEducation from 'src/account/DollarEducation'
import EditProfile from 'src/account/EditProfile'
import GoldEducation from 'src/account/GoldEducation'
import Invite from 'src/account/Invite'
import InviteReview from 'src/account/InviteReview'
import Licenses from 'src/account/Licenses'
import PhotosEducation from 'src/account/PhotosEducation'
import Profile from 'src/account/Profile'
import AppLoading from 'src/app/AppLoading'
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
import ReclaimPaymentConfirmationScreen from 'src/escrow/ReclaimPaymentConfirmationScreen'
import ExchangeReview from 'src/exchange/ExchangeReview'
import ExchangeTradeScreen from 'src/exchange/ExchangeTradeScreen'
import FeeExchangeEducation from 'src/exchange/FeeExchangeEducation'
import ImportContacts from 'src/import/ImportContacts'
import ImportWallet from 'src/import/ImportWallet'
import ImportWalletEmpty from 'src/import/ImportWalletEmpty'
import ImportWalletSocial from 'src/import/ImportWalletSocial'
import EnterInviteCode from 'src/invite/EnterInviteCode'
import JoinCelo from 'src/invite/JoinCelo'
import Language from 'src/language/Language'
import SelectLocalCurrency from 'src/localCurrency/SelectLocalCurrency'
import { Screens, Stacks } from 'src/navigator/Screens'
import TabNavigator from 'src/navigator/TabNavigator'
import PaymentRequestConfirmation from 'src/paymentRequest/PaymentRequestConfirmation'
import PaymentRequestListScreen from 'src/paymentRequest/PaymentRequestListScreen'
import PincodeConfirmation from 'src/pincode/PincodeConfirmation'
import PincodeEducation from 'src/pincode/PincodeEducation'
import PincodeSet from 'src/pincode/PincodeSet'
import QRCode from 'src/qrcode/QRCode'
import QRScanner from 'src/qrcode/QRScanner'
import FeeEducation from 'src/send/FeeEducation'
import Send from 'src/send/Send'
import SendAmount from 'src/send/SendAmount'
import SendConfirmation from 'src/send/SendConfirmation'
import SetClock from 'src/set-clock/SetClock'
import TransactionReviewScreen from 'src/transactions/TransactionReviewScreen'
import VerifyInput from 'src/verify/Input'
import VerifyVerified from 'src/verify/Verified'
import VerifyVerifying from 'src/verify/Verifying'
import VerifyEducation from 'src/verify/VerifyPhoneEducation'

export const headerArea: StackNavigatorConfig = {
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

export const commonScreens = {
  [Screens.PincodeConfirmation]: { screen: PincodeConfirmation },
  [Screens.ErrorScreen]: { screen: ErrorScreen },
  [Screens.UpgradeScreen]: { screen: UpgradeScreen },
  [Screens.DappKitAccountAuth]: { screen: DappKitAccountScreen },
  [Screens.DappKitSignTxScreen]: { screen: DappKitSignTxScreen },
  [Screens.DappKitTxDataScreen]: { screen: DappKitTxDataScreen },
  [Screens.Debug]: { screen: Debug },
}

const NuxStack = createStackNavigator(
  {
    [Screens.Language]: { screen: Language },
    [Screens.JoinCelo]: { screen: JoinCelo },
    [Screens.PincodeEducation]: { screen: PincodeEducation },
    [Screens.PincodeSet]: { screen: PincodeSet },
    [Screens.EnterInviteCode]: { screen: EnterInviteCode },
    [Screens.ImportWallet]: { screen: ImportWallet },
    [Screens.ImportWalletSocial]: { screen: ImportWalletSocial },
    [Screens.ImportWalletEmpty]: { screen: ImportWalletEmpty },
    [Screens.ImportContacts]: { screen: ImportContacts },
    [Screens.VerifyEducation]: { screen: VerifyEducation },
    [Screens.VerifyInput]: { screen: VerifyInput },
    [Screens.VerifyVerifying]: { screen: VerifyVerifying },
    [Screens.VerifyVerified]: { screen: VerifyVerified },
    ...commonScreens,
  },
  {
    ...headerArea,
    initialRouteName: Screens.Language,
  }
)

const SendStack = createStackNavigator(
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

const QRSendStack = createStackNavigator(
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

const ExchangeStack = createStackNavigator(
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

const RequestStack = createStackNavigator(
  {
    [Screens.PaymentRequestListScreen]: { screen: PaymentRequestListScreen },
    [Screens.SendConfirmation]: { screen: SendConfirmation },
  },
  {
    navigationOptions: {
      header: null,
    },
    ...headerArea,
    initialRouteName: Screens.PaymentRequestListScreen,
  }
)

const BackupStack = createStackNavigator(
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

const SettingsStack = createStackNavigator(
  {
    [Screens.Account]: { screen: Account },
    [Stacks.BackupStack]: { screen: BackupStack },
    [Screens.Language]: { screen: Language },
    [Screens.Analytics]: { screen: Analytics },
    [Screens.CeloLite]: { screen: CeloLite },
    [Screens.EditProfile]: { screen: EditProfile },
    [Screens.Profile]: { screen: Profile },
    [Screens.Invite]: { screen: Invite },
    [Screens.InviteReview]: { screen: InviteReview },
    [Screens.SelectLocalCurrency]: { screen: SelectLocalCurrency },
    [Screens.Licenses]: { screen: Licenses },
  },
  {
    navigationOptions: {
      header: null,
    },
    ...headerArea,
    initialRouteName: Screens.Account,
  }
)

const AppStack = createStackNavigator(
  {
    // Note, WalletHome isn't in this stack because it's part of the tab navigator
    [Screens.TabNavigator]: { screen: TabNavigator },
    [Stacks.SendStack]: { screen: SendStack },
    [Stacks.QRSendStack]: { screen: QRSendStack },
    [Stacks.ExchangeStack]: { screen: ExchangeStack },
    [Stacks.RequestStack]: { screen: RequestStack },
    [Stacks.SettingsStack]: { screen: SettingsStack },
    [Screens.SetClock]: { screen: SetClock },
    [Screens.DollarEducation]: { screen: DollarEducation },
    [Screens.TransactionReview]: { screen: TransactionReviewScreen },
    [Screens.PhotosEducation]: { screen: PhotosEducation },
    [Screens.GoldEducation]: { screen: GoldEducation },
    [Screens.PaymentRequestListScreen]: { screen: PaymentRequestListScreen },
    [Screens.ReclaimPaymentConfirmationScreen]: { screen: ReclaimPaymentConfirmationScreen },
    [Screens.FeeEducation]: { screen: FeeEducation },
    ...commonScreens,
  },
  {
    ...headerArea,
    initialRouteName: Screens.TabNavigator,
  }
)

const AppNavigator = createSwitchNavigator(
  {
    AppLoading,
    [Stacks.NuxStack]: NuxStack,
    [Stacks.AppStack]: AppStack,
  },
  {
    initialRouteName: 'AppLoading',
  }
)

export default AppNavigator
