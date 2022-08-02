import { ContractKit, newKit } from '@celo/contractkit'
import { deriveDek, generateKeys, generateMnemonic } from '@celo/cryptographic-utils'
import { CombinerEndpoint } from '@celo/phone-number-privacy-common/lib/interfaces/endpoints'
import {
  normalizeAddressWith0x,
  privateKeyToAddress,
  privateKeyToPublicKey,
  publicKeyToAddress,
} from '@celo/utils/lib/address'
import { OdisUtils } from '../odis'
import { EncryptionKeySigner } from '../odis/query'
require('dotenv').config() // to use .env file

// Variables for general use
let network = 'alfajores' // "mainnet" or "alfajores" (from .env file)
let networkURL: any // Forno URL

// Variables for Alice (sender)
let alicePublicAddress: string
if (!process.env.ALICE_PRIVATE_KEY) {
  throw new Error('Environment variable: ALICE_PRIVATE_KEY is missing')
}
let alicePrivateKey: string = process.env.ALICE_PRIVATE_KEY
let aliceKit: ContractKit // Alice's ContractKit instance

// Variables for Bob (recipient)
let bobPublicAddress: string
let bobPublicKey: string
let bobPrivateKey: string
let bobKit: ContractKit // Bob's ContractKit instance

// Variables for Escrow payment
let escrowContract: any // instance of the Escrow.sol contract wrapper
let identifier: string // obfuscated representation of user's identity (e.g. phone number)
let paymentId: string
let secret: string
let escrowTokenName: string // token name to be sent from Alice to Bon
let escrowToken: any // ERC20 token wrapper
let escrowAmount: number // amount of tokens to be sent from Alice to Bob
let expirySecondsBeforeRevocation: number // minimum number of seconds before Alice can revoke the escrow payment

// Variables for third party gas station
let gasKit: ContractKit
if (!process.env.GAS_STATION_PUBLIC_ADDRESS) {
  throw new Error('Environment variable: GAS_STATION_PUBLIC_ADDRESS is missing')
}
let gasPublicAddress: string = process.env.GAS_STATION_PUBLIC_ADDRESS
if (!process.env.GAS_STATION_PRIVATE_KEY) {
  throw new Error('Environment variable: GAS_STATION_PRIVATE_KEY is missing')
}
let gasPrivateKey: string = process.env.GAS_STATION_PRIVATE_KEY

// Variables for attestations
let attestationsContract: any // instance of the Attestations.sol contract wrapper
let accountsContract: any // instance of the Accounts.sol contract wrapper
if (!process.env.PHONE_NUMBER) {
  throw new Error('Environment variable: PHONE_NUMBER is missing')
}
let plainTextPhoneNumber: string = process.env.PHONE_NUMBER
let phoneNumberHash: string
let odisPepper: string
let minimumNumberOfAttestations: number
let odisUrl: string
let odisPublicKey: string

/* 
FUNCTIONs SHARED ACROSS FLOWS
*/
async function init() {
  // sets network URL
  switch (network) {
    case 'alfajores':
      networkURL = 'https://alfajores-forno.celo-testnet.org'
      break
    case 'mainnet':
      networkURL = 'https://forno.celo.org'
      break
    default:
      console.log('Set NETWORK to either alfajores or mainnet')
  }

  // creates ContractKit instance for Alice
  aliceKit = await newKit(networkURL)
  if (typeof aliceKit == 'undefined') {
    throw new Error('variable aliceKit undefined')
  }
  aliceKit.addAccount(alicePrivateKey)

  // sets up your account
  alicePublicAddress = normalizeAddressWith0x(privateKeyToAddress(alicePrivateKey))
  aliceKit.defaultAccount = alicePublicAddress

  // checks account is connected as expected
  console.log(`Alice's public address is: ${alicePublicAddress} \n`)
  // prints Alice's account balance on the relevant network (to check if connection is established as expected)
  const balance: any = await aliceKit.celoTokens.balancesOf(alicePublicAddress)
  console.log(`Alice's cUSD balance is: ${aliceKit.web3.utils.fromWei(balance.cUSD.toFixed())} \n`)
  //   console.log(`Alice's Celo balance is: ${balance.CELO.toFixed()} \n`)

  // creates EscrowWrapper instance
  escrowContract = await aliceKit.contracts.getEscrow()

  // creates Attestation
  attestationsContract = await aliceKit.contracts.getAttestations()
}

