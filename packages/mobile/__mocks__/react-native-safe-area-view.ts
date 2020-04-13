import { useSafeArea } from './react-native-safe-area-context'

export default 'SafeAreaView'

export const SafeAreaConsumer = ({ children }) => {
  const insets = useSafeArea()
  return children(insets)
}
