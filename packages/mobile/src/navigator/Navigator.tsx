import QRCodeBorderlessIcon from '@celo/react-components/icons/QRCodeBorderless'
import Times from '@celo/react-components/icons/Times'
import colors from '@celo/react-components/styles/colors.v2'
import { RouteProp } from '@react-navigation/core'
import { createStackNavigator } from '@react-navigation/stack'
import * as React from 'react'
import SplashScreen from 'react-native-splash-screen'
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
import { CustomEventNames } from 'src/analytics/constants'
import AppLoading from 'src/app/AppLoading'
import Debug from 'src/app/Debug'
import ErrorScreen from 'src/app/ErrorScreen'
import UpgradeScreen from 'src/app/UpgradeScreen'
import BackupComplete from 'src/backup/BackupComplete'
import BackupIntroduction, { navOptionsForAccount } from 'src/backup/BackupIntroduction'
import BackupPhrase, { navOptionsForBackupPhrase } from 'src/backup/BackupPhrase'
import BackupQuiz, { navOptionsForQuiz } from 'src/backup/BackupQuiz'
import BackupSocial from 'src/backup/BackupSocial'
import BackupSocialIntro from 'src/backup/BackupSocialIntro'
import BackButton from 'src/components/BackButton.v2'
import CancelButton from 'src/components/CancelButton.v2'
import DappKitAccountScreen from 'src/dappkit/DappKitAccountScreen'
import DappKitSignTxScreen from 'src/dappkit/DappKitSignTxScreen'
import DappKitTxDataScreen from 'src/dappkit/DappKitTxDataScreen'
import EscrowedPaymentListScreen from 'src/escrow/EscrowedPaymentListScreen'
import ReclaimPaymentConfirmationScreen from 'src/escrow/ReclaimPaymentConfirmationScreen'
import ExchangeReview from 'src/exchange/ExchangeReview'
import ExchangeTradeScreen from 'src/exchange/ExchangeTradeScreen'
import FeeExchangeEducation from 'src/exchange/FeeExchangeEducation'
import { CURRENCY_ENUM } from 'src/geth/consts'
import i18n from 'src/i18n'
import PhoneNumberLookupQuotaScreen from 'src/identity/PhoneNumberLookupQuotaScreen'
import ImportWallet from 'src/import/ImportWallet'
import ImportWalletEmpty from 'src/import/ImportWalletEmpty'
import ImportWalletSocial from 'src/import/ImportWalletSocial'
import EnterInviteCode from 'src/invite/EnterInviteCode'
import Language from 'src/language/Language'
import SelectLocalCurrency from 'src/localCurrency/SelectLocalCurrency'
import DrawerNavigator from 'src/navigator/DrawerNavigator'
import {
  emptyHeader,
  HeaderTitleWithBalance,
  HeaderTitleWithSubtitle,
  headerWithBackButton,
  headerWithCancelButton,
  noHeader,
  nuxNavigationOptions,
  nuxNavigationOptionsNoBackButton,
} from 'src/navigator/Headers.v2'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import QRNavigator from 'src/navigator/QRNavigator'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton, TopBarTextButton } from 'src/navigator/TopBarButton.v2'
import { StackParamList } from 'src/navigator/types'
import ImportContactsScreen from 'src/onboarding/contacts/ImportContactsScreen'
import OnboardingSuccessScreen from 'src/onboarding/success/OnboardingSuccessScreen'
import IncomingPaymentRequestListScreen from 'src/paymentRequest/IncomingPaymentRequestListScreen'
import OutgoingPaymentRequestListScreen from 'src/paymentRequest/OutgoingPaymentRequestListScreen'
import PaymentRequestConfirmation from 'src/paymentRequest/PaymentRequestConfirmation'
import PaymentRequestUnavailable from 'src/paymentRequest/PaymentRequestUnavailable'
import PincodeEducation from 'src/pincode/PincodeEducation'
import PincodeEnter from 'src/pincode/PincodeEnter'
import PincodeSet from 'src/pincode/PincodeSet'
import { RootState } from 'src/redux/reducers'
import { store } from 'src/redux/store'
import JoinCelo from 'src/registration/JoinCelo'
import RegulatoryTerms from 'src/registration/RegulatoryTerms'
import FeeEducation from 'src/send/FeeEducation'
import Send from 'src/send/Send'
import SendAmount from 'src/send/SendAmount'
import SendConfirmation from 'src/send/SendConfirmation'
import ValidateRecipientAccount from 'src/send/ValidateRecipientAccount'
import ValidateRecipientIntro from 'src/send/ValidateRecipientIntro'
import SetClock from 'src/set-clock/SetClock'
import TransactionReview from 'src/transactions/TransactionReview'
import { getDatetimeDisplayString } from 'src/utils/time'
import VerificationEducationScreen from 'src/verify/VerificationEducationScreen'
import VerificationInputScreen from 'src/verify/VerificationInputScreen'
import VerificationInterstitialScreen from 'src/verify/VerificationInterstitialScreen'
import VerificationLearnMoreScreen from 'src/verify/VerificationLearnMoreScreen'
import VerificationLoadingScreen from 'src/verify/VerificationLoadingScreen'

