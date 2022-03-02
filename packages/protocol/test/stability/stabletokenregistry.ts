import { assertRevert } from '@celo/protocol/lib/test-utils'
import { StableTokenRegistryContract, StableTokenRegistryInstance } from 'types'

const STRC: StableTokenRegistryContract = artifacts.require('StableTokenRegistry')

contract('StableTokenRegistry', (accounts: string[]) => {
  console.log('hi')
  let strc: StableTokenRegistryInstance

  // @ts-ignore
  let initializationTime
  beforeEach(async () => {
    console.log('1')
    strc = await STRC.new(true)
    console.log('12')
    const response = await strc.initialize(
      ['cUSD', 'cEUR', 'cBRL'],
      ['StableToken', 'StableTokenEUR', 'StableTokenBRL']
    )
    console.log('123')
    // @ts-ignore
    initializationTime = (await web3.eth.getBlock(response.receipt.blockNumber)).timestamp
    console.log('1234')
  })

  describe('#initialize()', async () => {
    console.log('12345')
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
