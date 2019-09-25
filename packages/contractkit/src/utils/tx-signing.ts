import { PartialTxParams } from '@0x/subproviders'
import { Tx } from 'web3/eth/types'

export interface CeloTx extends Tx {
  gasCurrency?: string
  gasFeeRecipient?: string
}

export interface CeloPartialTxParams extends PartialTxParams {
  gasCurrency?: string
  gasFeeRecipient?: string
}
