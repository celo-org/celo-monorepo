import { DomainIdentifiers, SequentialDelayDomain } from '@celo/identity/lib/odis/domains'
import { defined, noBool, noString } from '@celo/utils/lib/sign-typed-data-utils'
import debugFactory from 'debug'
import { createBackup, openBackup } from './backup'
import { deserializeBackup, serializeBackup } from './schema'

const debug = debugFactory('kit:encrypted-backup:backup:test')

const TEST_ODIS_DOMAIN: SequentialDelayDomain = {
  name: DomainIdentifiers.SequentialDelay,
  version: '1',
  stages: [{ delay: 0, resetTimer: noBool, batchSize: defined(2), repetitions: defined(10) }],
  address: defined('0x0000000000000000000000000000000000000b0b'),
  salt: noString,
}

describe('end-to-end', () => {
  it('should be able to create, serialize, deserialize, and open a backup', () => {
    const testData = Buffer.from('backup test data', 'utf8')
    const testPassword = Buffer.from('backup test password', 'utf8')

    const backup = createBackup(testData, testPassword, TEST_ODIS_DOMAIN)
    debug('Created backup', backup)

    // Attempt to open the backup before passing it through the serialize function.
    const opened = openBackup(backup, testPassword)
    expect(opened.ok).toBe(true)
    if (!opened.ok) {
      return
    }
    expect(opened.result).toEqual(testData)

    // Serialize the backup.
    const serialized = serializeBackup(backup)
    debug('Serialized backup', serialized)

    // Deserialize the backup, check that it is correctly deserialized and can be opened.
    const deserialized = deserializeBackup(serialized)
    expect(deserialized.ok).toBe(true)
    if (!deserialized.ok) {
      return
    }
    debug('Deserialized backup', deserialized.result)
    expect(deserialized.result).toEqual(backup)

    const reopened = openBackup(deserialized.result, testPassword)
    expect(reopened.ok).toBe(true)
    if (!reopened.ok) {
      return
    }
    expect(reopened.result).toEqual(testData)
  })
})
