const Reanimated = require('react-native-reanimated/mock')

// The mock for `call` immediately calls the callback which is incorrect
// So we override it with a no-op
Reanimated.default.call = () => {}

module.exports = Reanimated
