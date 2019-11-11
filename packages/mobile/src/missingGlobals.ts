// TODO remove, move to celo/utils
export interface Global {
  btoa: any
  URL: any
  self: any
}

declare var global: Global
if (typeof global.self === 'undefined') {
  global.self = global
}
global.btoa = require('Base64').btoa
// Without this, one will see a confusing error
// similar to https://imgur.com/a/7rnLIh5
global.URL = require('whatwg-url').URL
