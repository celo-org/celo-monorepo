import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Ul } from 'src/fonts/Fonts'
import { ScreenProps, withScreenSize } from 'src/layout/ScreenSize'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import { fonts, standardStyles, textStyles, colors } from 'src/styles'
import OvalCoin from 'src/shared/OvalCoin'

interface BTNProps {
  title: string
  href: string
}

interface Props {
  title: string
  text: string
  label: string
  id: string
  children: React.ReactNode
  buttonOne: BTNProps
  buttonTwo: BTNProps
  onPress: () => void
  isSelected: boolean
}

export default withScreenSize(
  React.memo(function StackSection(props: Props & ScreenProps) {
    const { title, text, buttonOne, buttonTwo, children, onPress, isSelected } = props
    return (
      <View
        nativeID={props.id}
        style={{
          flexDirection: 'row',
          flex: 1,
          width: '100%',
          justifyContent: 'space-between',
          marginVertical: 20,
        }}
      >
        <View style={{ width: '100%', maxWidth: 400 }}>
          <Text
            onPress={onPress}
            style={[fonts.h5, standardStyles.elementalMarginBottom, textStyles.invert]}
          >
            {isSelected && (
              <View style={{ position: 'absolute', transform: [{ translateX: -30 }] }}>
                <OvalCoin color={colors.primary} size={15} />
              </View>
            )}
            {title}
          </Text>
          <Text style={[fonts.p, textStyles.invert]}>{text}</Text>
          <Ul style={styles.list}>{children}</Ul>
        </View>
        <View style={{ marginHorizontal: 10 }}>
          <Button
            text={buttonOne.title}
            kind={BTN.PRIMARY}
            size={SIZE.small}
            href={buttonOne.href}
            target={'blank'}
          />
          <View style={styles.separator} />
          <Button
            text={buttonTwo.title}
            kind={BTN.SECONDARY}
            size={SIZE.small}
            href={buttonTwo.href}
            target={'blank'}
            align="flex-start"
          />
        </View>
      </View>
    )
  })
)

const styles = StyleSheet.create({
  content: {
    justifyContent: 'space-between',
  },
  buttonArea: {
    alignItems: 'center',
    flex: 1,
  },
  separator: {
    marginVertical: 10,
  },
  mobile: {
    flexDirection: 'column',
  },
  list: {
    marginLeft: 10,
  },
  buttonsMobile: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
})
