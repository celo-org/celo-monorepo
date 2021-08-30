# Setup

## Quick Start

To get started, it is easiest to just use our Truffle Box template at [https://github.com/celo-org/celo-dappkit](https://github.com/celo-org/celo-dappkit). This repository includes a "Hello World" example for getting started with DappKit.

## Configuration

Read on for more details about how to set up and configure DappKit.

### Installation

To create a new expo project, you'll want to use the expo-cli

```bash
npm install expo-cli --global
// or
yarn global add expo-cli

expo init $YOUR_APP_NAME
```

Read more about general Expo setup at [https://expo.io/learn](https://expo.io/learn)

### Typescript Support

We are big fans of Typescript, so if you used the tabs template, you can support typescript by just following [these guidelines](https://docs.expo.io/versions/latest/guides/typescript/)

### Setup

To add DAppKit, run

```bash
npm install @celo/dappkit
// or
yarn add @celo/dappkit
```

You will need node version `8.13.0` or higher.

DAppKit's dependencies require a bit of adjustment to a vanilla Expo. The first are a lot of the Node.js modules that are expected. You can get those mostly by using the following modules

```bash
npm install node-libs-react-native vm-browserify
// or
yarn add node-libs-react-native vm-browserify
```

You will need to add the following `metro.config.js` to your project root and make sure that the associated npm packages are installed.

```javascript
const crypto = require.resolve('crypto-browserify')
const url = require.resolve('url/')
module.exports = {
  resolver: {
    extraNodeModules: {
      crypto,
      url,
      fs: require.resolve('expo-file-system'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      net: require.resolve('react-native-tcp'),
      os: require.resolve('os-browserify/browser.js'),
      path: require.resolve('path-browserify'),
      stream: require.resolve('readable-stream'),
      vm: require.resolve('vm-browserify')
    }
  }
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
  global.btoa = function (str) {
    return new Buffer(str, 'binary').toString('base64')
  }
}

global.Buffer = require('buffer').Buffer
global.process = require('process')
global.location = {
  protocol: 'https',
}
```

You may also get two warnings that can be ignored, you can suppress them in the yellow banner with the following in your `App.js/tsx`

```typescript
import { YellowBox } from 'react-native'

YellowBox.ignoreWarnings([
  "Warning: The provided value 'moz",
  "Warning: The provided value 'ms-stream",
])
```