const Stack = createStackNavigator<StackParamList>()

const commonScreens = (Navigator: typeof Stack) => {
  return (
    <>
      <Navigator.Screen name={Screens.Language} component={Language} options={noHeader} />
      <Navigator.Screen name={Screens.PincodeEnter} component={PincodeEnter} options={noHeader} />
      <Navigator.Screen name={Screens.ErrorScreen} component={ErrorScreen} options={noHeader} />
      <Navigator.Screen name={Screens.UpgradeScreen} component={UpgradeScreen} />
      <Navigator.Screen name={Screens.DappKitAccountAuth} component={DappKitAccountScreen} />
      <Navigator.Screen name={Screens.DappKitSignTxScreen} component={DappKitSignTxScreen} />
      <Navigator.Screen name={Screens.DappKitTxDataScreen} component={DappKitTxDataScreen} />
      <Navigator.Screen name={Screens.Debug} component={Debug} />
      <Navigator.Screen name={Screens.DataSaver} component={DataSaver} />
      <Navigator.Screen
        name={Screens.PhoneNumberLookupQuota}
        component={PhoneNumberLookupQuotaScreen}
      />
    </>
  )
}

const verificationScreens = (Navigator: typeof Stack) => {
  return (
    <>
      <Navigator.Screen
        name={Screens.VerificationEducationScreen}
        component={VerificationEducationScreen}
        options={nuxNavigationOptions}
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
    </>
  )
}

const nuxScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen name={Screens.JoinCelo} component={JoinCelo} options={nuxNavigationOptions} />
    <Navigator.Screen
      name={Screens.RegulatoryTerms}
      component={RegulatoryTerms}
      options={nuxNavigationOptions}
    />
    <Navigator.Screen
      name={Screens.PincodeEducation}
      component={PincodeEducation}
      options={nuxNavigationOptions}
    />
    <Navigator.Screen
      name={Screens.PincodeSet}
      component={PincodeSet}
      options={nuxNavigationOptions}
    />
    <Navigator.Screen
      name={Screens.EnterInviteCode}
      component={EnterInviteCode}
      options={nuxNavigationOptionsNoBackButton}
    />
    <Navigator.Screen
      name={Screens.ImportWallet}
      component={ImportWallet}
      options={nuxNavigationOptions}
    />
    <Navigator.Screen
      name={Screens.ImportWalletSocial}
      component={ImportWalletSocial}
      options={nuxNavigationOptions}
    />
    <Navigator.Screen
      name={Screens.ImportWalletEmpty}
      component={ImportWalletEmpty}
      options={nuxNavigationOptions}
    />
    <Navigator.Screen
      name={Screens.ImportContacts}
      component={ImportContactsScreen}
      options={nuxNavigationOptions}
    />
    <Navigator.Screen name={Screens.OnboardingSuccessScreen} component={OnboardingSuccessScreen} />
  </>
)

const sendScreenOptions = ({ route }: { route: RouteProp<StackParamList, Screens.Send> }) => {
  const goQr = () => navigate(Screens.QRNavigator)
  return {
    ...emptyHeader,
    headerLeft: () => (
      <TopBarIconButton
        icon={<Times />}
        onPress={navigateBack}
        eventName={
          route.params?.isRequest ? CustomEventNames.send_cancel : CustomEventNames.request_cancel
        }
      />
    ),
    headerLeftContainerStyle: { paddingLeft: 20 },
    headerRight: () => (
      <TopBarIconButton
        icon={<QRCodeBorderlessIcon height={32} color={colors.greenUI} />}
        eventName={
          route.params?.isRequest ? CustomEventNames.send_scan : CustomEventNames.request_scan
        }
        onPress={goQr}
      />
    ),
    headerRightContainerStyle: { paddingRight: 16 },
    headerTitle: i18n.t(`sendFlow7:${route.params?.isRequest ? 'request' : 'send'}`),
  }
}

const sendAmountScreenOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.SendAmount>
}) => {
  return {
    ...emptyHeader,
    headerLeft: () => <BackButton eventName={CustomEventNames.send_amount_back} />,
    headerTitle: () => (
      <HeaderTitleWithBalance
        title={i18n.t(`sendFlow7:${route.params?.isRequest ? 'request' : 'send'}`)}
        token={CURRENCY_ENUM.DOLLAR}
      />
    ),
  }
}

