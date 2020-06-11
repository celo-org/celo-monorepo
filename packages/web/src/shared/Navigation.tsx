import * as React from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import Button, { BTN } from 'src/shared/Button.3'
import OvalCoin from 'src/shared/OvalCoin'
import { colors, textStyles } from 'src/styles'

export enum NavigationTheme {
  LIGHT,
  DARKGOLD,
  DARKGREEN,
}

interface Props {
  link?: string
  onPress?: () => void
  text: string
  selected: boolean
  theme: NavigationTheme
  style?: StyleProp<ViewStyle>
}

export default function Navigation({ link, text, selected, onPress, theme, style }: Props) {
  const isDark = theme === NavigationTheme.DARKGOLD || theme === NavigationTheme.DARKGREEN
  const isGold = theme === NavigationTheme.DARKGOLD
  return (
    <View style={[styles.linkWrapper, style]}>
      <Button
        style={[textStyles.medium, !selected && styles.notSelected]}
        kind={isDark ? BTN.DARKNAV : BTN.NAV}
        href={link}
        text={text}
        onPress={onPress}
      />
      {selected && (
        <View style={styles.activeTab}>
          <OvalCoin color={isGold ? colors.gold : colors.primary} size={10} />
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
