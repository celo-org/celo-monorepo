import { fromFixed, toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import { Address } from '../base'
import { Validators } from '../generated/types/Validators'
import {
  BaseWrapper,
  CeloTransactionObject,
  proxyCall,
  proxySend,
  toBigNumber,
  wrapSend,
} from './BaseWrapper'

export interface Validator {
  address: Address
  name: string
  url: string
  publicKey: string
  affiliation: string | null
}

export interface ValidatorGroup {
  address: Address
  name: string
  url: string
  members: Address[]
  commission: BigNumber
}

export interface BalanceRequirements {
  group: BigNumber
  validator: BigNumber
}

export interface DeregistrationLockups {
  group: BigNumber
  validator: BigNumber
}

export interface ValidatorsConfig {
  balanceRequirements: BalanceRequirements
  deregistrationLockups: DeregistrationLockups
  maxGroupSize: BigNumber
}

/**
 * Contract for voting for validators and managing validator groups.
 */
export class ValidatorsWrapper extends BaseWrapper<Validators> {
  affiliate = proxySend(this.kit, this.contract.methods.affiliate)
  deaffiliate = proxySend(this.kit, this.contract.methods.deaffiliate)
  addMember = proxySend(this.kit, this.contract.methods.addMember)
  removeMember = proxySend(this.kit, this.contract.methods.removeMember)
  registerValidator = proxySend(this.kit, this.contract.methods.registerValidator)
  async registerValidatorGroup(
    name: string,
    url: string,
    commission: BigNumber
  ): Promise<CeloTransactionObject<boolean>> {
    if (this.kit.defaultAccount == null) {
      throw new Error(`missing from at new ValdidatorUtils()`)
    }
    return wrapSend(
      this.kit,
      this.contract.methods.registerValidatorGroup(name, url, toFixed(commission).toFixed())
    )
  }
  /**
   * Returns the current registration requirements.
   * @returns Group and validator registration requirements.
   */
  async getBalanceRequirements(): Promise<BalanceRequirements> {
    const res = await this.contract.methods.getBalanceRequirements().call()
    return {
      group: toBigNumber(res[0]),
      validator: toBigNumber(res[1]),
    }
  }

  async getDeregistrationLockups(): Promise<DeregistrationLockups> {
    const res = await this.contract.methods.getDeregistrationLockups().call()
    return {
      group: toBigNumber(res[0]),
      validator: toBigNumber(res[1]),
    }
  }

  /**
   * Returns current configuration parameters.
   */
  async getConfig(): Promise<ValidatorsConfig> {
    const res = await Promise.all([
      this.getBalanceRequirements(),
      this.getDeregistrationLockups(),
      this.contract.methods.maxGroupSize().call(),
    ])
    return {
      balanceRequirements: res[0],
      deregistrationLockups: res[1],
      maxGroupSize: toBigNumber(res[2]),
    }
  }

  async getRegisteredValidators(): Promise<Validator[]> {
    const vgAddresses = await this.contract.methods.getRegisteredValidators().call()

    return Promise.all(vgAddresses.map((addr) => this.getValidator(addr)))
  }

  getGroupNumMembers: (group: Address) => Promise<BigNumber> = proxyCall(
    this.contract.methods.getGroupNumMembers,
    undefined,
    toBigNumber
  )

  async getValidator(address: Address): Promise<Validator> {
    const res = await this.contract.methods.getValidator(address).call()
    return {
      address,
      name: res[0],
      url: res[1],
      publicKey: res[2] as any,
      affiliation: res[3],
    }
  }

  async getRegisteredValidatorGroups(): Promise<ValidatorGroup[]> {
    const vgAddresses = await this.contract.methods.getRegisteredValidatorGroups().call()
    return Promise.all(vgAddresses.map((addr) => this.getValidatorGroup(addr)))
  }

  async getValidatorGroup(address: Address): Promise<ValidatorGroup> {
    const res = await this.contract.methods.getValidatorGroup(address).call()
    return {
      address,
      name: res[0],
      url: res[1],
      members: res[2],
      commission: fromFixed(new BigNumber(res[3])),
    }
  }
}
