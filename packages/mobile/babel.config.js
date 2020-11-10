module.exports = {
  plugins: [[require('@babel/plugin-proposal-decorators').default, { legacy: true }]],
  presets: ['module:metro-react-native-babel-preset'],
}
