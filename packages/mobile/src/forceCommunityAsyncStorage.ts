import AsyncStorage from '@react-native-community/async-storage'
import ReactNative from 'react-native'

// Monkey patch React Native so it uses the community implementation of AsyncStorage.
// This is to fix the problem of loosing AsyncStorage data on iOS when some modules
// import AsyncStorage from React Native Core and some others import from React Native Community.
// Since both implementations currently write to the same file on disk, the last one to write wins
// and erases the existing data written by the other.
// See https://github.com/react-native-community/async-storage/issues/118#issuecomment-500138053
// TODO: remove this once React Native removes AsyncStorage from Core.
Object.defineProperty(ReactNative, 'AsyncStorage', {
  get() {
    return AsyncStorage
  },
})
