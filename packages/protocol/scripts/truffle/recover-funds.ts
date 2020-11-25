import { recoverFunds } from '../../lib/recover-funds'

module.exports = async (callback: (error?: any) => number) => {
  const argv = require('minimist')(process.argv.slice(5), {
    string: ['release_gold', 'from'],
  })

  await recoverFunds(argv.release_gold, argv.from)
  callback()
}
