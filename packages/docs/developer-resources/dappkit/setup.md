# Setup

To get started, it is easiest to just use our expo base template at [https://github.com/celo-org/dappkit-base](https://github.com/celo-org/dappkit-base).

If you would like to manually setup the above template, follow the steps below:

## Installation

To create a new expo project, you'll want to use the expo-cli

```bash
npm install expo-cli --global
// or
yarn global add expo-cli

expo init $YOUR_APP_NAME
```

Read more about general Expo setup at [https://expo.io/learn](https://expo.io/learn)

## Typescript Support

We are big fans of Typescript, so if you used the tabs template, you can support typescript by just following [these guidelines](https://docs.expo.io/versions/latest/guides/typescript/)

## Setup

To add DAppKit, simply add `@celo/dappkit@0.0.9` to your package.json or

```bash
npm install @celo/dappkit@0.0.9
// or
yarn add @celo/dappkit@0.0.9
```

DAppKit's dependencies require a bit of adjustment to a vanilla Expo. The first are a lot of the Node.js modules that are expected. You can get those mostly by using the following modules

```bash
npm install node-libs-react-native vm-browserify
// or
yarn add node-libs-react-native vm-browserify
```

You will need to add the following `metro.config.js` to your project root

```js
const crypto = require.resolve('crypto-browserify')
const url = require.resolve('url/')
module.exports = {
  resolver: {
    extraNodeModules: {
      crypto,
      url,
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      os: require.resolve('os-browserify/browser.js'),
      stream: require.resolve('readable-stream'),
      vm: require.resolve('vm-browserify'),
    },
  },
}
```

This should allow you to build the project, however some dependencies might expect certain invariants on the global environment. For that you should create a file `global.ts` with the following contents and then add `import './global'` at the top of your `App.js/tsx` file:

```typescript
export interface Global {
  btoa: any
  self: any
  Buffer: any
  process: any
  location: any
}

declare var global: Global
if (typeof global.self === 'undefined') {
  global.self = global
}
if (typeof btoa === 'undefined') {
  global.btoa = function(str) {
    return new Buffer(str, 'binary').toString('base64')
  }
}

global.Buffer = require('buffer').Buffer
global.process = require('process')
global.location = {
  protocol: 'https',
}
```

You'll also constantly get two warnings that can be ignored, you can suppress them in the yellow banner with the following in your `App.js/tsx`

```typescript
import { YellowBox } from 'react-native'

YellowBox.ignoreWarnings([
  "Warning: The provided value 'moz",
  "Warning: The provided value 'ms-stream",
])
```
