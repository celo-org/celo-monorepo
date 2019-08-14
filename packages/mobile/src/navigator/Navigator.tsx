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
import DappKitAccountScreen from 'src/dappkit/DappKitAccountScreen'
import DappKitTxSignScreen from 'src/dappkit/DappKitTxSignScreen'
import ReclaimPaymentConfirmationScreen from 'src/escrow/ReclaimPaymentConfirmationScreen'
import ImportContacts from 'src/import/ImportContacts'
import ImportWallet from 'src/import/ImportWallet'
import EnterInviteCode from 'src/invite/EnterInviteCode'
import JoinCelo from 'src/invite/JoinCelo'
import Language from 'src/language/Language'
import { Screens, Stacks } from 'src/navigator/Screens'
import TabNavigator from 'src/navigator/TabNavigator'
import PaymentRequestListScreen from 'src/paymentRequest/PaymentRequestListScreen'
import Pincode from 'src/pincode/Pincode'
import PincodeConfirmation from 'src/pincode/PincodeConfirmation'
import QRCode from 'src/qrcode/QRCode'
import QRScanner from 'src/qrcode/QRScanner'
import SetClock from 'src/set-clock/SetClock'
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

export const commonScreens = {
  [Screens.PincodeConfirmation]: { screen: PincodeConfirmation },
  [Screens.ErrorScreen]: { screen: ErrorScreen },
  [Screens.UpgradeScreen]: { screen: UpgradeScreen },
  [Screens.DappKitAccountAuth]: { screen: DappKitAccountScreen },
  [Screens.DappKitSignTxScreen]: { screen: DappKitTxSignScreen },
  [Screens.Debug]: { screen: Debug },
}

const NuxStack = createStackNavigator(
  {
    [Screens.Language]: { screen: Language },
    [Screens.JoinCelo]: { screen: JoinCelo },
    [Screens.Pincode]: { screen: Pincode },
    [Screens.EnterInviteCode]: { screen: EnterInviteCode },
    [Screens.ImportWallet]: { screen: ImportWallet },
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

const AppStack = createStackNavigator(
  {
    [Screens.TabNavigator]: {
      screen: TabNavigator,
      navigationOptions: { header: null },
    },
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
    // [Screens.SendStack]: {
    //   screen: SendStack,
    //   navigationOptions: { header: null },
    // },
    // [Screens.ExchangeStack]: {
    //   screen: ExchangeStack,
    //   navigationOptions: { header: null },
    // },
    [Screens.PaymentRequestListScreen]: { screen: PaymentRequestListScreen },
    [Screens.ReclaimPaymentConfirmationScreen]: { screen: ReclaimPaymentConfirmationScreen },
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
    [Stacks.AppStack]: TabNavigator,
  },
  {
    initialRouteName: 'AppLoading',
  }
)

export default AppNavigator
