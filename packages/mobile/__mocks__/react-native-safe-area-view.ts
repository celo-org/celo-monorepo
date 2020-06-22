import { useSafeArea as useSafeAreaOriginal } from './react-native-safe-area-context'

export default 'SafeAreaView'

export const SafeAreaConsumer = ({ children }) => {
  const insets = useSafeAreaOriginal()
  return children(insets)
}

export const useSafeArea = useSafeAreaOriginal
