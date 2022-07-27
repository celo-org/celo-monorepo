import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import {
  assertEqualBN,
  assertLogMatches2,
  assertRevert,
  assumeOwnership,
} from '@celo/protocol/lib/test-utils'
import { getDeployedProxiedContract } from '@celo/protocol/lib/web3-utils'
import { fixed1 } from '@celo/utils/src/fixidity'
import {
  FreezerContract,
  FreezerInstance,
  OdisBalanceContract,
  OdisBalanceInstance,
  RegistryInstance,
  StableTokenContract,
  StableTokenInstance,
} from 'types'

const Freezer: FreezerContract = artifacts.require('Freezer')
const OdisBalance: OdisBalanceContract = artifacts.require('OdisBalance')
const StableTokenCUSD: StableTokenContract = artifacts.require('StableToken')

const SECONDS_IN_A_DAY = 60 * 60 * 24

contract('OdisBalance', (accounts: string[]) => {
  let freezer: FreezerInstance
  let odisBalance: OdisBalanceInstance
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
      await assumeOwnership(['Registry'], owner)
    }
  })

  beforeEach(async () => {
    odisBalance = await OdisBalance.new(true, { from: owner })
    await registry.setAddressFor(CeloContractName.OdisBalance, odisBalance.address)
    await odisBalance.initialize()

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
      const actualOwner: string = await odisBalance.owner()
      assert.equal(actualOwner, owner)
    })

    it('should not be callable again', async () => {
      await assertRevert(odisBalance.initialize())
    })
  })

  describe('#payInCUSD', () => {
    const checkStateCUSD = async (
      cusdSender: string,
      odisPaymentReceiver: string,
      senderBalanceStart: number,
      valueSent: number
    ) => {
      assertEqualBN(
        await stableTokenCUSD.balanceOf(cusdSender),
        senderBalanceStart - valueSent,
        'cusdSender balance'
      )
      assertEqualBN(
        await stableTokenCUSD.balanceOf(odisBalance.address),
        valueSent,
        'odisBalance.address balance'
      )
      assertEqualBN(
        await odisBalance.totalPaidCUSD(odisPaymentReceiver),
        valueSent,
        'odisPaymentReceiver balance'
      )
    }

    const valueApprovedForTransfer = 10
    const receiver = accounts[2]

    beforeEach(async () => {
      await stableTokenCUSD.approve(odisBalance.address, valueApprovedForTransfer, { from: sender })
      assertEqualBN(await stableTokenCUSD.balanceOf(sender), startingBalanceCUSD)
    })

    it('should allow sender to make a payment on their behalf', async () => {
      await odisBalance.payInCUSD(sender, valueApprovedForTransfer, { from: sender })
      await checkStateCUSD(sender, sender, startingBalanceCUSD, valueApprovedForTransfer)
    })

    it('should allow sender to make a payment for another account', async () => {
      await odisBalance.payInCUSD(receiver, valueApprovedForTransfer, { from: sender })
      await checkStateCUSD(sender, receiver, startingBalanceCUSD, valueApprovedForTransfer)
    })

    it('should emit the BalanceIncremented event', async () => {
      const receipt = await odisBalance.payInCUSD(receiver, valueApprovedForTransfer, {
        from: sender,
      })
      assertLogMatches2(receipt.logs[0], {
        event: 'BalanceIncremented',
        args: {
          account: receiver,
          valueInCUSD: valueApprovedForTransfer,
        },
      })
    })

    it('should revert if transfer fails', async () => {
      await assertRevert(
        odisBalance.payInCUSD(sender, valueApprovedForTransfer + 1, { from: sender })
      )
      assertEqualBN(await odisBalance.totalPaidCUSD(sender), 0)
    })
  })
})
