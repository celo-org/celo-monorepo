import { CeloContractName } from '@celo/protocol/lib/registry-utils'
import { assertRevert, assumeOwnership } from '@celo/protocol/lib/test-utils'
import { getDeployedProxiedContract } from '@celo/protocol/lib/web3-utils'
import { OdisBalanceContract, OdisBalanceInstance, RegistryInstance } from 'types'

const OdisBalance: OdisBalanceContract = artifacts.require('OdisBalance')

contract('OdisBalance', (accounts: string[]) => {
  let odisBalance: OdisBalanceInstance
  let registry: RegistryInstance

  const owner = accounts[0]

  before(async () => {
    // Mocking Registry.sol when using UsingRegistryV2.sol
    registry = await getDeployedProxiedContract('Registry', artifacts)
    if ((await registry.owner()) !== owner) {
      // In CI we need to assume ownership, locally using quicktest we don't
      await assumeOwnership(['Registry'], owner)
    }
  })

  beforeEach('FederatedAttestations setup', async () => {
    odisBalance = await OdisBalance.new(true)
    await registry.setAddressFor(CeloContractName.OdisBalance, odisBalance.address)
    await odisBalance.initialize()
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
})
