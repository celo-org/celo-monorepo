import {
  ContractVersion,
  ContractVersionChecker,
  ContractVersionDelta,
  DEFAULT_VERSION_STRING,
  Delta,
  DeltaUtil,
} from '@celo/protocol/lib/compatibility/version'
import { assert } from 'chai'

describe('#version()', () => {
  describe('ContractVersion', () => {
    it('returns false on invalid string for isValid', () => {
      assert.isFalse(ContractVersion.isValid('1.2.3'))
      assert.isFalse(ContractVersion.isValid('1.2'))
      assert.isFalse(ContractVersion.isValid('1.2.3.5.'))
      assert.isFalse(ContractVersion.isValid('test'))
      assert.isFalse(ContractVersion.isValid('1.a.3.4'))
      assert.isFalse(ContractVersion.isValid('-1.0.9.787'))
    })

    it('returns true on valid string for isValid', () => {
      assert.isTrue(ContractVersion.isValid('1.2.3.4'))
      assert.isTrue(ContractVersion.isValid('10.0.224.9'))
    })

    describe('with a new ContractVersion instance', () => {
      it('sets properties correctly', () => {
        const version = new ContractVersion(1, 2, 3, 4)
        assert.equal(version.storage, 1)
        assert.equal(version.major, 2)
        assert.equal(version.minor, 3)
        assert.equal(version.patch, 4)
      })

      it('has a correct toString method', () => {
        const version = new ContractVersion(2, 7, 9, 1)
        assert.equal(version.toString(), '2.7.9.1')
      })
    })

    describe('ContractVersion.fromGetVersionNumberReturnValue', () => {
      it('parses the buffer correctly', () => {
        const zeros = '0'.repeat(63)
        const buffer = Buffer.from(`${zeros}1${zeros}2${zeros}3${zeros}4`, 'hex')
        const version = ContractVersion.fromGetVersionNumberReturnValue(buffer)
        assert.equal(version.toString(), '1.2.3.4')
      })
    })
  })

  describe('ContractVersionDelta', () => {
    describe('ContractVersionDelta.fromChanges', () => {
      it('properly sets the storage Delta', () => {
        const cvd = ContractVersionDelta.fromChanges(true, false, true, true)
        assert.equal(cvd.storage, Delta.Increment)
        assert.equal(cvd.major, Delta.Reset)
        assert.equal(cvd.minor, Delta.Reset)
        assert.equal(cvd.patch, Delta.Reset)
      })

      it('properly sets the storage Delta', () => {
        const cvd2 = ContractVersionDelta.fromChanges(false, false, true, true)
        assert.equal(cvd2.storage, Delta.None)
        assert.notEqual(cvd2.major, Delta.Reset)
      })

      it('properly sets the major Delta', () => {
        const cvd = ContractVersionDelta.fromChanges(false, true, true, true)
        assert.equal(cvd.major, Delta.Increment)
        assert.equal(cvd.minor, Delta.Reset)
        assert.equal(cvd.patch, Delta.Reset)
      })

      it('properly sets the major Delta', () => {
        const cvd2 = ContractVersionDelta.fromChanges(false, false, true, true)
        assert.equal(cvd2.major, Delta.None)
        assert.notEqual(cvd2.minor, Delta.Reset)
      })

      it('properly sets the minor Delta', () => {
        const cvd = ContractVersionDelta.fromChanges(false, false, true, true)
        assert.equal(cvd.minor, Delta.Increment)
        assert.equal(cvd.patch, Delta.Reset)
      })

      it('properly sets the minor Delta', () => {
        const cvd2 = ContractVersionDelta.fromChanges(false, false, false, true)
        assert.equal(cvd2.minor, Delta.None)
        assert.notEqual(cvd2.patch, Delta.Reset)
      })

      it('properly sets the patch Delta', () => {
        const cvd = ContractVersionDelta.fromChanges(false, false, false, true)
        assert.equal(cvd.patch, Delta.Increment)
      })

      it('properly sets the patch Delta', () => {
        const cvd2 = ContractVersionDelta.fromChanges(false, false, false, false)
        assert.equal(cvd2.patch, Delta.None)
      })
    })

    describe('with a new ContractVersionDelta instance', () => {
      it('sets properties correctly', () => {
        const cvd = new ContractVersionDelta(Delta.None, Delta.Reset, Delta.Increment, Delta.None)
        assert.equal(cvd.storage, Delta.None)
        assert.equal(cvd.major, Delta.Reset)
        assert.equal(cvd.minor, Delta.Increment)
        assert.equal(cvd.patch, Delta.None)

        const cvd2 = new ContractVersionDelta(Delta.Reset, Delta.None, Delta.None, Delta.Increment)
        assert.equal(cvd2.storage, Delta.Reset)
        assert.equal(cvd2.major, Delta.None)
        assert.equal(cvd2.minor, Delta.None)
        assert.equal(cvd2.patch, Delta.Increment)
      })

      it('has a correct toString method', () => {
        assert.equal(
          new ContractVersionDelta(Delta.None, Delta.Reset, Delta.Increment, Delta.None).toString(),
          '=.0.+1.='
        )
        assert.equal(
          new ContractVersionDelta(
            Delta.Reset,
            Delta.Increment,
            Delta.Increment,
            Delta.Increment
          ).toString(),
          '0.+1.+1.+1'
        )
        assert.equal(
          new ContractVersionDelta(
            Delta.Increment,
            Delta.Reset,
            Delta.Reset,
            Delta.Reset
          ).toString(),
          '+1.0.0.0'
        )
        assert.equal(
          new ContractVersionDelta(
            Delta.None,
            Delta.Increment,
            Delta.Increment,
            Delta.None
          ).toString(),
          '=.+1.+1.='
        )
      })

      it('has a correct applyTo method', () => {
        const v1 = new ContractVersion(10, 20, 30, 40)
        const v2 = new ContractVersionDelta(
          Delta.None,
          Delta.Reset,
          Delta.Increment,
          Delta.None
        ).appliedTo(v1)
        assert.equal(v2.storage, 10)
        assert.equal(v2.major, 0)
        assert.equal(v2.minor, 31)
        assert.equal(v2.patch, 40)

        const v3 = new ContractVersionDelta(
          Delta.Increment,
          Delta.Reset,
          Delta.Reset,
          Delta.Reset
        ).appliedTo(v1)
        assert.equal(v3.storage, 11)
        assert.equal(v3.major, 0)
        assert.equal(v3.minor, 0)
        assert.equal(v3.patch, 0)
      })
    })
  })

  describe('DeltaUtil', () => {
    it('has a correct applyToNumber method', () => {
      assert.equal(DeltaUtil.applyToNumber(Delta.Reset, 7), 0)
      assert.equal(DeltaUtil.applyToNumber(Delta.Increment, 9), 10)
      assert.equal(DeltaUtil.applyToNumber(Delta.None, 11), 11)
    })
  })

  describe('ContractVersionChecker', () => {
    describe('when the expected version matches', () => {
      const oldVersion = new ContractVersion(1, 2, 3, 4)
      const newVersion = new ContractVersion(2, 0, 0, 0)
      const cvd = ContractVersionDelta.fromChanges(true, false, true, false)
      const cvc = new ContractVersionChecker(oldVersion, newVersion, cvd)

      it('returns the expected version number', () => {
        assert.equal(cvc.expectedVersion().toString(), '2.0.0.0')
      })

      it('returns that the expected version number matches', () => {
        assert.isTrue(cvc.matches())
      })
    })

    describe('when the old version is null', () => {
      const newVersion = new ContractVersion(1, 1, 0, 0)
      const cvd = ContractVersionDelta.fromChanges(false, false, false, false)
      const cvc = new ContractVersionChecker(null, newVersion, cvd)

      it('returns the default expected version number', () => {
        assert.equal(cvc.expectedVersion().toString(), DEFAULT_VERSION_STRING)
      })

      it('returns that the expected version number matches', () => {
        assert.isTrue(cvc.matches())
      })
    })

    describe('when the expected version does not match', () => {
      const oldVersion = new ContractVersion(1, 0, 1, 1)
      const newVersion = new ContractVersion(1, 1, 0, 0)
      const cvd = ContractVersionDelta.fromChanges(false, false, true, true)
      const cvc = new ContractVersionChecker(oldVersion, newVersion, cvd)

      it('returns the expected version number', () => {
        assert.equal(cvc.expectedVersion().toString(), '1.0.2.0')
      })

      it('returns that the expected version number does not match', () => {
        assert.isFalse(cvc.matches())
      })
    })
  })
})
