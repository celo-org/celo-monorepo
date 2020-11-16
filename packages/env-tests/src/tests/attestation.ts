import { generateKeys, generateMnemonic } from '@celo/utils/lib/account'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import { sleep } from '@celo/utils/lib/async'
import { describe, test } from '@jest/globals'
import BigNumber from 'bignumber.js'
import Logger from 'bunyan'
import twilio from 'twilio'
import { EnvTestContext } from '../context'
import { envVar, fetchEnv } from '../env'
import { getKey, ONE, TestAccounts } from '../scaffold'
import {
  getIdentifierAndPepper,
  getPhoneNumber,
  pollForMessagesAndCompleteAttestations,
  reportErrors,
  requestAttestationsFromIssuers,
  requestMoreAttestations,
} from '../shared/attestation'

async function fundAttestationAccount(
  context: EnvTestContext,
  root: string,
  attestationAccount: string,
  logger: Logger
) {
  const stableToken = await context.kit.contracts.getStableToken()
  context.kit.defaultFeeCurrency = stableToken.address

  const rootTransfer = stableToken.transfer(attestationAccount, ONE.toString())
  const rootTransferReceipt = await rootTransfer.sendAndWaitForReceipt({ from: root })

  logger.debug(
    {
      receipt: rootTransferReceipt,
      account: attestationAccount,
    },
    'funded attestation account'
  )
}

export function runAttestationTest(
  context: EnvTestContext,
  attestationsToRequest = 3,
  configuredPepper = 'HARDCODED_PEPPER',
  odisContext = 'mainnet'
) {
  describe('Attestation Test', () => {
    const logger = context.logger.child({ test: 'attestation' })

    // TODO: Check for TWILIO ENV vars
    test('receive attestations for a phone number', async () => {
      const root = await getKey(context.mnemonic, TestAccounts.Root)
      context.kit.addAccount(root.privateKey)

      const mnemonic = await generateMnemonic()
      const attestationAccount = await generateKeys(mnemonic)
      const attestationAccountAddress = privateKeyToAddress(attestationAccount.privateKey)
      context.kit.addAccount(attestationAccount.privateKey)
      context.kit.defaultAccount = attestationAccountAddress
      const stableToken = await context.kit.contracts.getStableToken()

      await fundAttestationAccount(context, root.address, attestationAccountAddress, logger)

      const twilioClient = twilio(
        fetchEnv(envVar.TWILIO_ACCOUNT_SID),
        fetchEnv(envVar.TWILIO_ACCOUNT_AUTH_TOKEN)
      )

      const phoneNumber = await getPhoneNumber(twilioClient, fetchEnv(envVar.TWILIO_ADDRESS_SID))

      const { identifier, pepper } = await getIdentifierAndPepper(
        context.kit,
        odisContext,
        attestationAccountAddress,
        phoneNumber.phoneNumber,
        configuredPepper
      )
      logger.debug({ phoneNumber: phoneNumber.phoneNumber, identifier, pepper }, 'get phone number')

      // Actually start requesting
      const attestations = await context.kit.contracts.getAttestations()

      await requestMoreAttestations(
        attestations,
        identifier,
        attestationsToRequest,
        attestationAccountAddress,
        {}
      )

      const attestationsToComplete = await attestations.getActionableAttestations(
        identifier,
        attestationAccountAddress
      )

      logger.info({ attestationsToComplete }, 'Reveal to issuers')

      // Wait for attestation services to sync
      // TODO: Change this to request from issuers with back-off
      await sleep(5000)

      const possibleErrors = await requestAttestationsFromIssuers(
        attestationsToComplete,
        attestations,
        phoneNumber.phoneNumber,
        attestationAccountAddress,
        pepper
      )

      await reportErrors(possibleErrors, logger)

      await pollForMessagesAndCompleteAttestations(
        attestations,
        twilioClient,
        phoneNumber.phoneNumber,
        identifier,
        attestationAccountAddress,
        attestationsToComplete,
        {},
        logger,
        attestationsToRequest
      )

      const attestationStat = await attestations.getAttestationStat(
        identifier,
        attestationAccountAddress
      )

      expect(attestationStat.total).toEqual(attestationsToRequest)
      expect(attestationStat.completed).toEqual(attestationsToRequest)

      // move back funds to root
      const stableBalanceRoot = await stableToken.balanceOf(attestationAccountAddress)
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
