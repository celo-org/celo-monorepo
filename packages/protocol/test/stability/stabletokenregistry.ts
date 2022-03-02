import { assertRevert } from '@celo/protocol/lib/test-utils'
import { StableTokenRegistryContract, StableTokenRegistryInstance } from 'types'

const STRC: StableTokenRegistryContract = artifacts.require('StableTokenRegistry')

contract('StableTokenRegistry', (accounts: string[]) => {
  let strc: StableTokenRegistryInstance

  beforeEach(async () => {
    strc = await STRC.new(true)
    await strc.initialize([], [])
  })

  describe('#initialize()', async () => {
    it('should have set the owner', async () => {
      const owner: string = await strc.owner()
      assert.equal(owner, accounts[0])
    })

    it('should not be callable again', async () => {
      await assertRevert(strc.initialize([], []))
    })
  })
})