/* 
OPTION: SECRET-BASED ESCROW FLOW
*/

// Alice generates inputs necessary to make escrow payment
async function aliceCreatesRandomTemporaryKeys() {
  const mnemonic = await generateMnemonic()
  console.log(
    `The mnemonic used to generate temporary keys for the escrow payment is:  \n"${mnemonic}"\n`
  ) // print for debugging
  const temporaryKeys = await generateKeys(mnemonic)
  const publicKey = temporaryKeys.publicKey
  paymentId = publicKeyToAddress(publicKey)
  secret = temporaryKeys.privateKey

  // Prints to help visualise
  console.log(`Escrow paymentId is: ${paymentId}\n`)
  console.log(`Escrow secret is: ${secret}\n`)
}

// Alice escrows the payment
async function aliceMakesEscrowPayment(
  escrowAmount: number,
  escrowTokenName: any,
  identifier: string,
  paymentId: string,
  expirySecondsBeforeRevocation: number,
  _minimumNumberOfAttestations: number
) {
  // gets token wrapper
  switch (escrowTokenName) {
    case 'cUSD':
      escrowToken = await aliceKit.contracts.getStableToken()
      break
    case 'CELO':
      escrowToken = await aliceKit.contracts.getGoldToken()
      break
    default:
      // default cUSD
      escrowToken = await aliceKit.contracts.getStableToken()
      break
  }

  // converts escrow amount into wei: https://web3js.readthedocs.io/en/v1.2.11/web3-utils.html?highlight=towei#towei
  const contractDecimalEscrowAmount = aliceKit.web3.utils.toWei(escrowAmount.toString())

  // approves escrow transfer
  await escrowToken
    .approve(escrowContract.address, contractDecimalEscrowAmount)
    .sendAndWaitForReceipt()

  /*   
  INVARIANT: ALICE'S ACCOUNT HAS A cUSD BALANCE 
  */

  // makes escrow payment
  // from: https://github.com/celo-org/celo-monorepo/blob/cfbb0bdcaf04d6132a432ab0c4b82b0ca4911a68/packages/celotool/src/cmds/account/invite.ts#L87
  const escrowTransfer = await escrowContract.transfer(
    identifier,
    escrowToken.address,
    contractDecimalEscrowAmount,
    expirySecondsBeforeRevocation,
    paymentId,
    0
  )

  // confirms escrow payment
  const transferReceipt = await escrowTransfer.sendAndWaitForReceipt()
  console.log(
    `Alice's payment into escrow was successful! \nSee transaction at: https://alfajores-blockscout.celo-testnet.org/tx/${transferReceipt.transactionHash} \n`
  )

  //   const id = await escrowContract.getSentPaymentIds(alicePublicAddress)
  //   console.log("id", id)
}

// Alice revokes escrow payment
async function aliceRevokeEscrowPayment() {
  // Wait for expirySeconds before revoking
  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms)) // from: https://stackoverflow.com/a/47480429
  await delay(5000) // wait 5 seconds

  const escrowRevocation = await escrowContract.revoke(paymentId)
  const revocationReceipt = await escrowRevocation.sendAndWaitForReceipt()
  console.log(
    `Alice's escrow payment revocation was successful! \n-paymentID = ${paymentId})\nSee transaction at: https://alfajores-blockscout.celo-testnet.org/tx/${revocationReceipt.transactionHash} \n`
  )
}

// Bob creates a Celo account and connects account to contractkit
async function bobCreatesAccount() {
  // creates accounts for Bob
  const bobMnemonic = await generateMnemonic()
  console.log(`Bob's mnemonic:  \n"${bobMnemonic}"\n`) // print for debugging
  const bobKeys = await generateKeys(bobMnemonic)
  bobPublicKey = bobKeys.publicKey
  bobPublicAddress = publicKeyToAddress(bobPublicKey)
  bobPrivateKey = bobKeys.privateKey

  // creates ContractKit instance for Bob
  bobKit = await newKit(networkURL)
  if (typeof bobKit == 'undefined') {
    throw new Error('variable bobKit undefined')
  }
  bobKit.addAccount(bobPrivateKey)
  bobKit.defaultAccount = bobPublicAddress
}

