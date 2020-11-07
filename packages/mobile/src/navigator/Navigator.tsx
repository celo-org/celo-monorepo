import colors from '@celo/react-components/styles/colors'
import { RouteProp } from '@react-navigation/core'
import { createStackNavigator, StackScreenProps, TransitionPresets } from '@react-navigation/stack'
import * as React from 'react'
import { Platform } from 'react-native'
import SplashScreen from 'react-native-splash-screen'
import AccountKeyEducation from 'src/account/AccountKeyEducation'
import GoldEducation from 'src/account/GoldEducation'
import Licenses from 'src/account/Licenses'
import Profile from 'src/account/Profile'
import { PincodeType } from 'src/account/reducer'
import SupportContact from 'src/account/SupportContact'
import { CeloExchangeEvents } from 'src/analytics/Events'
import AppLoading from 'src/app/AppLoading'
import Debug from 'src/app/Debug'
import ErrorScreen from 'src/app/ErrorScreen'
import { currentLanguageSelector } from 'src/app/reducers'
import UpgradeScreen from 'src/app/UpgradeScreen'
import BackupComplete from 'src/backup/BackupComplete'
import BackupPhrase, { navOptionsForBackupPhrase } from 'src/backup/BackupPhrase'
import BackupQuiz, { navOptionsForQuiz } from 'src/backup/BackupQuiz'
import BackButton from 'src/components/BackButton'
import CancelButton from 'src/components/CancelButton'
import DappKitAccountScreen from 'src/dappkit/DappKitAccountScreen'
import DappKitSignTxScreen from 'src/dappkit/DappKitSignTxScreen'
import DappKitTxDataScreen from 'src/dappkit/DappKitTxDataScreen'
import EscrowedPaymentListScreen from 'src/escrow/EscrowedPaymentListScreen'
import ReclaimPaymentConfirmationScreen from 'src/escrow/ReclaimPaymentConfirmationScreen'
import ExchangeReview from 'src/exchange/ExchangeReview'
import ExchangeTradeScreen from 'src/exchange/ExchangeTradeScreen'
import WithdrawCeloQrScannerScreen from 'src/exchange/WithdrawCeloQrScannerScreen'
import WithdrawCeloReviewScreen from 'src/exchange/WithdrawCeloReviewScreen'
import WithdrawCeloScreen from 'src/exchange/WithdrawCeloScreen'
import ExternalExchanges, {
  externalExchangesScreenOptions,
} from 'src/fiatExchanges/ExternalExchanges'
import FiatExchangeAmount, {
  fiatExchangesAmountScreenOptions,
} from 'src/fiatExchanges/FiatExchangeAmount'
import FiatExchangeOptions, {
  fiatExchangesOptionsScreenOptions,
} from 'src/fiatExchanges/FiatExchangeOptions'
import MoonPay, { moonPayOptions } from 'src/fiatExchanges/MoonPay'
import Simplex, { simplexOptions } from 'src/fiatExchanges/Simplex'
import { CURRENCY_ENUM } from 'src/geth/consts'
import i18n from 'src/i18n'
import PhoneNumberLookupQuotaScreen from 'src/identity/PhoneNumberLookupQuotaScreen'
import ImportWallet from 'src/import/ImportWallet'
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
  noHeaderGestureDisabled,
  nuxNavigationOptions,
} from 'src/navigator/Headers'
import { navigateBack, navigateToExchangeHome } from 'src/navigator/NavigationService'
import QRNavigator from 'src/navigator/QRNavigator'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import ImportContactsScreen from 'src/onboarding/contacts/ImportContactsScreen'
import OnboardingEducationScreen from 'src/onboarding/education/OnboardingEducationScreen'
import NameAndNumber from 'src/onboarding/registration/NameAndNumber'
import RegulatoryTerms from 'src/onboarding/registration/RegulatoryTerms'
import SelectCountry from 'src/onboarding/registration/SelectCountry'
import OnboardingSuccessScreen from 'src/onboarding/success/OnboardingSuccessScreen'
import Welcome from 'src/onboarding/welcome/Welcome'
import IncomingPaymentRequestListScreen from 'src/paymentRequest/IncomingPaymentRequestListScreen'
import OutgoingPaymentRequestListScreen from 'src/paymentRequest/OutgoingPaymentRequestListScreen'
import PaymentRequestConfirmation, {
  paymentConfirmationScreenNavOptions,
} from 'src/paymentRequest/PaymentRequestConfirmation'
import PaymentRequestUnavailable, {
  paymentRequestUnavailableScreenNavOptions,
} from 'src/paymentRequest/PaymentRequestUnavailable'
import PincodeEnter from 'src/pincode/PincodeEnter'
import PincodeSet from 'src/pincode/PincodeSet'
import { RootState } from 'src/redux/reducers'
import { store } from 'src/redux/store'
import Send from 'src/send/Send'
import SendAmount, { sendAmountScreenNavOptions } from 'src/send/SendAmount'
import SendConfirmation, { sendConfirmationScreenNavOptions } from 'src/send/SendConfirmation'
import ValidateRecipientAccount, {
  validateRecipientAccountScreenNavOptions,
} from 'src/send/ValidateRecipientAccount'
import ValidateRecipientIntro, {
  validateRecipientIntroScreenNavOptions,
} from 'src/send/ValidateRecipientIntro'
import SetClock from 'src/set-clock/SetClock'
import TransactionReview from 'src/transactions/TransactionReview'
import { getDatetimeDisplayString } from 'src/utils/time'
import { ExtractProps } from 'src/utils/typescript'
import VerificationEducationScreen from 'src/verify/VerificationEducationScreen'
import VerificationInputScreen from 'src/verify/VerificationInputScreen'
import VerificationLoadingScreen from 'src/verify/VerificationLoadingScreen'

