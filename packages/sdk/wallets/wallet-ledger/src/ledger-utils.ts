import debugFactory from 'debug'

const debug = debugFactory('kit:wallet:ledger')

export function transportErrorFriendlyMessage(error: any) {
  debug('Possible connection lost with the ledger')
  debug(`Error message: ${error.statusCode} ${error.message}`)
  if (
    error.statusCode === 26368 ||
    error.statusCode === 26628 ||
    error.statusCode === 27404 ||
    error.message === 'NoDevice'
  ) {
    throw new Error(
      `Possible connection lost with the ledger. Check if still on and connected. ${error.message}`
    )
  }
  throw error
}