// Bob withdraws escrow payment from Alice
async function bobWithdrawsEscrowPayment() {
  // Temporary: Create new kit instance to sign with `secret`
  // TODO Arthur: find out how to add multiple accounts to kit instance
  const secretKit = await newKit(networkURL)
  if (typeof secretKit == 'undefined') {
    throw new Error('variable secretKit undefined')
  }
  secretKit.addAccount(secret)
  secretKit.defaultAccount = paymentId

  // Get { v, r, s } arguments
  // From Valora: https://github.com/valora-inc/wallet/blob/178a0ac8e0bce10e308a7e4f0a8367a254f5f84d/src/escrow/saga.ts#L228-L231
  const msgHash = secretKit.connection.web3.utils.soliditySha3({
    type: 'address',
    value: bobPublicAddress,
  })
  // From Valora: https://github.com/valora-inc/wallet/blob/178a0ac8e0bce10e308a7e4f0a8367a254f5f84d/src/escrow/saga.ts#L233
  const { r, s, v }: any = secretKit.connection.web3.eth.accounts.sign(msgHash!, secret)

  // INVARIANT: BOB HAS AN ACCOUNT WITH NON-ZERO BALANCE AND KNOWS THE PAYMENTID+SECRET
  console.log(`Bob knows: \n-paymentID = ${paymentId} \n-secret = ${secret}\n`)

  const bobEscrowWrapper = await bobKit.contracts.getEscrow()
  const escrowWithdrawal = await bobEscrowWrapper.withdraw(paymentId, v, r, s)
  const withdrawalReceipt = await escrowWithdrawal.sendAndWaitForReceipt()
  console.log(
    `Bob's withdrawal from escrow was successful! \nSee transaction at: https://alfajores-blockscout.celo-testnet.org/tx/${withdrawalReceipt.transactionHash} \n`
  )

  // Checks Bob's new balance
  const balance: any = await bobKit.celoTokens.balancesOf(bobPublicAddress)
  console.log(`Bob's new cUSD balance is: ${bobKit.web3.utils.fromWei(balance.cUSD.toFixed())}\n`)
}

/* 
OPTION: ATTESTATION-BASED ESCROW FLOW
*/

