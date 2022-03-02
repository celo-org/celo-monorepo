import { assertRevert } from '@celo/protocol/lib/test-utils'
import {
  // RegistryContract,
  // RegistryInstance,
  StableTokenRegistryContract,
  StableTokenRegistryInstance,
} from 'types'

const STRC: StableTokenRegistryContract = artifacts.require('StableTokenRegistry')
// const Registry: RegistryContract = artifacts.require('Registry')

contract('StableTokenRegistry', (accounts: string[]) => {
  let strc: StableTokenRegistryInstance

  // @ts-ignore
  let initializationTime
  beforeEach(async () => {
    strc = await STRC.new(true)
    const response = await strc.initialize(
      ['cUSD', 'cEUR', 'cBRL'],
      ['StableToken', 'StableTokenEUR', 'StableTokenBRL']
    )
    // @ts-ignore
    initializationTime = (await web3.eth.getBlock(response.receipt.blockNumber)).timestamp
  })

  describe('#initialize()', async () => {
    it('should have set the owner', async () => {
      const owner: string = await strc.owner()
      assert.equal(owner, accounts[0])
    })

    it('should not be callable again', async () => {
      await assertRevert(
        strc.initialize(
          ['cUSD', 'cEUR', 'cBRL'],
          ['StableToken', 'StableTokenEUR', 'StableTokenBRL']
        )
      )
    })
  })
})
