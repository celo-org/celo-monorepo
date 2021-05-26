import { assertRevert } from '@celo/protocol/lib/test-utils'
import _ from 'lodash'
import { GrandaMentoContract, GrandaMentoInstance } from 'types'

const GrandaMento: GrandaMentoContract = artifacts.require('GrandaMento')

// @ts-ignore
GrandaMento.numberFormat = 'BigNumber'

contract('GrandaMento', (accounts: string[]) => {
  let grandaMento: GrandaMentoInstance

  const owner = accounts[0]

  beforeEach(async () => {
    grandaMento = await GrandaMento.new(true)
    await grandaMento.initialize()
  })

  describe('#initialize()', () => {
    it('sets the owner', async () => {
      assert.equal(await grandaMento.owner(), owner)
    })

    it('reverts when called again', async () => {
      await assertRevert(grandaMento.initialize())
    })
  })
})
