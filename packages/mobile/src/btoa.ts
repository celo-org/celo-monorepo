// TODO remove, move to celo/utils
export interface Global {
  btoa: any
  self: any
}

declare var global: Global
if (typeof global.self === 'undefined') {
  global.self = global
}
global.btoa = require('Base64').btoa
