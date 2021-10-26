import debugFactory from 'debug'
import { createBackup, openBackup, serializeBackup } from './backup'

const debug = debugFactory('kit:encrypted-backup:backup:test')

describe('openBackup', () => {
  it('should be able to open an output from createBackup()', () => {
    const testData = Buffer.from('backup test data', 'utf8')
    const testPassword = Buffer.from('backup test password', 'utf8')

    const backup = createBackup(testData, testPassword)
    debug(serializeBackup(backup))
    expect(openBackup(backup, testPassword)).toEqual(testData)
  })
})
