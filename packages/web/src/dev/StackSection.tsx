import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Ul } from 'src/fonts/Fonts'
import { useScreenSize } from 'src/layout/ScreenSize'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import OvalCoin from 'src/shared/OvalCoin'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'

interface BTNProps {
  title: string
  href: string
}

interface Props {
  title: string
  text: string
  label?: string
  id: string
  children: React.ReactNode
  buttonOne: BTNProps
  buttonTwo: BTNProps
  onPress: () => void
  isSelected: boolean
}

const TRANS_DURATION = 500

export default React.memo(function StackSection(props: Props) {
  const { title, text, buttonOne, buttonTwo, children, onPress, isSelected } = props
  const { isMobile, isDesktop } = useScreenSize()
  const containerStyle = isMobile ? styles.mobileContainer : styles.container

  return (
    <View
      nativeID={props.id}
      // @ts-ignore issue with transition* even though Stylesheet is fine with it
      style={[containerStyle, styles.fade, isSelected ? styles.bright : styles.dim]}
    >
      <View style={styles.content}>
        <Text
          onPress={onPress}
          style={[fonts.h6, standardStyles.elementalMarginBottom, textStyles.invert]}
        >
          {isDesktop && (
            <View style={[styles.coin, isSelected ? styles.bright : styles.off]}>
              <OvalCoin color={colors.primary} size={15} />
            </View>
          )}

          {title}
        </Text>
        <Text style={[fonts.p, textStyles.invert]}>{text}</Text>
        <Ul style={styles.list}>{children}</Ul>
      </View>
      <View style={isMobile ? styles.mobileButtonArea : styles.buttonArea}>
        <Button
          text={buttonOne.title}
          kind={BTN.PRIMARY}
          size={isDesktop ? SIZE.small : SIZE.normal}
          href={buttonOne.href}
          target={'blank'}
        />
        <View style={isMobile ? styles.separatorHorizontal : styles.separator} />
        <Button
          text={buttonTwo.title}
          kind={BTN.SECONDARY}
          size={isDesktop ? SIZE.small : SIZE.normal}
          href={buttonTwo.href}
          target={'blank'}
          align="flex-start"
        />
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flex: 1,
    flexBasis: 'auto',
    width: '100%',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  mobileContainer: {
    marginBottom: 60,
  },
  fade: {
    transitionDuration: '500ms',
    transitionProperty: 'opacity',
  },
  content: {
    flex: 1,
    maxWidth: 400,
  },
  buttonArea: {
    marginTop: 45,
    marginHorizontal: 10,
  },
  separator: {
    marginVertical: 10,
  },
  separatorHorizontal: {
    marginHorizontal: 20,
  },
  mobile: {
    flexDirection: 'column',
  },
  list: {
    marginLeft: 10,
  },
  mobileButtonArea: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  coin: {
    transitionProperty: 'opacity',
    transitionDuration: `${TRANS_DURATION}ms`,
    transform: [{ translateX: -30 }],
    position: 'absolute',
  },
  bright: { opacity: 1 },
  dim: { opacity: 0.6 },
  off: { opacity: 0 },
})
