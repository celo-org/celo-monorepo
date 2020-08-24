import { CeloTx } from '@celo/communication/types/commons'
import { NodeCommunicationWrapper } from '..'

function isEmpty(value: string | undefined) {
  return (
    value === undefined ||
    value === null ||
    value === '0' ||
    value.toLowerCase() === '0x' ||
    value.toLowerCase() === '0x0'
  )
}

export class TxParamsNormalizer {
  private chainId: number | null = null
  private gatewayFeeRecipient: string | null = null

  constructor(readonly communication: NodeCommunicationWrapper) {}

  public async populate(celoTxParams: CeloTx): Promise<CeloTx> {
    const txParams = { ...celoTxParams }

    if (txParams.chainId == null) {
      txParams.chainId = await this.getChainId()
    }

    if (txParams.nonce == null) {
      txParams.nonce = await this.communication.nonce(txParams.from!.toString())
    }

    if (!txParams.gas || isEmpty(txParams.gas.toString())) {
      txParams.gas = await this.communication.estimateGas(txParams)
    }

    if (!txParams.gasPrice || isEmpty(txParams.gasPrice.toString())) {
      txParams.gasPrice = await this.communication.gasPrice(txParams.feeCurrency)
    }

    return txParams
  }

  private async getChainId(): Promise<number> {
    if (this.chainId === null) {
      this.chainId = await this.communication.chainId()
    }
    return this.chainId
  }

  // @ts-ignore - see comment above
  private async getCoinbase(): Promise<string> {
    if (this.gatewayFeeRecipient === null) {
      this.gatewayFeeRecipient = await this.communication.coinbase()
    }
    if (this.gatewayFeeRecipient == null) {
      throw new Error(
        'missing-tx-params-populator@getCoinbase: Coinbase is null, we are not connected to a full ' +
          'node, cannot sign transactions locally'
      )
    }
    return this.gatewayFeeRecipient
  }
}
