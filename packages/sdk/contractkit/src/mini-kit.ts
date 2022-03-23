import { Address, CeloTx, Connection, ReadOnlyWallet } from '@celo/connect'
import { LocalWallet } from '@celo/wallet-local'
import { BigNumber } from 'bignumber.js'
import Web3 from 'web3'
import { AddressRegistry } from './address-registry'
import { CeloContract, CeloTokenContract } from './base'
import { CeloTokens, EachCeloToken } from './celo-tokens'
import { MiniContractCache } from './mini-contract-cache'
import {
  ensureCurrentProvider,
  getWeb3ForKit,
  HttpProviderOptions,
  setupAPIKey,
} from './setupForKits'

/**
 * Creates a new instance of `MiniMiniContractKit` given a nodeUrl
 * @param url CeloBlockchain node url
 * @optional wallet to reuse or add a wallet different than the default (example ledger-wallet)
 * @optional options to pass to the Web3 HttpProvider constructor
 */
export function newKit(url: string, wallet?: ReadOnlyWallet, options?: HttpProviderOptions) {
  const web3: Web3 = getWeb3ForKit(url, options)
  return newKitFromWeb3(web3, wallet)
}

/**
 * Creates a new instance of `MiniContractKit` given a nodeUrl and apiKey
 * @param url CeloBlockchain node url
 * @param apiKey to include in the http request header
 * @optional wallet to reuse or add a wallet different than the default (example ledger-wallet)
 */
export function newKitWithApiKey(url: string, apiKey: string, wallet?: ReadOnlyWallet) {
  const options: HttpProviderOptions = setupAPIKey(apiKey)
  return newKit(url, wallet, options)
}

/**
 * Creates a new instance of the `MiniContractKit` with a web3 instance
 * @param web3 Web3 instance
 */
export function newKitFromWeb3(web3: Web3, wallet: ReadOnlyWallet = new LocalWallet()) {
  ensureCurrentProvider(web3)
  return new MiniContractKit(new Connection(web3, wallet))
}

export class MiniContractKit {
  /** core contract's address registry */
  readonly registry: AddressRegistry
  /** factory for subset of core contract's kit wrappers  */
  readonly contracts: MiniContractCache
  /** helper for interacting with CELO & stable tokens */
  readonly celoTokens: CeloTokens

  // TODO: remove once cUSD gasPrice is available on minimumClientVersion node rpc
  gasPriceSuggestionMultiplier = 5

  constructor(readonly connection: Connection) {
    this.registry = new AddressRegistry(connection.web3)
    this.contracts = new MiniContractCache(connection, this.registry)
    this.celoTokens = new CeloTokens(this.contracts, this.registry)
  }

  getWallet() {
    return this.connection.wallet
  }

  // Like get Total Balance on MiniContractKit but does not include locked celo or pending
  async getBalances(address: string): Promise<EachCeloToken<BigNumber>> {
    return {
      ...(await this.celoTokens.balancesOf(address)),
    }
  }

  /**
   * Set CeloToken to use to pay for gas fees
   * @param tokenContract CELO (GoldToken) or a supported StableToken contract
   */
  async setFeeCurrency(tokenContract: CeloTokenContract): Promise<void> {
    const address =
      tokenContract === CeloContract.GoldToken
        ? undefined
        : await this.registry.addressFor(tokenContract)
    if (address) {
      await this.updateGasPriceInConnectionLayer(address)
    }
    this.connection.defaultFeeCurrency = address
  }

  // TODO: remove once cUSD gasPrice is available on minimumClientVersion node rpc
  async updateGasPriceInConnectionLayer(currency: Address) {
    const gasPriceMinimum = await this.contracts.getGasPriceMinimum()
    const rawGasPrice = await gasPriceMinimum.getGasPriceMinimum(currency)
    const gasPrice = rawGasPrice.multipliedBy(this.gasPriceSuggestionMultiplier).toFixed()
    await this.connection.setGasPriceForCurrency(currency, gasPrice)
  }

  async fillGasPrice(tx: CeloTx): Promise<CeloTx> {
    if (tx.feeCurrency && tx.gasPrice === '0') {
      await this.updateGasPriceInConnectionLayer(tx.feeCurrency)
    }
    return this.connection.fillGasPrice(tx)
  }
}

// For easy switching from full contractKit to Mini
export const ContractKit = MiniContractKit
