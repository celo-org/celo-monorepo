import { base64ToHex, hexToBuffer } from '@celo/base'
import {
  printAndIgnoreRequestErrors,
  requestAttestationsFromIssuers,
} from '@celo/celotool/lib/lib/attestation'
import { ContractKit } from '@celo/contractkit'
import { WasmBlsBlindingClient } from '@celo/contractkit/lib/identity/odis/bls-blinding-client'
import { LocalWallet } from '@celo/contractkit/lib/wallets/local-wallet'
import { compressedPubKey } from '@celo/utils/src/dataEncryptionKey'
import Web3 from 'web3'
import { KomenciKit } from '../src'

const WALLET_IMPLEMENTATION_ADDRESS = '0x88a2b9B8387A1823D821E406b4e951337fa1D46D'
const ODIS_PUB_KEY =
  'kPoRxWdEdZ/Nd3uQnp3FJFs54zuiS+ksqvOm9x8vY6KHPG8jrfqysvIRU0wtqYsBKA7SoAsICMBv8C/Fb2ZpDOqhSqvr/sZbZoHmQfvbqrzbtDIPvUIrHgRS0ydJCMsA'

const wallet = new LocalWallet()
const pkey = Web3.utils.randomHex(32)
const dek = Web3.utils.randomHex(32)
// const pkey = '0xdc771e7878396744e17afcb0dea4cfc96ce6f116107c7bcc0687b812048a2bf7'
wallet.addAccount(pkey)
console.log('Private key: ', pkey)
console.log('Data encryption key: ', dek)

const provider = new Web3.providers.HttpProvider('https://alfajores-forno.celo-testnet.org')
const web3 = new Web3(provider)
const contractKit = new ContractKit(web3, wallet)
const account = wallet.getAccounts()[0]
console.log('Account: ', account)
const dekPublicKey = compressedPubKey(hexToBuffer(dek))
console.log('DEK PublicKey: ', dekPublicKey)
const komenciKit = new KomenciKit(contractKit, account, {
  url: 'https://komenci.celo-networks-dev.org',
})

const readline = require('readline')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const run = async () => {
  const attestations = await contractKit.contracts.getAttestations()
  console.log('Attestations: ', attestations.address)
  console.log('Starting')
  const startSession = await komenciKit.startSession('captcha-token')

  console.log('StartSession: ', startSession)
  if (!startSession.ok) {
    return
  }
  const checkSession = await komenciKit.checkSession()
  console.log(checkSession)
  if (!checkSession.ok) {
    return
  }
  const deployWallet = await komenciKit.deployWallet(WALLET_IMPLEMENTATION_ADDRESS)
  console.log('DeployWallet: ', deployWallet)
  if (!deployWallet.ok) {
    return
  }
  const walletAddress = deployWallet.result
  // cached:
  const phoneNumber = '+40723301264'
  // const identifier = '0x59c637d9c774d242dc36bdb0445e29fa79c69b74ef70b6d1a5c407c1db6b4110'

  const blsBlindingClient = new WasmBlsBlindingClient(ODIS_PUB_KEY)
  const getIdentifier = await komenciKit.getDistributedBlindedPepper(
    phoneNumber,
    'komenci-test',
    blsBlindingClient
  )
  console.log('GetIdentifier: ', getIdentifier)
  if (!getIdentifier.ok) {
    return
  }
  const identifier = getIdentifier.result.identifier
  const pepper = getIdentifier.result.pepper
  const checkSession2 = await komenciKit.checkSession()
  console.log(checkSession2)
  if (!checkSession2.ok) {
    return
  }

  // Set Account with DEK
  console.log('Registering DEK with setAccount')
  const setAccount = await komenciKit.setAccount(walletAddress, '', dekPublicKey, account)
  console.log('setAccount: ', setAccount)
  if (!setAccount.ok) {
    return
  }

  const approveRes = await komenciKit.approveAttestations(walletAddress, 3)
  console.log(approveRes)
  if (!approveRes.ok) {
    return
  }
  const statsBefore = await attestations.getAttestationStat(identifier, walletAddress)
  console.log('Before ===== ')
  console.log(statsBefore)
  const requestAttestations = await komenciKit.requestAttestations(walletAddress, identifier, 3)
  const statsAfter = await attestations.getAttestationStat(identifier, walletAddress)
  console.log('After ===== ')
  console.log(statsAfter)
  console.log('RequestAttestations: ', requestAttestations)
  if (!requestAttestations.ok) {
    return
  }

  const events = await attestations.getPastEvents(attestations.eventTypes.AttestationsRequested, {
    fromBlock: requestAttestations.result.blockNumber,
    toBlock: requestAttestations.result.blockNumber,
  })
  console.log(events)

  const selectIssuers = await komenciKit.selectIssuers(walletAddress, identifier)
  if (!selectIssuers.ok) {
    return
  }
  console.log(selectIssuers)
  const issuersEvents = await attestations.getPastEvents(
    attestations.eventTypes.AttestationIssuerSelected,
    {
      fromBlock: selectIssuers.result.blockNumber,
      toBlock: selectIssuers.result.blockNumber,
    }
  )
  console.log(issuersEvents)
  console.log('====================')
  let attestationsToComplete = await attestations.getActionableAttestations(
    identifier,
    walletAddress
  )
  console.log(attestationsToComplete)
  console.log('====================')
  const possibleErrors = await requestAttestationsFromIssuers(
    attestationsToComplete,
    attestations,
    phoneNumber,
    walletAddress,
    pepper
  )
  printAndIgnoreRequestErrors(possibleErrors)
  while (true) {
    attestationsToComplete = await attestations.getActionableAttestations(identifier, walletAddress)

    if (attestationsToComplete.length === 0) {
      break
    }

    console.log(attestationsToComplete)
    console.log('====================')

    await new Promise((resolve) => {
      rl.question('Enter code: ', async (base64Code: string) => {
        if (base64Code === 'exit') {
          process.exit(0)
        }
        const code = base64ToHex(base64Code)
        const matchingIssuer = await attestations.findMatchingIssuer(
          identifier,
          walletAddress,
          code,
          attestationsToComplete.map((a) => a.issuer)
        )

        if (matchingIssuer === null) {
          console.warn('No matching issuer found for code')
          resolve()
          return
        }

        const isValidRequest = await attestations.validateAttestationCode(
          identifier,
          walletAddress,
          matchingIssuer,
          code
        )
        if (!isValidRequest) {
          console.warn('Code was not valid')
          resolve()
          return
        }

        const completeResult = await komenciKit.completeAttestation(
          walletAddress,
          identifier,
          matchingIssuer,
          code
        )

        console.log(completeResult)
        resolve()
      })
    })
  }
}

run()
