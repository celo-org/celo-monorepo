import { ContractKit } from '@celo/contractkit'
import { LocalWallet } from '@celo/contractkit/lib/wallets/local-wallet'
import Web3 from 'web3'

// const WALLET_ADDRESS = '0xa7d74cb4fca9458757cfc8b90d9b38a126f68b47'
const WALLET_PRIVATE_KEY = '0x7403568bea8a303d7645bb66f10c9df31fe549cb07a7a908cb9a6cc17b1d6415'
// const MTW_DEPLOYER_ADDRESS = '0x47b05993C360dEA811ACe7eC725897aCB74AaBA5'

const wallet = new LocalWallet()
wallet.addAccount(WALLET_PRIVATE_KEY)

const provider = new Web3.providers.HttpProvider('https://alfajores-forno.celo-testnet.org')
const web3 = new Web3(provider)
const contractKit = new ContractKit(web3, wallet)

const run = async () => {
  const mtWallet = await contractKit.contracts.getMetaTransactionWallet(process.argv[2])
  console.log(await mtWallet.signer())
}

run()
