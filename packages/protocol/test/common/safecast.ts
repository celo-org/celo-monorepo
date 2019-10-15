// TODO: Remove this and use upstream when https://github.com/OpenZeppelin/openzeppelin-contracts/pull/1926/files gets merged

import BN = require('bn.js')
import { expect } from 'chai'
import { assertRevert } from '../../lib/test-utils'
const MockSafeCast = artifacts.require('MockSafeCast')

contract('SafeCast', async () => {
  beforeEach(async function() {
    this.safeCast = await MockSafeCast.new()
  })

  function testToUint(bits) {
    describe(`toUint${bits}`, () => {
      const maxValue = new BN('2').pow(new BN(bits)).sub(new BN('1'))

      it('downcasts 0', async function() {
        expect((await this.safeCast[`toUint${bits}`](0)).toString()).to.equal('0')
      })

      it('downcasts 1', async function() {
        expect((await this.safeCast[`toUint${bits}`](1)).toString()).to.equal('1')
      })

      it(`downcasts 2^${bits} - 1 (${maxValue})`, async function() {
        expect((await this.safeCast[`toUint${bits}`](maxValue)).toString()).to.equal(
          maxValue.toString()
        )
      })

      it(`reverts when downcasting 2^${bits} (${maxValue.add(new BN('1'))})`, async function() {
        await assertRevert(
          this.safeCast[`toUint${bits}`](maxValue.add(new BN('1'))),
          `SafeCast: value doesn't fit in ${bits} bits`
        )
      })

      it(`reverts when downcasting 2^${bits} + 1 (${maxValue.add(new BN('2'))})`, async function() {
        await assertRevert(
          this.safeCast[`toUint${bits}`](maxValue.add(new BN('2'))),
          `SafeCast: value doesn't fit in ${bits} bits`
        )
      })
    })
  }

  ;[8, 16, 32, 64, 128].forEach((bits) => testToUint(bits))
})
