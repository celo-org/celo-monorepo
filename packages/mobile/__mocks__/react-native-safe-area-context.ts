import { Dimensions } from 'react-native'

const { width, height } = Dimensions.get('window')

module.exports = {
  ...jest.requireActual('react-native-safe-area-context'),
  useSafeAreaInsets: () => ({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  }),
  useSafeAreaFrame: () => ({
    x: 0,
    y: 0,
    width,
    height,
  }),
}
