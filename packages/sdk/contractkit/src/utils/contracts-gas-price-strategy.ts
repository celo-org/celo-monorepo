import { CeloTx, GasPriceStrategy } from '@celo/connect'
import BigNumber from 'bignumber.js'
import { ContractKit } from '../kit'

// This strategy, retrieves the gasPriceMinimum for a specific currency, and then applies
// a function to convert that price.
// Default function: identity
export class ContractsGasPriceStrategy implements GasPriceStrategy {
  constructor(
    private kit: ContractKit,
    public calculateGasPriceFromGPM: (
      tx: CeloTx,
      _gasPriceMinimum: BigNumber
    ) => Promise<BigNumber> = async (_tx, gasPriceMinimum) => gasPriceMinimum
  ) {}

  async caculateGasPrice(tx: CeloTx, _nodeGasPriceSuggestion: BigNumber): Promise<BigNumber> {
    const gasPriceMinimum = await this.kit.contracts.getGasPriceMinimum()
    let gpm
    if (tx.feeCurrency) {
      try {
        gpm = await gasPriceMinimum.getGasPriceMinimum(tx.feeCurrency)
      } catch {
        throw new Error(`Invalid feeCurrency. Currency Address: ${tx.feeCurrency}`)
      }
    } else {
      gpm = await gasPriceMinimum.gasPriceMinimum()
    }
    return this.calculateGasPriceFromGPM(tx, gpm)
  }
}

export class MultiplyContractsGasPriceStrategy extends ContractsGasPriceStrategy {
  constructor(kit: ContractKit, public fixNumber: BigNumber.Value) {
    super(
      kit,
      async (_tx: CeloTx, gasPriceMinimum: BigNumber): Promise<BigNumber> =>
        gasPriceMinimum.multipliedBy(this.fixNumber)
    )
  }
}
