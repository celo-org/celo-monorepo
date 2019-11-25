import { PartialTxParams } from '@0x/subproviders'
import { Tx } from 'web3/eth/types'

export interface CeloTx extends Tx {
  feeCurrency?: string
  gatewayFeeRecipient?: string
  gatewayFee?: string
}

export interface CeloPartialTxParams extends PartialTxParams {
  feeCurrency?: string
  gatewayFeeRecipient?: string
  gatewayFee?: string
}
