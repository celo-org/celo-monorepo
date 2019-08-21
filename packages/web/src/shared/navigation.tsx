import { StyleSheet, View } from 'react-native'
import Button, { BTN } from 'src/shared/Button.3'
import OvalCoin from 'src/shared/OvalCoin'
import { colors, textStyles } from 'src/styles'

interface Props {
  link?: string
  onPress?: () => void
  text: string
  selected: boolean
}

export default function Navigation({ link, text, selected, onPress }: Props) {
  return (
    <View style={styles.linkWrapper}>
      <Button
        style={[textStyles.medium, !selected && styles.notSelected]}
        kind={BTN.NAV}
        href={link}
        text={text}
        onPress={onPress}
      />
      {selected && (
        <View style={styles.activeTab}>
          <OvalCoin color={colors.primary} size={10} />
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
