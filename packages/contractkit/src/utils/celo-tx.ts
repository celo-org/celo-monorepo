import { Tx } from 'web3/eth/types'

export interface CeloTx extends Tx {
  feeCurrency?: string
  gatewayFeeRecipient?: string
  gatewayFee?: string
}
