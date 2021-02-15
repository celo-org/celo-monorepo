import AsyncStorage from '@react-native-community/async-storage'
import Reactotron from 'reactotron-react-native'
import ReactotronFlipper from 'reactotron-react-native/dist/flipper'
import { reactotronRedux } from 'reactotron-redux'

const reactotron = Reactotron.setAsyncStorageHandler?.(AsyncStorage)
  .configure({
    createSocket: (path) => new ReactotronFlipper(path),
  }) // controls connection & communication settings
  .useReactNative() // add all built-in react native plugins
  .use(reactotronRedux())
  .connect() // let's connect!

export default reactotron