const emptyWithBackButtonHeaderOption = () => ({
  ...emptyHeader,
  headerLeft: () => <BackButton />,
})

const navigateHome = () => navigate(Screens.WalletHome)

const paymentRequestUnavailableScreenOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.PaymentRequestUnavailable>
}) => ({
  ...emptyHeader,
  headerLeft: () => <TopBarIconButton icon={<Times />} onPress={navigateHome} />,
  headerLeftContainerStyle: { paddingLeft: 20 },
})

const sendScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen name={Screens.Send} component={Send} options={sendScreenOptions} />
    <Navigator.Screen name={Screens.QRNavigator} component={QRNavigator} options={noHeader} />
    <Navigator.Screen
      name={Screens.SendAmount}
      component={SendAmount}
      options={sendAmountScreenOptions}
    />
    <Navigator.Screen
      name={Screens.SendConfirmation}
      component={SendConfirmation}
      options={emptyWithBackButtonHeaderOption}
    />
    <Navigator.Screen
      name={Screens.ValidateRecipientIntro}
      component={ValidateRecipientIntro}
      options={emptyWithBackButtonHeaderOption}
    />
    <Navigator.Screen
      name={Screens.ValidateRecipientAccount}
      component={ValidateRecipientAccount}
      options={emptyWithBackButtonHeaderOption}
    />
    <Navigator.Screen
      name={Screens.PaymentRequestUnavailable}
      component={PaymentRequestUnavailable}
      options={paymentRequestUnavailableScreenOptions}
    />
    <Navigator.Screen
      name={Screens.PaymentRequestConfirmation}
      component={PaymentRequestConfirmation}
      options={emptyWithBackButtonHeaderOption}
    />
    <Navigator.Screen
      name={Screens.IncomingPaymentRequestListScreen}
      component={IncomingPaymentRequestListScreen}
      options={emptyWithBackButtonHeaderOption}
    />
    <Navigator.Screen
      name={Screens.OutgoingPaymentRequestListScreen}
      component={OutgoingPaymentRequestListScreen}
      options={emptyWithBackButtonHeaderOption}
    />
    <Navigator.Screen
      name={Screens.EscrowedPaymentListScreen}
      component={EscrowedPaymentListScreen}
      options={emptyWithBackButtonHeaderOption}
    />
    <Navigator.Screen
      name={Screens.ReclaimPaymentConfirmationScreen}
      component={ReclaimPaymentConfirmationScreen}
      options={emptyWithBackButtonHeaderOption}
    />
  </>
)

const exchangeTradeScreenOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.ExchangeTradeScreen>
}) => {
  const { makerToken } = route.params?.makerTokenDisplay
  const isDollarToGold = makerToken === CURRENCY_ENUM.DOLLAR
  const title = isDollarToGold ? i18n.t('exchangeFlow9:buyGold') : i18n.t('exchangeFlow9:sellGold')
  const cancelEventName = isDollarToGold
    ? CustomEventNames.gold_buy_cancel
    : CustomEventNames.gold_sell_cancel
  return {
    ...headerWithCancelButton,
    headerLeft: () => <CancelButton eventName={cancelEventName} />,
    headerTitle: () => <HeaderTitleWithBalance title={title} token={makerToken} />,
  }
}

const exchangeReviewScreenOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.ExchangeReview>
}) => {
  const { makerToken } = route.params?.exchangeInput
  const isDollarToGold = makerToken === CURRENCY_ENUM.DOLLAR
  const goExchangeHome = () => navigate(Screens.ExchangeHomeScreen)
  const title = isDollarToGold ? i18n.t('exchangeFlow9:buyGold') : i18n.t('exchangeFlow9:sellGold')
  const cancelEventName = isDollarToGold
    ? CustomEventNames.gold_buy_cancel
    : CustomEventNames.gold_sell_cancel
  const editEventName = isDollarToGold
    ? CustomEventNames.gold_buy_edit
    : CustomEventNames.gold_sell_edit
  return {
    ...headerWithCancelButton,
    headerLeft: () => <CancelButton onCancel={goExchangeHome} eventName={cancelEventName} />,
    headerRight: () => (
      <TopBarTextButton
        title={i18n.t('global:edit')}
        testID="EditButton"
        onPress={navigateBack}
        titleStyle={{ color: colors.goldDark }}
        eventName={editEventName}
      />
    ),
    headerTitle: () => <HeaderTitleWithBalance title={title} token={makerToken} />,
  }
}
const exchangeScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen
      name={Screens.ExchangeTradeScreen}
      component={ExchangeTradeScreen}
      options={exchangeTradeScreenOptions}
    />
    <Navigator.Screen
      name={Screens.ExchangeReview}
      component={ExchangeReview}
      options={exchangeReviewScreenOptions}
    />
    <Navigator.Screen name={Screens.FeeExchangeEducation} component={FeeExchangeEducation} />
  </>
)

const backupScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen
      name={Screens.BackupIntroduction}
      component={BackupIntroduction}
      options={navOptionsForAccount}
    />
    <Navigator.Screen
      name={Screens.BackupPhrase}
      component={BackupPhrase}
      options={navOptionsForBackupPhrase}
    />
    <Navigator.Screen
      name={Screens.BackupQuiz}
      component={BackupQuiz}
      options={navOptionsForQuiz}
    />
    <Navigator.Screen name={Screens.BackupSocialIntro} component={BackupSocialIntro} />
    <Navigator.Screen name={Screens.BackupSocial} component={BackupSocial} />
    <Navigator.Screen name={Screens.BackupComplete} component={BackupComplete} options={noHeader} />
  </>
)

const settingsScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen options={headerWithBackButton} name={Screens.Account} component={Account} />
    <Navigator.Screen options={headerWithBackButton} name={Screens.Security} component={Security} />
    <Navigator.Screen
      options={headerWithBackButton}
      name={Screens.Analytics}
      component={Analytics}
    />
    <Navigator.Screen
      options={headerWithBackButton}
      name={Screens.EditProfile}
      component={EditProfile}
    />
    <Navigator.Screen options={headerWithBackButton} name={Screens.Profile} component={Profile} />
    <Navigator.Screen options={headerWithBackButton} name={Screens.Invite} component={Invite} />
    <Navigator.Screen
      options={headerWithBackButton}
      name={Screens.InviteReview}
      component={InviteReview}
    />
    <Navigator.Screen
      options={headerWithBackButton}
      name={Screens.SelectLocalCurrency}
      component={SelectLocalCurrency}
    />
    <Navigator.Screen options={headerWithBackButton} name={Screens.Licenses} component={Licenses} />
    <Navigator.Screen options={headerWithBackButton} name={Screens.Support} component={Support} />
    <Navigator.Screen
      options={headerWithBackButton}
      name={Screens.SupportContact}
      component={SupportContact}
    />
    <Navigator.Screen
      options={headerWithBackButton}
      name={Screens.FiatExchange}
      component={FiatExchange}
    />
  </>
)

const transactionReviewOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.TransactionReview>
}) => {
  const { header, timestamp } = route.params?.reviewProps
  const dateTimeStatus = getDatetimeDisplayString(timestamp, i18n)
  return {
    ...emptyHeader,
    headerLeft: () => (
      <BackButton color={colors.dark} eventName={CustomEventNames.gold_activity_back} />
    ),
    headerTitle: () => <HeaderTitleWithSubtitle title={header} subTitle={dateTimeStatus} />,
  }
}

const generalScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen name={Screens.SetClock} component={SetClock} />
    <Navigator.Screen name={Screens.DollarEducation} component={DollarEducation} />
    <Navigator.Screen
      name={Screens.TransactionReview}
      component={TransactionReview}
      options={transactionReviewOptions}
    />
    <Navigator.Screen name={Screens.PhotosEducation} component={PhotosEducation} />
    <Navigator.Screen name={Screens.GoldEducation} component={GoldEducation} />
    <Navigator.Screen name={Screens.FeeEducation} component={FeeEducation} />
  </>
)

const mapStateToProps = (state: RootState) => {
  return {
    language: state.app.language,
    e164Number: state.account.e164PhoneNumber,
    acceptedTerms: state.account.acceptedTerms,
    pincodeType: state.account.pincodeType,
    redeemComplete: state.invite.redeemComplete,
    account: state.web3.account,
    hasSeenVerificationNux: state.identity.hasSeenVerificationNux,
    askedContactsPermission: state.identity.askedContactsPermission,
  }
}

export function AppNavigatorNew() {
  const [initialRouteName, setInitialRoute] = React.useState<Screens | undefined>(undefined)
  React.useEffect(() => {
    const {
      language,
      e164Number,
      acceptedTerms,
      pincodeType,
      redeemComplete,
      account,
      hasSeenVerificationNux,
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
      initialRoute = Screens.DrawerNavigator
    }

    setInitialRoute(initialRoute)

    SplashScreen.hide()
  })

  if (!initialRouteName) {
    return <AppLoading />
  }

  return (
    <Stack.Navigator
      // @ts-ignore
      initialRouteName={initialRouteName}
      screenOptions={emptyHeader}
    >
      <Stack.Screen name={Screens.DrawerNavigator} component={DrawerNavigator} options={noHeader} />
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
