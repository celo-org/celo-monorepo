/* tslint:disable no-console */

import { Address, CeloTransactionParams, ContractKit, newKit } from '@celo/contractkit'
import {
  ActionableAttestation,
  AttestationsWrapper,
} from '@celo/contractkit/lib/wrappers/Attestations'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import moment from 'moment'
import sleep from 'sleep-promise'
import {
  fetchLatestMessagesFromToday,
  findValidCode,
  getPhoneNumber,
  printAndIgnoreRequestErrors,
  requestAttestationsFromIssuers,
  requestMoreAttestations,
} from 'src/lib/attestation'
import { envVar, fetchEnv } from 'src/lib/env-utils'
import { AccountType, generatePrivateKey } from 'src/lib/generate_utils'
import { ensure0x } from 'src/lib/utils'
import twilio, { Twilio } from 'twilio'
import { Argv } from 'yargs'
import { BotsArgv } from '../bots'

export const command = 'auto-verify'

export const describe = 'command for verifying an arbitrary twilio phone number'

interface AutoVerifyArgv extends BotsArgv {
  initialWaitSeconds: number
  inBetweenWaitSeconds: number
  attestationMax: number
  celoProvider: string
}

export const builder = (yargs: Argv) => {
  return yargs
    .option('initialWaitSeconds', {
      type: 'number',
      description: 'The range of the initial wait',
      required: true,
    })
    .option('inBetweenWaitSeconds', {
      type: 'number',
      description: 'Betweeen each attsetation how long to wait',
      required: true,
    })
    .option('attestationMax', {
      type: 'number',
      description: 'How many attestations should be requesteed at maximum',
      required: true,
    })
    .option('celoProvider', {
      type: 'string',
      description: 'The node to use',
      default: 'http://localhost:8545',
    })
}

const ADDRESS_SID = 'ADfc7d865c6bb0489ff21f29fa0b0531fa'

export const handler = async function autoVerify(argv: AutoVerifyArgv) {
  try {
    const kit = newKit(argv.celoProvider)
    const mnemonic = fetchEnv(envVar.MNEMONIC)
    const validator0Key = ensure0x(generatePrivateKey(mnemonic, AccountType.VALIDATOR, 0))
    const validator0Address = privateKeyToAddress(validator0Key)
    const clientKey = ensure0x(generatePrivateKey(mnemonic, AccountType.ATTESTATION, 0))
    const clientAddress = privateKeyToAddress(clientKey)
    kit.addAccount(validator0Key)
    kit.addAccount(clientKey)

    await fundClient(kit, validator0Address, clientAddress, argv.attestationMax)

    const twilioClient = twilio(
      fetchEnv(envVar.TWILIO_ACCOUNT_SID),
      fetchEnv(envVar.TWILIO_ACCOUNT_AUTH_TOKEN)
    )

    const attestations = await kit.contracts.getAttestations()
    const stableToken = await kit.contracts.getStableToken()
    const gasPriceMinimum = await kit.contracts.getGasPriceMinimum()

    const waitTime = Math.random() * argv.initialWaitSeconds
    console.log(`Waiting ${waitTime} seconds (from ${argv.initialWaitSeconds})`)
    await sleep(waitTime * 1000)

    const phoneNumber = await getPhoneNumber(
      attestations,
      twilioClient,
      ADDRESS_SID,
      argv.attestationMax
    )

    console.log('Using ', phoneNumber)

    let stat = await attestations.getAttestationStat(phoneNumber, clientAddress)

    while (stat.total < argv.attestationMax) {
      console.log(`Starting, we completed ${stat.completed} out of ${stat.total} attestations`)

      const gasPrice = new BigNumber(
        await gasPriceMinimum.getGasPriceMinimum(stableToken.address)
      ).times(5)
      const txParams = {
        from: clientAddress,
        feeCurrency: stableToken.address,
        gasPrice: gasPrice.toString(),
      }

      console.info('request attestations')
      await requestMoreAttestations(attestations, phoneNumber, 1, clientAddress, txParams)

      const attestationsToComplete = await attestations.getActionableAttestations(
        phoneNumber,
        clientAddress
      )

      console.info('reveal to issuer')
      const possibleErrors = await requestAttestationsFromIssuers(
        attestationsToComplete,
        attestations,
        phoneNumber,
        clientAddress
      )

      printAndIgnoreRequestErrors(possibleErrors)

      console.info('wait for messages')
      await pollForMessagesAndCompleteAttestations(
        attestations,
        twilioClient,
        phoneNumber,
        clientAddress,
        attestationsToComplete,
        txParams
      )

      const sleepTime = Math.random() * argv.inBetweenWaitSeconds
      console.info(`Sleeping ${sleepTime} seconds (from ${argv.inBetweenWaitSeconds} seconds)`)

      await sleep(sleepTime * 1000)
      stat = await attestations.getAttestationStat(phoneNumber, clientAddress)
    }

    console.log(`In the end, we completed ${stat.completed} out of ${stat.total} attestations`)
    process.exit(0)
  } catch (error) {
    console.error('Something went wrong')
    console.error(error)
    process.exit(1)
  }
}

const TIME_TO_WAIT_FOR_ATTESTATIONS_IN_MINUTES = 10
const POLLING_WAIT = 3000

async function pollForMessagesAndCompleteAttestations(
  attestations: AttestationsWrapper,
  client: Twilio,
  phoneNumber: string,
  account: Address,
  attestationsToComplete: ActionableAttestation[],
  txParams: CeloTransactionParams = {}
) {
  const startDate = moment()
  while (
    moment().isBefore(startDate.add(TIME_TO_WAIT_FOR_ATTESTATIONS_IN_MINUTES, 'minutes')) &&
    attestationsToComplete.length > 0
  ) {
    const messages = await fetchLatestMessagesFromToday(client, phoneNumber, 100)

    const res = await findValidCode(
      attestations,
      messages.map((_) => _.body),
      phoneNumber,
      attestationsToComplete,
      account
    )

    if (!res) {
      process.stdout.write('.')
      await sleep(POLLING_WAIT)
      continue
    }
    console.log('')

    const completeTx = await attestations.complete(phoneNumber, account, res.issuer, res.code)

    await completeTx.sendAndWaitForReceipt(txParams)

    attestationsToComplete = await attestations.getActionableAttestations(phoneNumber, account)
    console.log(
      `Completed attestation for ${res.issuer}, ${attestationsToComplete.length} remaining`
    )
  }
}

export async function fundClient(
  kit: ContractKit,
  funder: Address,
  recipient: Address,
  numberOfAttestations: number
) {
  const [stableToken, attestations] = await Promise.all([
    kit.contracts.getStableToken(),
    kit.contracts.getAttestations(),
    kit.contracts.getEscrow(),
  ])
  const attestationFee = new BigNumber(
    await attestations.attestationRequestFees(stableToken.address)
  )
  const fundingAmount = attestationFee.times(3 * numberOfAttestations).toString()
  await stableToken.transfer(recipient, fundingAmount).sendAndWaitForReceipt({ from: funder })
}
