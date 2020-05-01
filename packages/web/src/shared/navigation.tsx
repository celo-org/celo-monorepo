import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import Button, { BTN } from 'src/shared/Button.3'
import OvalCoin from 'src/shared/OvalCoin'
import { colors, textStyles } from 'src/styles'

export enum NavigationTheme {
  LIGHT,
  DARK,
}

interface Props {
  link?: string
  onPress?: () => void
  text: string
  selected: boolean
  theme?: NavigationTheme
}

export default function Navigation({ link, text, selected, onPress, theme }: Props) {
  return (
    <View style={styles.linkWrapper}>
      <Button
        style={[textStyles.medium, !selected && styles.notSelected]}
        kind={theme !== NavigationTheme.DARK ? BTN.NAV : BTN.DARKNAV}
        href={link}
        text={text}
        onPress={onPress}
      />
      {selected && (
        <View style={styles.activeTab}>
          <OvalCoin
            color={theme !== NavigationTheme.DARK ? colors.primary : colors.gold}
            size={10}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  linkWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    marginHorizontal: 15,
    marginBottom: 25,
  },
  activeTab: {
    position: 'absolute',
    height: 8,
    width: 7,
    bottom: -16,
  },
  notSelected: {
    color: colors.secondary,
  },
})
