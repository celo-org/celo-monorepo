import {
  AccountAuthRequest,
  Countries,
  CURRENCY_ENUM,
  SignTxRequest,
  TxToSignParam,
} from '@celo/utils'
import BigNumber from 'bignumber.js'
import { EscrowedPayment } from 'src/escrow/actions'
import { ExchangeConfirmationCardProps } from 'src/exchange/ExchangeConfirmationCard'
import { AddressValidationType } from 'src/identity/reducer'
import { ImportContactsStatus } from 'src/identity/types'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { Screens } from 'src/navigator/Screens'
import { Recipient } from 'src/recipients/recipient'
import { TransactionDataInput } from 'src/send/SendAmount'
import { CurrencyInfo } from 'src/send/SendConfirmation'
import { ReviewProps } from 'src/transactions/TransactionReview'
import { TransferConfirmationCardProps } from 'src/transactions/TransferConfirmationCard'

// Typed nested navigator params
type NestedNavigatorParams<ParamList> = {
  [K in keyof ParamList]: undefined extends ParamList[K]
    ? { screen: K; params?: ParamList[K] }
    : { screen: K; params: ParamList[K] }
}[keyof ParamList]

// tslint:disable-next-line: interface-over-type-literal
export type StackParamList = {
  [Screens.BackupComplete]:
    | undefined
    | {
        navigatedFromSettings: boolean
      }
  [Screens.BackupIntroduction]:
    | {
        navigatedFromSettings?: boolean
      }
    | undefined
  [Screens.AccountKeyEducation]:
    | undefined
    | {
        nextScreen: keyof StackParamList
      }
  [Screens.BackupPhrase]:
    | undefined
    | {
        navigatedFromSettings: boolean
      }
  [Screens.BackupQuiz]:
    | undefined
    | {
        navigatedFromSettings: boolean
      }
  [Screens.DappKitAccountAuth]: {
    dappKitRequest: AccountAuthRequest
  }
  [Screens.DappKitSignTxScreen]: {
    dappKitRequest: SignTxRequest
  }
  [Screens.DappKitTxDataScreen]: {
    dappKitData: TxToSignParam['txData']
  }
  [Screens.Debug]: undefined
  [Screens.DrawerNavigator]: undefined
  [Screens.EnterInviteCode]: undefined
  [Screens.ErrorScreen]: {
    errorMessage?: string
  }
  [Screens.EscrowedPaymentListScreen]: undefined
  [Screens.ExchangeHomeScreen]: undefined
  [Screens.ExchangeReview]: {
    exchangeInput: {
      makerToken: CURRENCY_ENUM
      makerTokenBalance: string
      inputToken: CURRENCY_ENUM
      inputTokenDisplayName: string
      inputAmount: BigNumber
    }
  }
  [Screens.ExchangeTradeScreen]: {
    makerTokenDisplay: {
      makerToken: CURRENCY_ENUM
      makerTokenBalance: string
    }
  }
  [Screens.ExternalExchanges]: undefined
  [Screens.FiatExchange]: undefined
  [Screens.FiatExchangeAmount]: {
    isAddFunds: boolean
  }
  [Screens.FiatExchangeOptions]: {
    isAddFunds: boolean
    amount?: BigNumber
    isExplanationOpen?: boolean
  }
  [Screens.MoonPay]: {
    localAmount: BigNumber
    currencyCode: LocalCurrencyCode
  }
  [Screens.GoldEducation]: undefined
  [Screens.ImportWallet]:
    | {
        clean: boolean
        showZeroBalanceModal?: boolean
      }
    | undefined

  [Screens.ImportContacts]:
    | undefined
    | {
        onPressSkip?: () => void
        importStatus?: ImportContactsStatus
      }
  [Screens.IncomingPaymentRequestListScreen]: undefined
  [Screens.NameAndNumber]:
    | {
        selectedCountryCodeAlpha2: string
        country: string
      }
    | undefined
  [Screens.Language]:
    | {
        nextScreen: keyof StackParamList
      }
    | undefined
  [Screens.LanguageModal]:
    | {
        nextScreen: keyof StackParamList
      }
    | undefined
  [Screens.Licenses]: undefined
  [Screens.Main]: undefined
  [Screens.OutgoingPaymentRequestListScreen]: undefined
  [Screens.PaymentRequestUnavailable]: {
    transactionData: TransactionDataInput
  }
  [Screens.PaymentRequestConfirmation]: {
    transactionData: TransactionDataInput
    addressJustValidated?: boolean
  }
  [Screens.PincodeEnter]: {
    withVerification?: boolean
    onSuccess: (pin: string) => void
    onCancel: () => void
  }
  [Screens.PincodeSet]: { isVerifying: boolean } | undefined
  [Screens.PhoneNumberLookupQuota]: {
    onBuy: () => void
    onSkip: () => void
  }
  [Screens.PhotosEducation]: undefined
  [Screens.PhotosNUX]: undefined
  [Screens.Profile]: undefined
  [Screens.QRNavigator]: NestedNavigatorParams<QRTabParamList> | undefined
  [Screens.ReclaimPaymentConfirmationScreen]: {
    reclaimPaymentInput: EscrowedPayment
  }
  [Screens.RegulatoryTerms]: undefined
  [Screens.SelectCountry]: {
    countries: Countries
    selectedCountryCodeAlpha2: string
  }
  [Screens.SelectLocalCurrency]: undefined
  [Screens.Send]:
    | {
        isOutgoingPaymentRequest?: true
      }
    | undefined
  [Screens.SendAmount]: {
    recipient: Recipient
    isOutgoingPaymentRequest?: true
    isFromScan?: boolean
  }
  [Screens.SendConfirmation]: {
    transactionData: TransactionDataInput
    addressJustValidated?: boolean
    isFromScan?: boolean
    currencyInfo?: CurrencyInfo
  }
  [Screens.SetClock]: undefined
  [Screens.Settings]:
    | { promptFornoModal?: boolean; promptConfirmRemovalModal?: boolean }
    | undefined
  [Screens.Simplex]: undefined
  [Screens.Support]: undefined
  [Screens.SupportContact]: undefined
  [Screens.Sync]: undefined
  [Screens.TransactionReview]: {
    reviewProps: ReviewProps
    confirmationProps: TransferConfirmationCardProps | ExchangeConfirmationCardProps
  }
  [Screens.UpgradeScreen]: undefined
  [Screens.ValidateRecipientIntro]: {
    transactionData: TransactionDataInput
    addressValidationType: AddressValidationType
    isOutgoingPaymentRequest?: true
    requesterAddress?: string
  }
  [Screens.ValidateRecipientAccount]: {
    transactionData: TransactionDataInput
    addressValidationType: AddressValidationType
    isOutgoingPaymentRequest?: true
    requesterAddress?: string
  }
  [Screens.VerificationEducationScreen]:
    | { showSkipDialog?: boolean; hideOnboardingStep?: boolean }
    | undefined
  [Screens.VerificationInputScreen]: { showHelpDialog: boolean } | undefined
  [Screens.VerificationLoadingScreen]: { withoutRevealing: boolean }
  [Screens.OnboardingEducationScreen]: undefined
  [Screens.OnboardingSuccessScreen]: undefined
  [Screens.WalletHome]: undefined
  [Screens.Welcome]: undefined
  [Screens.WithdrawCeloQrScannerScreen]: {
    onAddressScanned: (address: string) => void
  }
  [Screens.WithdrawCeloReviewScreen]: {
    amount: BigNumber
    recipientAddress: string
    feeEstimate: BigNumber
  }
  [Screens.WithdrawCeloScreen]: undefined
}

// tslint:disable-next-line: interface-over-type-literal
export type QRTabParamList = {
  [Screens.QRCode]: undefined
  [Screens.QRScanner]:
    | {
        scanIsForSecureSend?: true
        transactionData?: TransactionDataInput
        isOutgoingPaymentRequest?: true
        requesterAddress?: string
      }
    | undefined
}
