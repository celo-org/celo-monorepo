import Touchable from '@celo/react-components/components/Touchable'
import ForwardChevron from '@celo/react-components/icons/ForwardChevron'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'

export interface SettingsItemProps {
  testID?: string
  title?: string
  children?: React.ReactChild
  onPress?: () => void
}

class SettingsItem extends React.Component<SettingsItemProps> {
  render() {
    const { testID, title, onPress, children } = this.props

    return (
      <Touchable testID={testID} onPress={onPress}>
        <View style={style.settingsItemContainer}>
          <View style={[style.title]}>
            {children ? children : <Text style={fontStyles.body}>{title}</Text>}
          </View>
          <View style={[style.cta]}>
            <ForwardChevron height={16} />
          </View>
        </View>
      </Touchable>
    )
  }
}

const style = StyleSheet.create({
  settingsItemContainer: {
    paddingVertical: 16,
    paddingRight: 16,
    marginLeft: 16,
    borderBottomWidth: 1,
    borderColor: colors.darkLightest,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    justifyContent: 'center',
  },
  cta: {
    justifyContent: 'center',
  },
})

export default SettingsItem
