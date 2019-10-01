'use strict'
exports.__esModule = true
var env_utils_1 = require('src/lib/env-utils')
exports.command = 'account <accountCommand>'
exports.describe = 'commands for inviting, fauceting, looking up accounts and users'
exports.builder = function(argv) {
  return env_utils_1.addCeloEnvMiddleware(argv).commandDir('account', { extensions: ['ts'] })
}
exports.handler = function() {
  // empty
}
