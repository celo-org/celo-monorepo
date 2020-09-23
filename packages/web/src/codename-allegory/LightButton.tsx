import * as React from 'react'
import { StyleSheet, Text } from 'react-native'
import Hoverable from 'src/shared/Hoverable'
import { colors, fonts, textStyles } from 'src/styles'

interface Props {
  href?: string
  onPress?: () => void
  children: React.ReactNode
  style?: any
}

function usePressable() {
  const [isPressing, setPressing] = React.useState(false)
  const [isHovering, setHovering] = React.useState(false)

  const onMouseEnter = () => {
    setHovering(true)
  }
  const onMouseLeave = () => {
    setHovering(false)
    setPressing(false)
  }
  const onMouseDown = () => {
    setPressing(true)
  }
  const onMouseUp = () => {
    setPressing(false)
  }
  return {
    onMouseEnter,
    onMouseLeave,
    onMouseDown,
    onMouseUp,
    isPressing,
    isHovering,
  }
}

export default function LightButon({ href, children, style, onPress }: Props) {
  const {
    onMouseEnter,
    onMouseLeave,
    onMouseDown,
    onMouseUp,
    isPressing,
    isHovering,
  } = usePressable()
  return (
    <Hoverable
      onHoverIn={onMouseEnter}
      onHoverOut={onMouseLeave}
      onPressDown={onMouseDown}
      onPressUp={onMouseUp}
      onPress={onPress}
    >
      <Text
        style={[
          styles.root,
          fonts.mini,
          textStyles.heavy,
          style,
          isHovering && styles.hover,
          isPressing && styles.pressing,
        ]}
        href={href}
        accessibilityRole="link"
      >
        {children}
      </Text>
    </Hoverable>
  )
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 4,
    backgroundColor: colors.lightGray,
    color: colors.dark,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
    paddingVertical: 9,
    cursor: 'pointer',
    alignItems: 'center',
    display: 'inline-flex',
    transitionProperty: 'background-color, border',
    transitionDuration: '300ms',
  },
  hover: {
    backgroundColor: colors.gray,
    borderColor: colors.gray,
  },
  pressing: {
    borderColor: colors.white,
    backgroundColor: colors.lightGray,
  },
})