// From: https://github.com/critesjosh/register-number/blob/1638bc817a1e8ad1f59edefff81364080a5ff3ef/index.js#L244-L283
async function anyoneQueriesIdentifier() {
  // generate data encryption key (DEK)
  const mnemonic = await generateMnemonic()
  const dataEncryptionKeys = await deriveDek(mnemonic)
  const dekPrivateKey = dataEncryptionKeys.privateKey
  const dekPublicKey = privateKeyToPublicKey(dataEncryptionKeys.privateKey)
  const dekPublicAddress = privateKeyToAddress(dataEncryptionKeys.privateKey)

  console.log(`dekPublicKey: ${dekPublicKey}`)
  console.log(`dekPublicAddress: ${dekPublicAddress}`)
  console.log(`dekPrivateKey: ${dekPrivateKey}`)

  // set up DEK
  // const dekKit = await newKit(networkURL)
  // if (typeof dekKit == "undefined") {
  //   throw new Error("variable aliceKit undefined")
  // }
  // dekKit.addAccount(dekPrivateKey)

  // register data encryption key (DEK) on-chain
  // from: https://docs.celo.org/developer-resources/contractkit/data-encryption-key
  accountsContract = await aliceKit.contracts.getAccounts()

  const setDEK = await accountsContract
    .setAccountDataEncryptionKey(dekPublicKey)
    .sendAndWaitForReceipt()

  const dek = await accountsContract.getDataEncryptionKey(alicePublicAddress)
  console.log(
    `Alice's data encryption key registration was successful!
    - DEK = ${dek}`
  )

  console.log('here')

  // set up environment for odis query
  // from: https://docs.celo.org/developer-guide/contractkit/odis
  const authSigner: EncryptionKeySigner = {
    authenticationMethod: OdisUtils.Query.AuthenticationMethod.ENCRYPTION_KEY,
    rawKey: dekPrivateKey,
  }

  console.log('here')

  switch (network) {
    case 'alfajores':
      odisUrl = 'https://us-central1-celo-phone-number-privacy.cloudfunctions.net'
      odisPublicKey =
        'kPoRxWdEdZ/Nd3uQnp3FJFs54zuiS+ksqvOm9x8vY6KHPG8jrfqysvIRU0wtqYsBKA7SoAsICMBv8C/Fb2ZpDOqhSqvr/sZbZoHmQfvbqrzbtDIPvUIrHgRS0ydJCMsA'
      break
    case 'mainnet':
      odisUrl = 'https://us-central1-celo-pgpnp-mainnet.cloudfunctions.net'
      odisPublicKey =
        'FvreHfLmhBjwxHxsxeyrcOLtSonC9j7K3WrS4QapYsQH6LdaDTaNGmnlQMfFY04Bp/K4wAvqQwO9/bqPVCKf8Ze8OZo8Frmog4JY4xAiwrsqOXxug11+htjEe1pj4uMA'
      break
    default:
      console.log(`Set the NETWORK environment variable to either 'alfajores' or 'mainnet'`)
  }

  // const serviceContext = {
  //   odisUrl,
  //   odisPubKey: odisPublicKey,
  // }

  console.log(
    'OdisUtils.Query.getServiceContext(network)',
    OdisUtils.Query.getServiceContext(network)
  )

  /* 
  DEBUGGING: `TypeError: Cannot read properties of undefined (reading 'PNP_SIGN')`
  */
  console.log(`plainTextPhoneNumber = ${plainTextPhoneNumber}`)
  console.log(`alicePublicAddress = ${alicePublicAddress}`)
  console.log(`authSigner = ${authSigner.authenticationMethod}`)
  //  console.log(`serviceContext = ${serviceContext.odisUrl}`)

  console.log('\nhere')
  console.log(`CombinerEndpoint`, CombinerEndpoint)
  /* 
 WORKS UP TO HERE
 */
  // query odis for phone number pepper
  const odisResponse = await OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
    plainTextPhoneNumber,
    alicePublicAddress,
    authSigner,
    OdisUtils.Query.getServiceContext(network)
  )

  console.log('here')

  odisPepper = odisResponse.pepper
  phoneNumberHash = odisResponse.phoneHash

  // check odis query was successful
  console.log(`Pepper: ${odisPepper}`)
  console.log(`Phone hash: ${phoneNumberHash}`)
}

/* 
HELPER FUNCTIONS
*/

async function gasStationFundsBobAccount() {
  // INVARIANT: Bob doesn't have CELO/cSTABLES to pay gas fees, so gas station funds his account

  // connect gas station
  gasKit = await newKit(networkURL)
  if (typeof gasKit == 'undefined') {
    throw new Error('variable gasKit undefined')
  }
  gasKit.addAccount(gasPrivateKey)
  gasKit.defaultAccount = gasPublicAddress

  // Shows gas station is connected and has sufficient funds
  const gasStationBalance: any = await gasKit.celoTokens.balancesOf(gasPublicAddress)
  console.log(
    `Gas station details: 
    -Public address = ${gasPublicAddress} 
    -Private Key: ${gasPrivateKey}
    -Gas station's CELO balance is: ${gasKit.web3.utils.fromWei(gasStationBalance.CELO.toFixed())}
    -Gas station's cUSD balance is: ${gasKit.web3.utils.fromWei(
      gasStationBalance.cUSD.toFixed()
    )}\n`
  )

  // Gas station makes small transfer to Bob
  // get token contract
  const stableToken = await gasKit.contracts.getStableToken()
  const goldToken = await gasKit.contracts.getGoldToken()
  // approve
  await stableToken
    .approve(bobPublicAddress, gasKit.web3.utils.toWei('0.01'))
    .sendAndWaitForReceipt()
  await goldToken.approve(bobPublicAddress, gasKit.web3.utils.toWei('0.01')).sendAndWaitForReceipt()

  // transfer CELO
  // const gasFeeTransferInCELO = await goldToken.transfer(
  //   bobPublicAddress,
  //   gasKit.web3.utils.toWei("0.01")
  // )
  // const _gasFeeTransferInCELOReceipt =
  //   await gasFeeTransferInCELO.sendAndWaitForReceipt()
  // transfer cUSD
  // const gasFeeTransferInStabletoken = await stableToken.transfer(
  //   bobPublicAddress,
  //   gasKit.web3.utils.toWei("0.01")
  // )
  // const gasFeeTransferInStabletokenReceipt =
  //   await gasFeeTransferInStabletoken.sendAndWaitForReceipt()

  console.log(`Gas station successfully funded Bob's account with CELO and cUSD!\n`)

  const bobBalance: any = await bobKit.celoTokens.balancesOf(bobPublicAddress)
  console.log(
    `Bob's newly created account details: 
    -Public address = ${bobPublicAddress} 
    -Private Key: ${bobPrivateKey}
    -Bob's CELO balance is: ${bobKit.web3.utils.fromWei(bobBalance.CELO.toFixed())}
    -Bob's cUSD balance is: ${bobKit.web3.utils.fromWei(bobBalance.cUSD.toFixed())}\n`
  )
}

