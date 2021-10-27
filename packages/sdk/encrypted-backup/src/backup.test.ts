import debugFactory from 'debug'
import { createBackup, openBackup } from './backup'
import { deserializeBackup, serializeBackup } from './schema'

const debug = debugFactory('kit:encrypted-backup:backup:test')

describe('end-to-end', () => {
  it('should be able to create, serialize, deserialize, and open a backup', () => {
    const testData = Buffer.from('backup test data', 'utf8')
    const testPassword = Buffer.from('backup test password', 'utf8')

    const backup = createBackup(testData, testPassword)
    debug('Created backup', backup)

    // Attempt to open the backup before passing it through the serialize function.
    expect(openBackup(backup, testPassword)).toEqual(testData)

    // Serialize the backup.
    const serialized = serializeBackup(backup)
    debug('Serialized backup', serialized)

    // Deserialize the backup, check that it is correctly deserialized and can be opened.
    const deserialized = deserializeBackup(serialized)
    expect(deserialized.ok).toBe(true)
    if (deserialized.ok) {
      debug('Deserialized backup', deserialized.result)
      expect(deserialized.result).toEqual(backup)
      expect(openBackup(deserialized.result, testPassword)).toEqual(testData)
    }
  })
})
