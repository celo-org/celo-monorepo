import * as React from 'react'
import { StyleSheet, Text } from 'react-native'
import Hoverable from 'src/shared/Hoverable'
import { colors, fonts, textStyles } from 'src/styles'

interface Props {
  href?: string
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
    setPressing(true)
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

export default function LightButon({ href, children, style }: Props) {
  const {
    onMouseEnter,
    onMouseLeave,
    onMouseDown,
    onMouseUp,
    // isPressing,
    // isHovering
  } = usePressable()
  return (
    <Hoverable
      onHoverIn={onMouseEnter}
      onHoverOut={onMouseLeave}
      onPressDown={onMouseDown}
      onPressUp={onMouseUp}
    >
      <Text style={[styles.root, fonts.mini, textStyles.heavy, style]} href={href}>
        {children}
      </Text>
    </Hoverable>
  )
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 4,
    backgroundColor: '#edeeef',
    color: colors.dark,
    paddingHorizontal: 7,
    paddingVertical: 9,
    cursor: 'pointer',
    alignItems: 'center',
    display: 'inline-flex',
  },
})
