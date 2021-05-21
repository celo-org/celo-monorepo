import { assertRevert } from '@celo/protocol/lib/test-utils'
import _ from 'lodash'
import { GrandaMentoContract, GrandaMentoInstance } from 'types'

const GrandaMento: GrandaMentoContract = artifacts.require('GrandaMento')

// @ts-ignore
GrandaMento.numberFormat = 'BigNumber'

contract('GrandaMento', (_accounts: string[]) => {
  let grandaMento: GrandaMentoInstance

  beforeEach(async () => {
    grandaMento = await GrandaMento.new(true)
    await grandaMento.initialize()
  })

  describe('#initialize()', () => {
    it('should not be callable again', async () => {
      await assertRevert(grandaMento.initialize())
    })
  })
})
