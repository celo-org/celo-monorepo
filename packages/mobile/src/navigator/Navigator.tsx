import colors from '@celo/react-components/styles/colors'
import { Platform } from 'react-native'
import { createSwitchNavigator } from 'react-navigation'
import { createStackNavigator } from 'react-navigation-stack'
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

export const commonScreens = {
  [Screens.PincodeEnter]: { screen: PincodeEnter },
  [Screens.ErrorScreen]: { screen: ErrorScreen },
  [Screens.UpgradeScreen]: { screen: UpgradeScreen },
  [Screens.DappKitAccountAuth]: { screen: DappKitAccountScreen },
  [Screens.DappKitSignTxScreen]: { screen: DappKitSignTxScreen },
  [Screens.DappKitTxDataScreen]: { screen: DappKitTxDataScreen },
  [Screens.Debug]: { screen: Debug },
  [Screens.DataSaver]: { screen: DataSaver },
}

const verificationScreens = {
  [Screens.VerificationEducationScreen]: { screen: VerificationEducationScreen },
  [Screens.VerificationLearnMoreScreen]: { screen: VerificationLearnMoreScreen },
  [Screens.VerificationLoadingScreen]: { screen: VerificationLoadingScreen },
  [Screens.VerificationInterstitialScreen]: { screen: VerificationInterstitialScreen },
  [Screens.VerificationInputScreen]: { screen: VerificationInputScreen },
  [Screens.VerificationSuccessScreen]: { screen: VerificationSuccessScreen },
}

const NuxStack = createStackNavigator(
  {
    [Screens.Language]: { screen: Language },
    [Screens.JoinCelo]: { screen: JoinCelo },
    [Screens.RegulatoryTerms]: { screen: RegulatoryTerms },
    [Screens.PincodeEducation]: { screen: PincodeEducation },
    [Screens.PincodeSet]: { screen: PincodeSet },
    [Screens.EnterInviteCode]: { screen: EnterInviteCode },
    [Screens.ImportWallet]: { screen: ImportWallet },
    [Screens.ImportWalletSocial]: { screen: ImportWalletSocial },
    [Screens.ImportWalletEmpty]: { screen: ImportWalletEmpty },
    ...verificationScreens,
    ...commonScreens,
  },
  {
    navigationOptions: {
      header: null,
    },
    ...headerArea,
    initialRouteName: Screens.Language,
  }
)

const SendStack = createStackNavigator(
  {
    [Screens.Send]: { screen: Send },
    ...verificationScreens,
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

const IncomingRequestStack = createStackNavigator(
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

const OutgoingRequestStack = createStackNavigator(
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

const EscrowStack = createStackNavigator(
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
    ...verificationScreens,
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
    ...commonScreens,
  },
  {
    ...headerArea,
    initialRouteName: Screens.TabNavigator,
  }
)

const AppNavigator = createSwitchNavigator(
  {
    [Screens.AppLoading]: AppLoading,
    [Stacks.NuxStack]: NuxStack,
    [Stacks.AppStack]: AppStack,
  },
  {
    initialRouteName: Screens.AppLoading,
  }
)

export default AppNavigator
