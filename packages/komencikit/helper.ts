import { ContractKit } from '@celo/contractkit'
import { LocalWallet } from '@celo/contractkit/lib/wallets/local-wallet'
import Web3 from 'web3'
import { KomenciKit } from './src'

export const wallet = new LocalWallet()
const pkey = Web3.utils.randomHex(32)
// const pkey = '0xdc771e7878396744e17afcb0dea4cfc96ce6f116107c7bcc0687b812048a2bf7'
wallet.addAccount(pkey)
console.log('Private key: ', pkey)

const provider = new Web3.providers.HttpProvider('https://alfajores-forno.celo-testnet.org')
export const web3 = new Web3(provider)
export const contractKit = new ContractKit(web3, wallet)
const account = wallet.getAccounts()[0]
console.log('Account: ', account)
const komenciKit = new KomenciKit(contractKit, {
  account,
  platform: 'ios',
  url: 'http://localhost:3000',
})

const run = async () => {
  const attestations = await contractKit.contracts.getAttestations()
  console.log('Attestations: ', attestations.address)
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
  // cached:
  const identifier = '0x59c637d9c774d242dc36bdb0445e29fa79c69b74ef70b6d1a5c407c1db6b4110'
  // const getIdentifier = await komenciKit.getDistributedBlindedPepper('+40723301264', '1.1.0')
  // console.log('GetIdentifier: ', getIdentifier)
  // if (!getIdentifier.ok) {
  //   return
  // }
  // const identifier = getIdentifier.result
  const statsBefore = await attestations.getAttestationStat(identifier, account)
  console.log('Before ===== ')
  console.log(statsBefore)
  const requestAttestations = await komenciKit.requestAttestations(identifier, 1)
  const statsAfter = await attestations.getAttestationStat(identifier, deployWallet.result)
  console.log('After ===== ')
  console.log(statsAfter)
  console.log('RequestAttestations: ', requestAttestations)
  if (!requestAttestations.ok) {
    return
  }

  const events = await attestations.getPastEvents('AttestationsRequested', {
    fromBlock: requestAttestations.result.blockNumber,
    toBlock: requestAttestations.result.blockNumber,
  })
  console.log(events)

  const selectIssuers = await komenciKit.selectIssuers(identifier)
  if (!selectIssuers.ok) {
    return
  }
  console.log(selectIssuers)
  const issuersEvents = await attestations.getPastEvents('AttestationIssuerSelected', {
    fromBlock: selectIssuers.result.blockNumber,
    toBlock: selectIssuers.result.blockNumber,
  })
  console.log(issuersEvents)
}

run()
