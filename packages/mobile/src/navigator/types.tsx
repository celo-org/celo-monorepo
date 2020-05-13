import { AccountAuthRequest, CURRENCY_ENUM, SignTxRequest } from '@celo/utils'
import BigNumber from 'bignumber.js'
import { EscrowedPayment } from 'src/escrow/actions'
import { ExchangeConfirmationCardProps } from 'src/exchange/ExchangeConfirmationCard'
import { Screens } from 'src/navigator/Screens'
import { ConfirmationInput as PaymentRequestConfirmationInput } from 'src/paymentRequest/PaymentRequestConfirmation'
import { Recipient } from 'src/recipients/recipient'
import { ConfirmationInput } from 'src/send/SendConfirmation'
import { TransferConfirmationCardProps } from 'src/send/TransferConfirmationCard'
import { ReviewProps } from 'src/transactions/TransactionReview'

export type StackParamList = {
  [Screens.BackupQuiz]: {
    mnemonic: string
  }
  [Screens.BackupSocialIntro]: {
    incomingFromBackupFlow: boolean
  }
  [Screens.DappKitAccountAuth]: {
    dappKitRequest: AccountAuthRequest
  }
  [Screens.DappKitSignTxScreen]: {
    dappKitRequest: SignTxRequest
  }
  [Screens.DappKitTxDataScreen]: {
    dappKitData: SignTxRequest
  }
  [Screens.DataSaver]: {
    promptModalVisible: boolean
  }
  [Screens.ErrorScreen]: {
    errorMessage: string
  }
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
  [Screens.ImportWallet]: {
    clean: boolean
  }
  [Screens.ImportWalletEmpty]: {
    backupPhrase: string
  }
  [Screens.Invite]: {}
  [Screens.InviteReview]: {
    recipient: Recipient
  }
  [Screens.Language]: {
    nextScreen?: Screens
  }
  [Screens.PaymentRequestConfirmation]: {
    confirmationInput: PaymentRequestConfirmationInput
  }
  [Screens.PincodeEnter]: {
    withVerification?: boolean
    onSuccess: (pin: string) => void
  }
  [Screens.ReclaimPaymentConfirmationScreen]: {
    reclaimPaymentInput: EscrowedPayment
  }
  [Screens.SendAmount]: {
    recipient: Recipient
  }
  [Screens.SendConfirmation]: {
    confirmationInput: ConfirmationInput
  }
  [Screens.TransactionReview]: {
    reviewProps: ReviewProps
    confirmationProps: TransferConfirmationCardProps | ExchangeConfirmationCardProps
  }
}
