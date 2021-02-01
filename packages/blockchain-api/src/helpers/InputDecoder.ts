import * as utf8 from 'utf8'
import { ContractAddresses, Contracts } from '../utils'
import { Input } from './Input'

export class InputDecoder {
  private contractAddresses: ContractAddresses
  private input: Input

  constructor(contractAddresses: ContractAddresses, input: Input) {
    this.contractAddresses = contractAddresses
    this.input = input
  }

  getTransactionComment(): string {
    if (!this.input.isTransferWithComment()) {
      return ''
    }

    const decodedInput = this.input.decode(['address', 'uint256', 'string'])
    return decodedInput ? utf8.decode(decodedInput[2]) : ''
  }

  hasContractCallTo(contract: Contracts): boolean {
    const decodedInput = this.input.decode(['address', 'uint256'])

    if (!decodedInput) {
      return false
    }

    return decodedInput[0].toLowerCase() === this.contractAddresses[contract]
  }

  registersAccountDek(account: string): boolean {
    if (!this.input.isAccountDekRegistration()) {
      return false
    }

    const decodedInput = this.input.decode(['uint256', 'uint256', 'address'])

    if (!decodedInput) {
      return false
    }

    return decodedInput[2].toLowerCase() === account
  }
}
