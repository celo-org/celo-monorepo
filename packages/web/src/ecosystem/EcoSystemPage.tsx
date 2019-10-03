import EcuFund from 'src/ecosystem/EcoFund'
import ConnectionFooter from 'src/shared/ConnectionFooter'
import { View } from 'react-native'
export default function EcoSystemPage() {
  return (
    <View>
      <EcuFund />
      <ConnectionFooter />
    </View>
  )
}
