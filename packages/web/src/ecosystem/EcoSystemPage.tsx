import { View } from 'react-native'
import EcuFund from 'src/ecosystem/EcoFund'
import ConnectionFooter from 'src/shared/ConnectionFooter'
import EcoCover from 'src/ecosystem/EcoCover'
export default function EcoSystemPage() {
  return (
    <View>
      <EcoCover />
      <EcuFund />
      <ConnectionFooter />
    </View>
  )
}
