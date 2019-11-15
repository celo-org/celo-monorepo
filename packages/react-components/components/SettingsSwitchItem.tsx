import Switch from '@celo/react-components/components/Switch'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'

export interface Props {
  title?: string
  details?: string
  switchValue: boolean
  onSwitchChange: (value: boolean) => void
  children?: React.ReactChild
}

class SettingsSwitchItem extends React.PureComponent<Props> {
  render() {
    const { title, children, details, onSwitchChange, switchValue } = this.props
    return (
      <View style={style.settingsItemContainer}>
        <View style={style.settingsItemMain}>
          <View style={[style.title]}>
            {children ? children : <Text style={fontStyles.body}>{title}</Text>}
          </View>
          <View style={[style.cta]}>
            <Switch value={switchValue} onValueChange={onSwitchChange} />
          </View>
        </View>
        {details && (
          <View style={style.settingsItemDetail}>
            <Text>{details}</Text>
          </View>
        )}
      </View>
    )
  }
}

const style = StyleSheet.create({
  settingsItemContainer: {
    marginLeft: 15,
    borderBottomWidth: 1,
    borderColor: colors.darkLightest,
  },
  settingsItemMain: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  settingsItemDetail: {
    paddingRight: 20,
    paddingBottom: 20,
    paddingLeft: 20,
  },
  title: {
    justifyContent: 'center',
  },
  cta: {
    justifyContent: 'center',
  },
})

export default SettingsSwitchItem
