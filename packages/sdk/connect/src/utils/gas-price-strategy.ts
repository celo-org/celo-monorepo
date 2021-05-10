import { BigNumber } from 'bignumber.js'
import { CeloTx } from '../types'

export interface GasPriceStrategy {
  caculateGasPrice: (tx: CeloTx, nodeGasPriceSuggestion: BigNumber) => Promise<BigNumber>
}

export class NodeGasPriceStrategy implements GasPriceStrategy {
  async caculateGasPrice(_tx: CeloTx, nodeGasPriceSuggestion: BigNumber): Promise<BigNumber> {
    return nodeGasPriceSuggestion
  }
}

export class FixedGasPriceStrategy implements GasPriceStrategy {
  constructor(public gasPriceConstant: BigNumber.Value) {}

  async caculateGasPrice(_tx: CeloTx, _nodeGasPriceSuggestion: BigNumber): Promise<BigNumber> {
    return new BigNumber(this.gasPriceConstant)
  }
}
