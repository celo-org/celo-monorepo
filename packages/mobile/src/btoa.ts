// TODO remove, move to celo/utils
export interface Global {
  btoa: any
}

declare var global: Global

global.btoa = require('Base64').btoa
