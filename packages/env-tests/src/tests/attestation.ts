import { generateKeys, generateMnemonic } from '@celo/utils/lib/account'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import { sleep } from '@celo/utils/lib/async'
import { beforeAll, describe, test } from '@jest/globals'
import BigNumber from 'bignumber.js'
import Logger from 'bunyan'
import twilio from 'twilio'
import { Context } from '../context'
import { envVar, fetchEnv } from '../env'
import {
  getIdentifierAndPepper,
  getPhoneNumber,
  pollForMessagesAndCompleteAttestations,
  reportErrors,
  requestAttestationsFromIssuers,
  requestMoreAttestations,
} from '../lib/attestation'
import { getKey, ONE, TestAccounts } from '../scaffold'

async function fundAttestationAccount(
  context: Context,
  stableToken: StableTokenWrapper,
  root: string,
  from: string,
  logger: Logger
) {
  context.kit.defaultFeeCurrency = stableToken.address

  const rootTransfer = stableToken.transfer(from, ONE.toString())
  const rootTransferReceipt = await rootTransfer.sendAndWaitForReceipt({ from: root })

  logger.debug(
    {
      receipt: rootTransferReceipt,
      account: from,
    },
    'funded attestation account'
  )
}

export function runAttestationTest(context: Context) {
  describe('Attestation Test', () => {
    const logger = context.logger.child({ test: 'attestation' })

    beforeAll(async () => {
      // Check for TWILIO ENV vars
    })

    test('receive attestations for a phone number', async () => {
      const root = await getKey(context.mnemonic, TestAccounts.Root)
      context.kit.addAccount(root.privateKey)

      const mnemonic = await generateMnemonic()
      const from = await generateKeys(mnemonic)
      const fromAddress = privateKeyToAddress(from.privateKey)
      context.kit.addAccount(from.privateKey)
      context.kit.defaultAccount = fromAddress
      const stableToken = await context.kit.contracts.getStableToken()

      await fundAttestationAccount(context, stableToken, root.address, fromAddress, logger)

      const twilioClient = twilio(
        fetchEnv(envVar.TWILIO_ACCOUNT_SID),
        fetchEnv(envVar.TWILIO_ACCOUNT_AUTH_TOKEN)
      )

      const phoneNumber = await getPhoneNumber(twilioClient, fetchEnv(envVar.TWILIO_ADDRESS_SID))

      const { identifier, pepper } = await getIdentifierAndPepper(
        context.kit,
        'mainnet',
        fromAddress,
        phoneNumber.phoneNumber,
        'salt'
      )
      logger.debug({ phoneNumber: phoneNumber.phoneNumber, identifier, pepper }, 'get phone number')

      // Actually start requesting
      const attestations = await context.kit.contracts.getAttestations()

      await requestMoreAttestations(attestations, identifier, 3, fromAddress, {})

      const attestationsToComplete = await attestations.getActionableAttestations(
        identifier,
        fromAddress
      )

      logger.info({ attestationsToComplete }, 'Reveal to issuers')

      // Wait for attestation services to sync
      await sleep(5000)

      const possibleErrors = await requestAttestationsFromIssuers(
        attestationsToComplete,
        attestations,
        phoneNumber.phoneNumber,
        fromAddress,
        pepper
      )

      await reportErrors(possibleErrors, logger)

      await pollForMessagesAndCompleteAttestations(
        attestations,
        twilioClient,
        phoneNumber.phoneNumber,
        identifier,
        fromAddress,
        attestationsToComplete,
        {},
        logger,
        3
      )

      const attestationStat = await attestations.getAttestationStat(identifier, fromAddress)

      expect(attestationStat.total).toEqual(3)
      expect(attestationStat.completed).toEqual(3)

      // move back funds to root
      const stableBalanceRoot = await stableToken.balanceOf(fromAddress)
      const transferBackTx = stableToken.transfer(
        root.address,
        stableBalanceRoot
          .times(0.95)
          .integerValue(BigNumber.ROUND_DOWN)
          .toString()
      )
      const transferBackTxReceipt = await transferBackTx.sendAndWaitForReceipt()

      logger.debug({ receipt: transferBackTxReceipt }, 'transferred remainder of cUSD back')
    }, 120000)
  })
}
