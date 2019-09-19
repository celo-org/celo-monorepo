import { AccountArgv } from '@celo/celotool/src/cmds/account'
import { portForwardAnd } from '@celo/celotool/src/lib/port_forward'
import { CeloContract, newKit } from '@celo/contractkit'
import { AttestationsWrapper } from '@celo/contractkit/lib/wrappers/Attestations'
import { ActionableAttestation, decodeAttestationCode } from '@celo/walletkit'
import prompts from 'prompts'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import * as yargs from 'yargs'

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
  const kit = newKit('http://localhost:8545')
  const account = (await kit.web3.eth.getAccounts())[0]
  kit.defaultAccount = account

  const attestations = await kit.contracts.getAttestations()
  await printCurrentCompletedAttestations(attestations, argv.phone, account)

  let attestationsToComplete = await attestations.getActionableAttestations(argv.phone, account)

  // Request more attestations
  if (argv.num > attestationsToComplete.length) {
    console.info(`Requesting ${argv.num - attestationsToComplete.length} attestations`)
    await requestMoreAttestations(
      attestations,
      argv.phone,
      argv.num - attestationsToComplete.length
    )
  }

  // Set the wallet address if not already appropriate
  const currentWalletAddress = await attestations.getWalletAddress(account)

  if (currentWalletAddress !== account) {
    const setWalletAddressTx = await attestations.setWalletAddress(account)
    const result = await setWalletAddressTx.send()
    await result.waitReceipt()
  }

  attestationsToComplete = await attestations.getActionableAttestations(argv.phone, account)
  // Find attestations we can reveal/verify
  console.info(`Revealing ${attestationsToComplete.length} attestations`)
  await revealAttestations(attestationsToComplete, attestations, argv.phone)

  await promptForCodeAndVerify(attestations, argv.phone, account)
}

export async function printCurrentCompletedAttestations(
  attestations: AttestationsWrapper,
  phoneNumber: string,
  account: string
) {
  const attestationStat = await attestations.getAttestationStat(phoneNumber, account)

  console.info(
    `Phone Number: ${phoneNumber} has completed ${
      attestationStat.completed
    } attestations out of a total of ${attestationStat.total}`
  )
}

async function requestMoreAttestations(
  attestations: AttestationsWrapper,
  phoneNumber: string,
  attestationsRequested: number
) {
  await attestations
    .approveAttestationFee(CeloContract.StableToken, attestationsRequested)
    .then((txo) => txo.sendAndWaitForReceipt())
  await attestations
    .request(phoneNumber, attestationsRequested, CeloContract.StableToken)
    .then((txo) => txo.sendAndWaitForReceipt())
}

async function revealAttestations(
  attestationsToReveal: ActionableAttestation[],
  attestations: AttestationsWrapper,
  phoneNumber: string
) {
  return Promise.all(
    attestationsToReveal.map(async (attestation) =>
      attestations
        .reveal(phoneNumber, attestation.issuer)
        .then((txo) => txo.sendAndWaitForReceipt())
    )
  )
}

async function verifyCode(
  attestations: AttestationsWrapper,
  base64Code: string,
  phoneNumber: string,
  account: string,
  attestationsToComplete: ActionableAttestation[]
) {
  const code = decodeAttestationCode(base64Code)
  const matchingIssuer = attestations.findMatchingIssuer(
    phoneNumber,
    account,
    code,
    attestationsToComplete.map((a) => a.issuer)
  )

  if (matchingIssuer === null) {
    console.warn('No matching issuer found for code')
    return
  }

  const isValidRequest = await attestations.validateAttestationCode(
    phoneNumber,
    account,
    matchingIssuer,
    code
  )
  if (isValidRequest === NULL_ADDRESS) {
    console.warn('Code was not valid')
    return
  }

  const tx = await attestations.complete(phoneNumber, account, matchingIssuer, code).send()
  return tx.waitReceipt()
}

async function promptForCodeAndVerify(
  attestations: AttestationsWrapper,
  phoneNumber: string,
  account: string
) {
  while (true) {
    const attestationsToComplete = await attestations.getActionableAttestations(
      phoneNumber,
      account
    )

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

    await verifyCode(attestations, userResponse.code, phoneNumber, account, attestationsToComplete)
    await printCurrentCompletedAttestations(attestations, phoneNumber, account)
  }
}
