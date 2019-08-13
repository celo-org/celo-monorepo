import { Address, CeloContract } from './base'
import { ContractKit } from './kit'

export class AddressRegistry {
  constructor(readonly kit: ContractKit) {}

  async addressFor(_contract: CeloContract): Promise<Address> {
    // TODO implement
    return '0x0000000'
  }
}
