import Touchable from '@celo/react-components/components/Touchable'
import BackChevron from '@celo/react-components/icons/BackChevron'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'

interface Props {
  navigateBack: () => void
}
export default class BackButton extends React.PureComponent<Props> {
  render() {
    return (
      <View style={style.container}>
        <Touchable
          style={style.container}
          onPress={this.props.navigateBack}
          borderless={true}
          hitSlop={variables.iconHitslop}
        >
          <BackChevron height={SIZE} />
        </Touchable>
      </View>
    )
  }
}
const SIZE = 16

const style = StyleSheet.create({
  container: {
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