const Stack = createStackNavigator<StackParamList>()
const RootStack = createStackNavigator<StackParamList>()

type NavigationOptions = StackScreenProps<StackParamList>

export const modalScreenOptions = ({ route, navigation }: NavigationOptions) =>
  Platform.select({
    // iOS 13 modal presentation
    ios: {
      gestureEnabled: true,
      cardOverlayEnabled: true,
      headerStatusBarHeight:
        navigation.dangerouslyGetState().routes.indexOf(route) > 0 ? 0 : undefined,
      ...TransitionPresets.ModalPresentationIOS,
    },
  })

const commonScreens = (Navigator: typeof Stack) => {
  return (
    <>
      <Navigator.Screen name={Screens.ErrorScreen} component={ErrorScreen} options={noHeader} />
      <Navigator.Screen
        name={Screens.UpgradeScreen}
        component={UpgradeScreen}
        options={UpgradeScreen.navigationOptions}
      />
      <Navigator.Screen
        name={Screens.DappKitAccountAuth}
        component={DappKitAccountScreen}
        options={DappKitAccountScreen.navigationOptions}
      />
      <Navigator.Screen
        name={Screens.DappKitSignTxScreen}
        component={DappKitSignTxScreen}
        options={DappKitSignTxScreen.navigationOptions}
      />
      <Navigator.Screen
        name={Screens.DappKitTxDataScreen}
        component={DappKitTxDataScreen}
        options={DappKitTxDataScreen.navigationOptions}
      />
      <Navigator.Screen name={Screens.Debug} component={Debug} options={Debug.navigationOptions} />
      <Navigator.Screen
        name={Screens.PhoneNumberLookupQuota}
        component={PhoneNumberLookupQuotaScreen}
        options={noHeaderGestureDisabled}
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
        options={VerificationEducationScreen.navigationOptions}
      />
      <Navigator.Screen
        name={Screens.VerificationLoadingScreen}
        component={VerificationLoadingScreen}
        options={VerificationLoadingScreen.navigationOptions}
      />
      <Navigator.Screen
        name={Screens.VerificationInputScreen}
        component={VerificationInputScreen}
        options={VerificationInputScreen.navigationOptions}
      />
    </>
  )
}

const pincodeSetScreenOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.PincodeSet>
}) => {
  const isVerifying = route.params?.isVerifying
  const title = isVerifying
    ? i18n.t('onboarding:pincodeSet.verify')
    : i18n.t('onboarding:pincodeSet.create')
  return {
    ...nuxNavigationOptions,
    headerTitle: () => (
      <HeaderTitleWithSubtitle title={title} subTitle={i18n.t('onboarding:step', { step: '2' })} />
    ),
  }
}

const nuxScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen
      name={Screens.OnboardingEducationScreen}
      component={OnboardingEducationScreen}
      options={OnboardingEducationScreen.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.Welcome}
      component={Welcome}
      options={Welcome.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.NameAndNumber}
      component={NameAndNumber}
      options={{
        ...nuxNavigationOptions,
        headerTitle: () => (
          <HeaderTitleWithSubtitle
            title={i18n.t('onboarding:accountInfo')}
            subTitle={i18n.t('onboarding:step', { step: '1' })}
          />
        ),
      }}
    />
    <Navigator.Screen
      name={Screens.PincodeSet}
      component={PincodeSet}
      options={pincodeSetScreenOptions}
    />
    <Navigator.Screen
      name={Screens.EnterInviteCode}
      component={EnterInviteCode}
      options={EnterInviteCode.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.ImportWallet}
      component={ImportWallet}
      options={ImportWallet.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.ImportContacts}
      component={ImportContactsScreen}
      options={ImportContactsScreen.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.OnboardingSuccessScreen}
      component={OnboardingSuccessScreen}
      options={OnboardingSuccessScreen.navigationOptions}
    />
  </>
)

const sendScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen
      name={Screens.SendAmount}
      component={SendAmount}
      options={sendAmountScreenNavOptions}
    />
    <Navigator.Screen
      name={Screens.SendConfirmation}
      component={SendConfirmation}
      options={sendConfirmationScreenNavOptions}
    />
    <Navigator.Screen
      name={Screens.ValidateRecipientIntro}
      component={ValidateRecipientIntro}
      options={validateRecipientIntroScreenNavOptions}
    />
    <Navigator.Screen
      name={Screens.ValidateRecipientAccount}
      component={ValidateRecipientAccount}
      options={validateRecipientAccountScreenNavOptions}
    />
    <Navigator.Screen
      name={Screens.PaymentRequestUnavailable}
      component={PaymentRequestUnavailable}
      options={paymentRequestUnavailableScreenNavOptions}
    />
    <Navigator.Screen
      name={Screens.PaymentRequestConfirmation}
      component={PaymentRequestConfirmation}
      options={paymentConfirmationScreenNavOptions}
    />
    <Navigator.Screen
      name={Screens.IncomingPaymentRequestListScreen}
      component={IncomingPaymentRequestListScreen}
      options={headerWithBackButton}
    />
    <Navigator.Screen
      name={Screens.OutgoingPaymentRequestListScreen}
      component={OutgoingPaymentRequestListScreen}
      options={headerWithBackButton}
    />
    <Navigator.Screen
      name={Screens.EscrowedPaymentListScreen}
      component={EscrowedPaymentListScreen}
      options={headerWithBackButton}
    />
    <Navigator.Screen
      name={Screens.ReclaimPaymentConfirmationScreen}
      component={ReclaimPaymentConfirmationScreen}
      options={headerWithBackButton}
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
    ? CeloExchangeEvents.celo_buy_cancel
    : CeloExchangeEvents.celo_sell_cancel
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
  const title = isDollarToGold ? i18n.t('exchangeFlow9:buyGold') : i18n.t('exchangeFlow9:sellGold')
  const cancelEventName = isDollarToGold
    ? CeloExchangeEvents.celo_buy_cancel
    : CeloExchangeEvents.celo_sell_cancel
  const editEventName = isDollarToGold
    ? CeloExchangeEvents.celo_buy_edit
    : CeloExchangeEvents.celo_sell_edit
  return {
    ...headerWithCancelButton,
    headerLeft: () => (
      <CancelButton onCancel={navigateToExchangeHome} eventName={cancelEventName} />
    ),
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
    <Navigator.Screen
      name={Screens.WithdrawCeloScreen}
      component={WithdrawCeloScreen}
      options={WithdrawCeloScreen.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.WithdrawCeloQrScannerScreen}
      component={WithdrawCeloQrScannerScreen}
      options={WithdrawCeloQrScannerScreen.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.WithdrawCeloReviewScreen}
      component={WithdrawCeloReviewScreen}
      options={WithdrawCeloReviewScreen.navigationOptions}
    />
  </>
)

const backupScreens = (Navigator: typeof Stack) => (
  <>
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
    <Navigator.Screen name={Screens.BackupComplete} component={BackupComplete} options={noHeader} />
  </>
)

const settingsScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen options={headerWithBackButton} name={Screens.Profile} component={Profile} />
    <Navigator.Screen
      name={Screens.Language}
      component={Language}
      options={Language.navigationOptions(false)}
    />
    <Navigator.Screen
      name={Screens.SelectLocalCurrency}
      component={SelectLocalCurrency}
      options={headerWithBackButton}
    />
    <Navigator.Screen
      options={Licenses.navigationOptions}
      name={Screens.Licenses}
      component={Licenses}
    />
    <Navigator.Screen
      options={headerWithBackButton}
      name={Screens.SupportContact}
      component={SupportContact}
    />
    <Navigator.Screen
      options={fiatExchangesAmountScreenOptions}
      name={Screens.FiatExchangeAmount}
      component={FiatExchangeAmount}
    />
    <Navigator.Screen
      options={externalExchangesScreenOptions}
      name={Screens.ExternalExchanges}
      component={ExternalExchanges}
    />
    <Navigator.Screen
      options={fiatExchangesOptionsScreenOptions}
      name={Screens.FiatExchangeOptions}
      component={FiatExchangeOptions}
    />
    <Navigator.Screen options={moonPayOptions} name={Screens.MoonPay} component={MoonPay} />
    <Navigator.Screen options={simplexOptions} name={Screens.Simplex} component={Simplex} />
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
      <BackButton color={colors.dark} eventName={CeloExchangeEvents.celo_transaction_back} />
    ),
    headerTitle: () => <HeaderTitleWithSubtitle title={header} subTitle={dateTimeStatus} />,
  }
}

const generalScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen name={Screens.SetClock} component={SetClock} />
    <Navigator.Screen
      name={Screens.TransactionReview}
      component={TransactionReview}
      options={transactionReviewOptions}
    />
  </>
)

const mapStateToProps = (state: RootState) => {
  return {
    choseToRestoreAccount: state.account.choseToRestoreAccount,
    language: currentLanguageSelector(state),
    e164Number: state.account.e164PhoneNumber,
    acceptedTerms: state.account.acceptedTerms,
    pincodeType: state.account.pincodeType,
    redeemComplete: state.invite.redeemComplete,
    account: state.web3.account,
    hasSeenVerificationNux: state.identity.hasSeenVerificationNux,
    askedContactsPermission: state.identity.askedContactsPermission,
  }
}

type InitialRouteName = ExtractProps<typeof Stack.Navigator>['initialRouteName']

export function MainStackScreen() {
  const [initialRouteName, setInitialRoute] = React.useState<InitialRouteName>(undefined)

  React.useEffect(() => {
    const {
      choseToRestoreAccount,
      language,
      e164Number,
      acceptedTerms,
      pincodeType,
      redeemComplete,
      hasSeenVerificationNux,
    } = mapStateToProps(store.getState())

    let initialRoute: InitialRouteName

    if (!language) {
      initialRoute = Screens.Language
    } else if (!e164Number || !acceptedTerms || pincodeType === PincodeType.Unset) {
      // User didn't go far enough in onboarding, start again from education
      initialRoute = Screens.OnboardingEducationScreen
    } else if (!redeemComplete) {
      initialRoute = choseToRestoreAccount ? Screens.ImportWallet : Screens.EnterInviteCode
    } else if (!hasSeenVerificationNux) {
      initialRoute = Screens.VerificationEducationScreen
    } else {
      initialRoute = Screens.DrawerNavigator
    }

    setInitialRoute(initialRoute)

    // Wait for next frame to avoid slight gap when hiding the splash
    requestAnimationFrame(() => SplashScreen.hide())
  }, [])

  if (!initialRouteName) {
    return <AppLoading />
  }

  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={emptyHeader}>
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

const modalAnimatedScreens = (Navigator: typeof Stack) => (
  <>
    <Navigator.Screen name={Screens.Send} component={Send} options={Send.navigationOptions} />
    <Navigator.Screen
      name={Screens.PincodeEnter}
      component={PincodeEnter}
      options={PincodeEnter.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.QRNavigator}
      component={QRNavigator}
      options={QRNavigator.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.RegulatoryTerms}
      component={RegulatoryTerms}
      options={RegulatoryTerms.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.GoldEducation}
      component={GoldEducation}
      options={GoldEducation.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.AccountKeyEducation}
      component={AccountKeyEducation}
      options={AccountKeyEducation.navigationOptions}
    />
    <Navigator.Screen
      name={Screens.LanguageModal}
      component={Language}
      options={Language.navigationOptions(true)}
    />
    <Navigator.Screen
      name={Screens.SelectCountry}
      component={SelectCountry}
      options={SelectCountry.navigationOptions}
    />
  </>
)

const mainScreenNavOptions = (navOptions: NavigationOptions) => ({
  ...modalScreenOptions(navOptions),
  headerShown: false,
})

function RootStackScreen() {
  return (
    <RootStack.Navigator mode="modal">
      <RootStack.Screen
        name={Screens.Main}
        component={MainStackScreen}
        options={mainScreenNavOptions}
      />
      {modalAnimatedScreens(RootStack)}
    </RootStack.Navigator>
  )
}

export default RootStackScreen
