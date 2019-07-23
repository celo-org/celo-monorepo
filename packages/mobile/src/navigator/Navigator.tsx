import { createStackNavigator, createSwitchNavigator } from 'react-navigation'
import Account from 'src/account/Account'
import Analytics from 'src/account/Analytics'
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
import Backup from 'src/backup/Backup'
import ReclaimPaymentConfirmationScreen from 'src/escrow/ReclaimPaymentConfirmationScreen'
import ExchangeReview from 'src/exchange/ExchangeReview'
import ExchangeTradeScreen from 'src/exchange/ExchangeTradeScreen'
import ImportContacts from 'src/import/ImportContacts'
import ImportWallet from 'src/import/ImportWallet'
import EnterInviteCode from 'src/invite/EnterInviteCode'
import JoinCelo from 'src/invite/JoinCelo'
import Language from 'src/language/Language'
import { Screens, Stacks } from 'src/navigator/Screens'
import PaymentRequestListScreen from 'src/paymentRequest/PaymentRequestListScreen'
import Pincode from 'src/pincode/Pincode'
import PincodeConfirmation from 'src/pincode/PincodeConfirmation'
import QRCode from 'src/qrcode/QRCode'
import QRScanner from 'src/qrcode/QRScanner'
import FeeEducation from 'src/send/FeeEducation'
import RequestConfirmation from 'src/send/RequestConfirmation'
import Send from 'src/send/Send'
import SendAmount from 'src/send/SendAmount'
import SendConfirmation from 'src/send/SendConfirmation'
import SetClock from 'src/set-clock/SetClock'
import Sync from 'src/sync/Sync'
import TabNavigator from 'src/tab/TabNavigator'
import TransactionReviewScreen from 'src/transactions/TransactionReviewScreen'
import VerifyEducation from 'src/verify/Education'
import VerifyInput from 'src/verify/Input'
import VerifyVerified from 'src/verify/Verified'
import VerifyVerifying from 'src/verify/Verifying'
export const navbarStyle: {
  headerMode: 'none'
} = {
  headerMode: 'none',
}

export const headerArea = {
  defaultNavigationOptions: {
    headerStyle: {
      elevation: 0,
    },
  },
}

const commonScreens = {
  [Screens.PincodeConfirmation]: { screen: PincodeConfirmation },
  [Screens.ErrorScreen]: { screen: ErrorScreen },
  [Screens.UpgradeScreen]: { screen: UpgradeScreen },
}

const NuxStack = createStackNavigator(
  {
    [Screens.Debug]: { screen: Debug },
    [Screens.VerifyEducation]: { screen: VerifyEducation },
    [Screens.VerifyInput]: { screen: VerifyInput },
    [Screens.VerifyVerifying]: { screen: VerifyVerifying },
    [Screens.VerifyVerified]: { screen: VerifyVerified },
    [Screens.Sync]: { screen: Sync },
    [Screens.Pincode]: { screen: Pincode },
    [Screens.ImportWallet]: { screen: ImportWallet },
    [Screens.Language]: { screen: Language },
    [Screens.JoinCelo]: { screen: JoinCelo },
    [Screens.EnterInviteCode]: { screen: EnterInviteCode },
    [Screens.ImportContacts]: { screen: ImportContacts },
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
    [Screens.SendAmount]: { screen: SendAmount },
    [Screens.SendConfirmation]: { screen: SendConfirmation },
    [Screens.FeeEducation]: { screen: FeeEducation },
    [Screens.RequestConfirmation]: { screen: RequestConfirmation },
    [Screens.QRCode]: { screen: QRCode },
    [Screens.QRScanner]: { screen: QRScanner },
    ...commonScreens,
  },
  headerArea
)

const ExchangeStack = createStackNavigator(
  {
    [Screens.ExchangeTradeScreen]: { screen: ExchangeTradeScreen },
    [Screens.ExchangeReview]: { screen: ExchangeReview },
    ...commonScreens,
  },
  headerArea
)

const AppStack = createStackNavigator(
  {
    TabNavigator: {
      screen: TabNavigator,
      navigationOptions: { header: null },
    },
    [Screens.Debug]: { screen: Debug },
    [Screens.Language]: { screen: Language },
    [Screens.Analytics]: { screen: Analytics },
    [Screens.SetClock]: { screen: SetClock },
    [Screens.EditProfile]: { screen: EditProfile },
    [Screens.Profile]: { screen: Profile },
    [Screens.Account]: { screen: Account },
    [Screens.Invite]: { screen: Invite },
    [Screens.InviteReview]: { screen: InviteReview },
    [Screens.Licenses]: { screen: Licenses },
    [Screens.DollarEducation]: { screen: DollarEducation },
    [Screens.TransactionReview]: { screen: TransactionReviewScreen },
    [Screens.PhotosEducation]: { screen: PhotosEducation },
    [Screens.QRCode]: { screen: QRCode },
    [Screens.QRScanner]: { screen: QRScanner },
    [Screens.GoldEducation]: { screen: GoldEducation },
    [Screens.Backup]: { screen: Backup },
    [Screens.Pincode]: { screen: Pincode },
    [Screens.ImportWallet]: { screen: ImportWallet },
    [Screens.SendStack]: {
      screen: SendStack,
      navigationOptions: { header: null },
    },
    [Screens.ExchangeStack]: {
      screen: ExchangeStack,
      navigationOptions: { header: null },
    },
    [Screens.PaymentRequestListScreen]: { screen: PaymentRequestListScreen },
    [Screens.ReclaimPaymentConfirmationScreen]: { screen: ReclaimPaymentConfirmationScreen },
    ...commonScreens,
  },
  headerArea
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
