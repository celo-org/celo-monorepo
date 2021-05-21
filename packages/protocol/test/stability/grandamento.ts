import { assertRevert } from '@celo/protocol/lib/test-utils'
import _ from 'lodash'
import { GrandaMentoContract, GrandaMentoInstance } from 'types'

const GrandaMento: GrandaMentoContract = artifacts.require('GrandaMento')

// @ts-ignore
GrandaMento.numberFormat = 'BigNumber'

contract('GrandaMento', (accounts: string[]) => {
  let grandaMento: GrandaMentoInstance

  beforeEach(async () => {
    grandaMento = await GrandaMento.new(true)
    await grandaMento.initialize()
  })

  describe('#initialize()', () => {
    it('should have set the owner', async () => {
      const expectedOwner: string = await grandaMento.owner()
      assert.equal(expectedOwner, accounts[0])
    })

    it('should not be callable again', async () => {
      await assertRevert(grandaMento.initialize())
    })
  })
})
