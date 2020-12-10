import * as React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import RadioIcon from 'src/icons/RadioIcon'
import Fade from 'src/shared/AwesomeFade'
import Button, { BTN } from 'src/shared/Button.3'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'

interface RadioProps {
  selected: boolean
  icon?: React.ReactNode
  label: string
  labelColor?: colors
  onValueSelected: (x: any) => void
  value: any
  colorWhenSelected?: colors
}

export function Radio({
  selected,
  label,
  labelColor,
  icon,
  onValueSelected,
  value,
  colorWhenSelected,
}: RadioProps) {
  const onSelect = () => onValueSelected(value)
  return (
    <TouchableOpacity onPress={onSelect}>
      <View style={styles.radioRow}>
        <RadioIcon selected={selected} colorWhenSelected={colorWhenSelected} />
        <View style={styles.radioSpacer}>{icon || null}</View>
        <Text style={[fonts.p, labelColor && { color: labelColor }]} accessibilityRole="label">
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

export function SectionHeader({ section }) {
  const title = section.title
  return (
    <View style={[standardStyles.blockMarginTopMobile, standardStyles.elementalMarginBottom]}>
      <Fade distance="20px">
        <Text style={fonts.h4}>{title}</Text>
        <View style={styles.line} />
      </Fade>
    </View>
  )
}

interface NotFoundProps {
  onPress: () => unknown
  actionText: string
  longText: string
}
export function NoneFound({ onPress, actionText, longText }: NotFoundProps) {
  return (
    <Fade distance="20px">
      <View style={[standardStyles.centered, styles.noJobs]}>
        <Text style={[fonts.p, standardStyles.elementalMarginBottom, textStyles.center]}>
          {longText}
        </Text>
        <Button kind={BTN.SECONDARY} text={actionText} onPress={onPress} />
      </View>
    </Fade>
  )
}

const styles = StyleSheet.create({
  line: {
    width: '100%',
    height: 1,
    maxHeight: 1,
    borderTopWidth: 1,
    borderTopColor: colors.gray,
    marginTop: 10,
  },
  noJobs: {
    height: 200,
    padding: 20,
  },
  radioRow: {
    flexDirection: 'row',
    marginVertical: 10,
    alignContent: 'center',
    alignItems: 'center',
  },
  radioSpacer: {
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
})
