import { View } from 'react-native'
import EcoCover from 'src/ecosystem/EcoCover'
import EcuFund from 'src/ecosystem/EcoFund'
import ConnectionFooter from 'src/shared/ConnectionFooter'
export default function EcoSystemPage() {
  return (
    <View>
      <EcoCover />
      <EcuFund />
      <ConnectionFooter />
    </View>
  )
}