// CLI input helper function
// source: https://github.com/critesjosh/register-number/blob/1638bc817a1e8ad1f59edefff81364080a5ff3ef/index.js#L22-L34
// function ask(query: string) {
//   const readline = require("readline").createInterface({
//     input: process.stdin,
//     output: process.stdout,
//   })

//   return new Promise((resolve) =>
//     readline.question(query, (ans: unknown) => {
//       readline.close()
//       resolve(ans)
//     })
//   )
// }

// helper function to run/disable certain components when testing
async function main() {
  /* UNCOMMENT
    // asks user to choose between two escrow flows
    let escrowOptionToVerifyProofOfIdentity: any = await ask(
      "What escrow option would you like to test? (secret-based/attestation-based)"
    )
  */

  // Setting
  let escrowOptionToVerifyProofOfIdentity = 'attestation-based' // can be 'secret-based' or 'attestation-based'

  // executes escrow flow chosen above
  switch (escrowOptionToVerifyProofOfIdentity) {
    case 'secret-based':
      await init()

      // escrow payment settings
      escrowAmount = 0.1
      escrowTokenName = 'cUSD' // default: 'cUSD' (can be 'CELO' in this example)
      identifier = '0x0000000000000000000000000000000000000000000000000000000000000000' // default (cannot be changed in this escrow flow)
      expirySecondsBeforeRevocation = 1
      minimumNumberOfAttestations = 0 // default (cannot be changed in this escrow flow)

      // test escrow payment
      await aliceCreatesRandomTemporaryKeys()
      await aliceMakesEscrowPayment(
        escrowAmount,
        escrowTokenName,
        identifier,
        paymentId,
        expirySecondsBeforeRevocation,
        minimumNumberOfAttestations
      )

      // test escrow revocation
      await aliceRevokeEscrowPayment()

      // escrow payment settings
      escrowAmount = 0.1

      // test escrow payment
      await aliceMakesEscrowPayment(
        escrowAmount,
        escrowTokenName,
        identifier,
        paymentId,
        expirySecondsBeforeRevocation,
        minimumNumberOfAttestations
      )

      // test withdrawal
      await bobCreatesAccount()
      await gasStationFundsBobAccount()
      await bobWithdrawsEscrowPayment()
      break

    case 'attestation-based':
      await init()
      await anyoneQueriesIdentifier() // Alice
      // await anyoneCreatesDeterministicTemporaryKeys()
      // await aliceMakesEscrowPayment()

      // await bobCreatesAccount()
      // await gasStationFundsBobAccount()
      // anyoneQueriesIdentifier()  // Bob
      // await anyoneCreatesDeterministicTemporaryKeys()
      // Bob receives min number of attestations (verifies phone number ownership)
      // await bobWithdrawsEscrowPayment()

      break
  }
}

// main function called execution
main()

/* TODO:
- [ ] refactor to use 1 single kit instance instead of aliceKit, bobKit, gasKit 
*/
