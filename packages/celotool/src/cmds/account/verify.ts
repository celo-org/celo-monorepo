import { AccountArgv } from '@celo/celotool/src/cmds/account'
import { portForwardAnd } from '@celo/celotool/src/lib/port_forward'
import {
  ActionableAttestation,
  // @ts-ignore
  Attestations,
  decodeAttestationCode,
  findMatchingIssuer,
  getActionableAttestations,
  getWalletAddress,
  makeApproveAttestationFeeTx,
  makeCompleteTx,
  makeRequestTx,
  makeRevealTx,
  makeSetWalletAddressTx,
  StableToken,
  validateAttestationCode,
} from '@celo/contractkit'
// @ts-ignore
import { Attestations as AttestationsType } from '@celo/contractkit/lib/types/Attestations'
import { StableToken as StableTokenType } from '@celo/contractkit/lib/types/StableToken'
import { PhoneNumberUtils } from '@celo/utils'
import prompts from 'prompts'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { sendTransaction } from 'src/lib/transactions'
import * as yargs from 'yargs'

const Web3 = require('web3')

export const command = 'verify'
export const describe = 'command for requesting attestations for a phone number'

interface VerifyArgv extends AccountArgv {
  phone: string
  num: number
}

export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

export const builder = (argv: yargs.Argv) => {
  return argv
    .option('phone', {
      type: 'string',
      description: 'Phone number to attest to,',
      demand: 'Please specify phone number to attest to',
    })
    .option('num', {
      type: 'number',
      description: 'Number of attestations to request',
      default: 3,
    })
}

export const handler = async (argv: VerifyArgv) => {
  await switchToClusterFromEnv(false)

  try {
    await portForwardAnd(argv.celoEnv, verifyCmd.bind(null, argv))
  } catch (error) {
    console.error(`Unable to attest ${argv.phone}`)
    console.error(error)
    process.exit(1)
  }
}

async function verifyCmd(argv: VerifyArgv) {
  const web3 = new Web3('http://localhost:8545')

  const account = (await web3.eth.getAccounts())[0]
  const attestations = await Attestations(web3)
  const stableToken = await StableToken(web3)
  const phoneHash = PhoneNumberUtils.getPhoneHash(argv.phone)

  await printCurrentCompletedAttestations(attestations, argv.phone, account)

  // Request more attestations
  if (argv.num > 0) {
    console.info(`Requesting ${argv.num} attestations`)
    await requestMoreAttestations(attestations, stableToken, phoneHash, argv.num)
  }

  // Set the wallet address if not already appropriate
  const currentWalletAddress = await getWalletAddress(attestations, account)

  if (currentWalletAddress !== account) {
    const setWalletAddressTx = makeSetWalletAddressTx(attestations, account)
    await sendTransaction(setWalletAddressTx)
  }

  // Find attestations we can reveal/verify
  const attestationsToComplete = await getActionableAttestations(attestations, phoneHash, account)
  console.info(`Revealing ${attestationsToComplete.length} attestations`)
  await revealAttestations(attestationsToComplete, attestations, argv.phone)

  await promptForCodeAndVerify(attestations, argv.phone, account)
}

export async function printCurrentCompletedAttestations(
  attestations: AttestationsType,
  phoneNumber: string,
  account: string
) {
  const attestationStat = await attestations.methods
    .getAttestationStats(PhoneNumberUtils.getPhoneHash(phoneNumber), account)
    .call()

  console.info(
    `Phone Number: ${phoneNumber} has completed ${
      attestationStat[0]
    } attestations out of a total of ${attestationStat[1]}`
  )
}

async function requestMoreAttestations(
  attestations: AttestationsType,
  stableToken: StableTokenType,
  phoneHash: string,
  attestationsRequested: number
) {
  const approveTx = await makeApproveAttestationFeeTx(
    attestations,
    stableToken,
    attestationsRequested
  )
  await sendTransaction(approveTx)

  const requestTx = makeRequestTx(attestations, phoneHash, attestationsRequested, stableToken)
  await sendTransaction(requestTx)
}

async function revealAttestations(
  attestationsToReveal: ActionableAttestation[],
  attestations: AttestationsType,
  phoneNumber: string
) {
  return Promise.all(
    attestationsToReveal.map(async (attestation) => {
      const tx = await makeRevealTx(attestations, phoneNumber, attestation.issuer)
      return sendTransaction(tx)
    })
  )
}

async function verifyCode(
  attestations: AttestationsType,
  base64Code: string,
  phoneHash: string,
  account: string,
  attestationsToComplete: ActionableAttestation[]
) {
  const code = decodeAttestationCode(base64Code)
  const matchingIssuer = findMatchingIssuer(
    phoneHash,
    account,
    code,
    attestationsToComplete.map((a) => a.issuer)
  )

  if (matchingIssuer === null) {
    console.warn('No matching issuer found for code')
    return
  }

  const isValidRequest = await validateAttestationCode(
    attestations,
    phoneHash,
    account,
    matchingIssuer,
    code
  )
  if (isValidRequest === NULL_ADDRESS) {
    console.warn('Code was not valid')
    return
  }

  const verifyTx = makeCompleteTx(attestations, phoneHash, account, matchingIssuer, code)
  await sendTransaction(verifyTx)
}

async function promptForCodeAndVerify(
  attestations: AttestationsType,
  phoneNumber: string,
  account: string
) {
  const phoneHash = PhoneNumberUtils.getPhoneHash(phoneNumber)
  while (true) {
    const attestationsToComplete = await getActionableAttestations(attestations, phoneHash, account)

    if (attestationsToComplete.length === 0) {
      console.info('No attestations left')
      break
    }

    const userResponse = await prompts({
      type: 'text',
      name: 'code',
      message: `${
        attestationsToComplete.length
      } attestations completable. Enter the code here or type exit`,
    })

    if (userResponse.code === 'exit') {
      break
    }

    await verifyCode(attestations, userResponse.code, phoneHash, account, attestationsToComplete)
    await printCurrentCompletedAttestations(attestations, phoneNumber, account)
  }
}
