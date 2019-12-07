import { Address, CeloTransactionParams, newKit } from '@celo/contractkit'
import {
  ActionableAttestation,
  AttestationsWrapper,
} from '@celo/contractkit/lib/wrappers/Attestations'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import Logger, { createLogger, stdSerializers } from 'bunyan'
import { createStream } from 'bunyan-gke-stackdriver'
import { Level } from 'bunyan-gke-stackdriver/dist/types'
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

export const handler = async function autoVerify(argv: AutoVerifyArgv) {
  let logger: Logger = createLogger({
    name: 'attestation-bot',
    serializers: stdSerializers,
    streams: [createStream(Level.INFO)],
  })
  try {
    const kit = newKit(argv.celoProvider)
    const mnemonic = fetchEnv(envVar.MNEMONIC)
    // This really should be the ATTESTATION_BOT key, but somehow we can't get it to have cUSD
    const clientKey = ensure0x(generatePrivateKey(mnemonic, AccountType.VALIDATOR, 0))
    const clientAddress = privateKeyToAddress(clientKey)
    logger = logger.child({ address: clientAddress })
    kit.addAccount(clientKey)

    const twilioClient = twilio(
      fetchEnv(envVar.TWILIO_ACCOUNT_SID),
      fetchEnv(envVar.TWILIO_ACCOUNT_AUTH_TOKEN)
    )

    const attestations = await kit.contracts.getAttestations()
    const stableToken = await kit.contracts.getStableToken()
    const gasPriceMinimum = await kit.contracts.getGasPriceMinimum()

    const waitTime = Math.random() * argv.initialWaitSeconds
    await sleep(waitTime * 1000)
    logger.info({ waitTime, initialWaitSeconds: argv.initialWaitSeconds }, 'Initial Wait')

    const phoneNumber = await getPhoneNumber(
      attestations,
      twilioClient,
      fetchEnv(envVar.TWILIO_ADDRESS_SID),
      argv.attestationMax
    )

    logger = logger.child({ phoneNumber })
    logger.info('Initialized phone number')

    let stat = await attestations.getAttestationStat(phoneNumber, clientAddress)

    while (stat.total < argv.attestationMax) {
      logger.info({ ...stat }, 'Start Attestation')

      const gasPrice = new BigNumber(
        await gasPriceMinimum.getGasPriceMinimum(stableToken.address)
      ).times(5)
      const txParams = {
        from: clientAddress,
        feeCurrency: stableToken.address,
        gasPrice: gasPrice.toString(),
      }

      logger.info('Request Attestation')
      await requestMoreAttestations(attestations, phoneNumber, 1, clientAddress, txParams)

      const attestationsToComplete = await attestations.getActionableAttestations(
        phoneNumber,
        clientAddress
      )

      logger.info({ attestationsToComplete }, 'Reveal to issuers')
      const possibleErrors = await requestAttestationsFromIssuers(
        attestationsToComplete,
        attestations,
        phoneNumber,
        clientAddress
      )

      logger.info(
        { possibleErrors: possibleErrors.filter((_) => _ && _.known).length },
        'Reveal errors'
      )
      printAndIgnoreRequestErrors(possibleErrors)

      await pollForMessagesAndCompleteAttestations(
        attestations,
        twilioClient,
        phoneNumber,
        clientAddress,
        attestationsToComplete,
        txParams,
        logger
      )

      const sleepTime = Math.random() * argv.inBetweenWaitSeconds
      logger.info(
        { waitTime: sleepTime, inBetweenWaitSeconds: argv.inBetweenWaitSeconds },
        `InBetween Wait`
      )

      await sleep(sleepTime * 1000)
      stat = await attestations.getAttestationStat(phoneNumber, clientAddress)
    }

    logger.info({ ...stat }, 'Completed attestations for phone number')
    process.exit(0)
  } catch (error) {
    logger.error({ err: error })
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
  txParams: CeloTransactionParams = {},
  logger: Logger
) {
  const startDate = moment()
  logger.info({ pollingWait: POLLING_WAIT }, 'Poll for the attestation code')
  while (
    moment.duration(moment().diff(startDate)).asMinutes() <
      TIME_TO_WAIT_FOR_ATTESTATIONS_IN_MINUTES &&
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
    console.info('')

    logger.info(
      { waitingTime: moment.duration(moment().diff(startDate)).asSeconds() },
      'Received valid code'
    )

    const completeTx = await attestations.complete(phoneNumber, account, res.issuer, res.code)

    await completeTx.sendAndWaitForReceipt(txParams)

    logger.info({ issuer: res.issuer }, 'Completed attestation')
    attestationsToComplete = await attestations.getActionableAttestations(phoneNumber, account)
  }
}
