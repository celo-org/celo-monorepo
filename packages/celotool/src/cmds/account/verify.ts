import { AccountArgv } from '@celo/celotool/src/cmds/account'
import { portForwardAnd } from '@celo/celotool/src/lib/port_forward'
import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import {
  ActionableAttestation,
  AttestationsWrapper,
} from '@celo/contractkit/lib/wrappers/Attestations'
import { base64ToHex } from '@celo/utils/lib/attestations'
import prompts from 'prompts'
import {
  getIdentifierAndPepper,
  printAndIgnoreRequestErrors,
  requestAttestationsFromIssuers,
  requestMoreAttestations,
} from 'src/lib/attestation'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import Web3 from 'web3'
import yargs from 'yargs'

export const command = 'verify'
export const describe = 'command for requesting attestations for a phone number'

interface VerifyArgv extends AccountArgv {
  phone: string
  num: number
  salt: string
  context: string
}

export const builder = (argv: yargs.Argv) => {
  return argv
    .option('phone', {
      type: 'string',
      description: `Phone number to attest to. Should be an E.164 number matching formatted like +451234567890.`,
      demand: 'Please specify phone number to attest to',
    })
    .option('num', {
      type: 'number',
      description: 'Number of attestations to request',
      default: 3,
    })
    .option('salt', {
      type: 'string',
      description: 'The salt to use instead of getting a pepper from ODIS',
      default: '',
    })
    .option('context', {
      type: 'string',
      description: 'ODIS context',
      default: 'mainnet',
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
  const web3: Web3 = new Web3('http://localhost:8545')
  const kit: ContractKit = newKitFromWeb3(web3)
  const account = (await kit.connection.getAccounts())[0]
  kit.defaultAccount = account

  const attestations = await kit.contracts.getAttestations()
  const accounts = await kit.contracts.getAccounts()

  const { identifier, pepper } = await getIdentifierAndPepper(
    kit,
    argv.context,
    account,
    argv.phone,
    argv.salt
  )

  await printCurrentCompletedAttestations(attestations, identifier, argv.phone, account)
  let attestationsToComplete = await attestations.getActionableAttestations(argv.phone, account)

  // Request more attestations
  if (argv.num > attestationsToComplete.length) {
    console.info(
      `Requesting ${argv.num - attestationsToComplete.length} attestations from the smart contract`
    )
    await requestMoreAttestations(
      attestations,
      argv.phone,
      argv.num - attestationsToComplete.length,
      account
    )
  }

  // Set the wallet address if not already appropriate
  const currentWalletAddress = await accounts.getWalletAddress(account)

  if (currentWalletAddress !== account) {
    const setWalletAddressTx = accounts.setWalletAddress(account)
    const result = await setWalletAddressTx.send()
    await result.waitReceipt()
  }

  attestationsToComplete = await attestations.getActionableAttestations(identifier, account)
  // Find attestations we can verify
  console.info(`Requesting ${attestationsToComplete.length} attestations from issuers`)
  const possibleErrors = await requestAttestationsFromIssuers(
    attestationsToComplete,
    attestations,
    argv.phone,
    account,
    pepper
  )
  printAndIgnoreRequestErrors(possibleErrors)
  await promptForCodeAndVerify(attestations, identifier, argv.phone, account)
}

export async function printCurrentCompletedAttestations(
  attestations: AttestationsWrapper,
  identifier: string,
  phoneNumber: string,
  account: string
) {
  const attestationStat = await attestations.getAttestationStat(identifier, account)

  console.info(
    `Phone Number: ${phoneNumber} has completed ${attestationStat.completed} attestations out of a total of ${attestationStat.total}`
  )
}

async function verifyCode(
  attestations: AttestationsWrapper,
  base64Code: string,
  identifier: string,
  phoneNumber: string,
  account: string,
  attestationsToComplete: ActionableAttestation[]
) {
  const code = base64ToHex(base64Code)
  const matchingIssuer = await attestations.findMatchingIssuer(
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
    identifier,
    account,
    matchingIssuer,
    code
  )
  if (!isValidRequest) {
    console.warn('Code was not valid')
    return
  }

  const tx = await attestations
    .complete(phoneNumber, account, matchingIssuer, code)
    .then((x) => x.send())
  return tx.waitReceipt()
}

async function promptForCodeAndVerify(
  attestations: AttestationsWrapper,
  identifier: string,
  phoneNumber: string,
  account: string
) {
  while (true) {
    const attestationsToComplete = await attestations.getActionableAttestations(identifier, account)

    if (attestationsToComplete.length === 0) {
      console.info('No attestations left')
      break
    }

    const userResponse = await prompts({
      type: 'text',
      name: 'code',
      message: `${attestationsToComplete.length} attestations completable. Enter the code here or type exit`,
    })

    if (userResponse.code === 'exit') {
      break
    }

    await verifyCode(
      attestations,
      userResponse.code,
      identifier,
      phoneNumber,
      account,
      attestationsToComplete
    )
    await printCurrentCompletedAttestations(attestations, identifier, phoneNumber, account)
  }
}
