import { ContractKit } from '@celo/contractkit'
import { LocalWallet } from '@celo/contractkit/lib/wallets/local-wallet'
import Web3 from 'web3'
import { KomenciKit } from './src'

const wallet = new LocalWallet()
// const pkey = Web3.utils.randomHex(32)
const pkey = '0xdc771e7878396744e17afcb0dea4cfc96ce6f116107c7bcc0687b812048a2bf7'
wallet.addAccount(pkey)

const provider = new Web3.providers.HttpProvider('https://alfajores-forno.celo-testnet.org')
const web3 = new Web3(provider)
const contractKit = new ContractKit(web3, wallet)
const komenciKit = new KomenciKit(contractKit, {
  account: wallet.getAccounts()[0],
  platform: 'ios',
  url: 'http://localhost:3000',
})

const run = async () => {
  console.log('Starting')
  const startSession = await komenciKit.startSession('token', 'token')
  console.log('StartSession: ', startSession)
  if (!startSession.ok) {
    return
  }
  const deployWallet = await komenciKit.deployWallet()
  console.log('DeployWallet: ', deployWallet)
  if (!deployWallet.ok) {
    return
  }
  const getIdentifier = await komenciKit.getDistributedBlindedPepper('+40723301264', '1.1.0')
  console.log('GetIdentifier: ', getIdentifier)
  if (!getIdentifier.ok) {
    return
  }
  const identifier = getIdentifier.result
  const requestAttestations = await komenciKit.requestAttestations(identifier, 3)
  console.log('RequestAttestations: ', requestAttestations)
  if (!requestAttestations.ok) {
    return
  }
}

run()
