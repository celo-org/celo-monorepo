import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  assertEqualBN,
  assertLogMatches2,
  assertTransactionRevertWithReason,
  assumeOwnershipWithTruffle,
} from '@celo/protocol/lib/test-utils'
import {
  getDeployedProxiedContract,
  makeTruffleContractForMigration,
} from '@celo/protocol/lib/web3-utils'
import { fixed1 } from '@celo/utils/src/fixidity'
import {
  FreezerContract,
  FreezerInstance,
  OdisPaymentsContract,
  OdisPaymentsInstance,
  RegistryInstance,
} from 'types'
import { StableTokenContract, StableTokenInstance } from 'types/mento'
import { MENTO_PACKAGE } from '../../contractPackages'

const Freezer: FreezerContract = artifacts.require('Freezer')
const OdisPayments: OdisPaymentsContract = artifacts.require('OdisPayments')
const StableTokenCUSD: StableTokenContract = makeTruffleContractForMigration(
  'StableToken',
  MENTO_PACKAGE,
  web3
)

const SECONDS_IN_A_DAY = 60 * 60 * 24

contract('OdisPayments', (accounts: string[]) => {
  let freezer: FreezerInstance
  let odisPayments: OdisPaymentsInstance
  let registry: RegistryInstance
  let stableTokenCUSD: StableTokenInstance

  const owner = accounts[0]
  const sender = accounts[1]
  const startingBalanceCUSD = 1000

  before(async () => {
    // Mocking Registry.sol when using UsingRegistryV2.sol
    registry = await getDeployedProxiedContract('Registry', artifacts)
    if ((await registry.owner()) !== owner) {
      // In CI we need to assume ownership, locally using quicktest we don't
      await assumeOwnershipWithTruffle(['Registry'], owner)
    }
  })

  beforeEach(async () => {
    odisPayments = await OdisPayments.new(true, { from: owner })
    await odisPayments.initialize()

    stableTokenCUSD = await StableTokenCUSD.new(true, { from: owner })
    await registry.setAddressFor(CeloContractName.StableToken, stableTokenCUSD.address)
    await stableTokenCUSD.initialize(
      'Celo Dollar',
      'cUSD',
      18,
      registry.address,
      fixed1,
      SECONDS_IN_A_DAY,
      // Initialize owner and sender with balances
      [owner, sender],
      [startingBalanceCUSD, startingBalanceCUSD],
      'Exchange' // USD
    )

    // StableToken is freezable so this is necessary for transferFrom calls
    freezer = await Freezer.new(true, { from: owner })
    await freezer.initialize()
    await registry.setAddressFor(CeloContractName.Freezer, freezer.address)
  })

  describe('#initialize()', () => {
    it('should have set the owner', async () => {
      const actualOwner: string = await odisPayments.owner()
      assert.equal(actualOwner, owner)
    })

    it('should not be callable again', async () => {
      await assertTransactionRevertWithReason(
        odisPayments.initialize(),
        'contract already initialized'
      )
    })
  })

  describe('#payInCUSD', () => {
    const checkStateCUSD = async (
      cusdSender: string,
      odisPaymentReceiver: string,
      totalValueSent: number
    ) => {
      assertEqualBN(
        await stableTokenCUSD.balanceOf(cusdSender),
        startingBalanceCUSD - totalValueSent,
        'cusdSender balance'
      )
      assertEqualBN(
        await stableTokenCUSD.balanceOf(odisPayments.address),
        totalValueSent,
        'odisPayments.address balance'
      )
      assertEqualBN(
        await odisPayments.totalPaidCUSD(odisPaymentReceiver),
        totalValueSent,
        'odisPaymentReceiver balance'
      )
    }

    const valueApprovedForTransfer = 10
    const receiver = accounts[2]

    beforeEach(async () => {
      await stableTokenCUSD.approve(odisPayments.address, valueApprovedForTransfer, {
        from: sender,
      })
      assertEqualBN(await stableTokenCUSD.balanceOf(sender), startingBalanceCUSD)
    })

    it('should allow sender to make a payment on their behalf', async () => {
      await odisPayments.payInCUSD(sender, valueApprovedForTransfer, { from: sender })
      await checkStateCUSD(sender, sender, valueApprovedForTransfer)
    })

    it('should allow sender to make a payment for another account', async () => {
      await odisPayments.payInCUSD(receiver, valueApprovedForTransfer, { from: sender })
      await checkStateCUSD(sender, receiver, valueApprovedForTransfer)
    })

    it('should allow sender to make multiple payments to the contract', async () => {
      const valueForSecondTransfer = 5
      const valueForFirstTransfer = valueApprovedForTransfer - valueForSecondTransfer

      await odisPayments.payInCUSD(sender, valueForFirstTransfer, { from: sender })
      await checkStateCUSD(sender, sender, valueForFirstTransfer)

      await odisPayments.payInCUSD(sender, valueForSecondTransfer, { from: sender })
      await checkStateCUSD(sender, sender, valueApprovedForTransfer)
    })

    it('should emit the PaymentMade event', async () => {
      const receipt = await odisPayments.payInCUSD(receiver, valueApprovedForTransfer, {
        from: sender,
      })
      assertLogMatches2(receipt.logs[0], {
        event: 'PaymentMade',
        args: {
          account: receiver,
          valueInCUSD: valueApprovedForTransfer,
        },
      })
    })

    it('should revert if transfer fails', async () => {
      await assertTransactionRevertWithReason(
        odisPayments.payInCUSD(sender, valueApprovedForTransfer + 1, { from: sender }),
        'SafeERC20: low-level call failed'
      )
      assertEqualBN(await odisPayments.totalPaidCUSD(sender), 0)
    })
  })
})
