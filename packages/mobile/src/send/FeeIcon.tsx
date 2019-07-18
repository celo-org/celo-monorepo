import Touchable from '@celo/react-components/components/Touchable'
import { iconHitslop } from '@celo/react-components/styles/variables'
import * as React from 'react'
import { StyleSheet } from 'react-native'
import InfoIcon from 'src/icons/InfoIcon'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
function navigateToEducate() {
  navigate(Screens.FeeEducation, {})
}

const FeeIcon = () => (
  <Touchable
    onPress={navigateToEducate}
    style={styles.area}
    borderless={true}
    hitSlop={iconHitslop}
  >
    <InfoIcon size={12} />
  </Touchable>
)

export default FeeIcon

const styles = StyleSheet.create({
  area: {
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
})
