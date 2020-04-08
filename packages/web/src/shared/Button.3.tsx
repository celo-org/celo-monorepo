import * as React from 'react'
import { StyleSheet, Text, TextStyle, View } from 'react-native'
import Chevron from 'src/icons/chevron'
import Hoverable from 'src/shared/Hoverable'
import Link from 'src/shared/Link'
import { colors, fonts, textStyles } from 'src/styles'

export enum BTN {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
  TERTIARY = 'TERTIARY',
  NAKED = 'NAKED',
  DARKNAKED = 'DARKNAKED',
  NAV = 'NAV',
  DARKNAV = 'DARKNAV',
  INLINE = 'INLINE',
}
export enum SIZE {
  small = 'small',
  normal = 'normal',
  big = 'big',
  fullWidth = 'fullWidth',
}

interface AllButtonProps {
  text: string
  href?: string
  target?: string // only relevent if href used
  disabled?: boolean
  onPress?: () => void
  iconRight?: React.ReactNode
  iconLeft?: React.ReactNode
  align?: 'center' | 'flex-start' | 'flex-end'
  style?: TextStyle | TextStyle[]
}

type NakedProps = {
  size: SIZE
  kind: BTN.NAKED | BTN.DARKNAKED
} & AllButtonProps

export type PrimaryProps = {
  onDarkBackground?: boolean
  size?: SIZE
  kind: BTN.PRIMARY | BTN.SECONDARY | BTN.TERTIARY
} & AllButtonProps

type InlineProps = {
  kind: BTN.INLINE
} & AllButtonProps

type NavProps = {
  kind: BTN.NAV | BTN.DARKNAV
} & AllButtonProps

type ButtonsProps = NakedProps | PrimaryProps | InlineProps | NavProps

interface State {
  isHovering: boolean
  isPressed: boolean
}

export default class Button extends React.PureComponent<ButtonsProps, State> {
  state = { isHovering: false, isPressed: false }

  getStatus = () => {
    if (this.props.disabled) {
      return BTNStates.disabled
    } else if (this.state.isPressed) {
      return BTNStates.press
    } else if (this.state.isHovering) {
      return BTNStates.hover
    }
    return BTNStates.normal
  }

  getButtonComponent() {
    switch (this.props.kind) {
      case BTN.PRIMARY:
        return ButtonPrimary
      case BTN.SECONDARY:
        return ButtonSecondary
      case BTN.TERTIARY:
        return ButtonTertiary
      case BTN.DARKNAKED:
      case BTN.NAKED:
        return ButtonNaked
      case BTN.DARKNAV:
      case BTN.NAV:
        return ButtonNav
      case BTN.INLINE:
        return ButtonInline
      default:
        return ButtonPrimary
    }
  }

  onMouseEnter = () => {
    this.setState({ isHovering: true })
  }
  onMouseLeave = () => {
    this.setState({ isHovering: false, isPressed: false })
  }
  onMouseDown = () => {
    this.setState({ isPressed: true })
  }
  onMouseUp = () => {
    this.setState({ isPressed: false })
  }

  onPress = () => {
    if (this.props.disabled) {
      return // noop
    } else if (this.props.onPress) {
      this.props.onPress()
    }
  }

  render() {
    const { text, align, iconRight, iconLeft } = this.props
    const ButtonComponent = this.getButtonComponent()

    return (
      <Hoverable
        onHoverIn={this.onMouseEnter}
        onHoverOut={this.onMouseLeave}
        onPressDown={this.onMouseDown}
        onPressUp={this.onMouseUp}
        onPress={this.onPress}
      >
        <View
          style={[{ alignItems: align }, this.props.kind === BTN.INLINE && inlineStyle.container]}
        >
          <ButtonComponent status={this.getStatus()} {...this.props}>
            {iconLeft && <View style={baseStyles.iconLeft}>{iconLeft}</View>}
            {text}
            {iconRight && <View style={baseStyles.iconRight}>{iconRight}</View>}
          </ButtonComponent>
        </View>
      </Hoverable>
    )
  }
}

enum BTNStates {
  normal = 'normal',
  hover = 'hover',
  press = 'press',
  disabled = 'disabled',
}

interface Props {
  status: BTNStates
  kind?: BTN
  children: React.ReactNode
  size?: SIZE
  style?: TextStyle | TextStyle[]
  href?: string
  target?: string
  onDarkBackground?: boolean
}

function ButtonPrimary(props: Props) {
  const { children, status, size, style, href, target, onDarkBackground } = props
  return (
    <Link href={href} passHref={true}>
      <Text
        href={href}
        target={target}
        accessibilityRole="link"
        style={[
          baseStyles.base,
          baseStyles.verticallyAlign,
          fonts.navigation,
          sizeStyle(size),
          primaryStyles[status],
          textStyles.medium,
          status === BTNStates.disabled && onDarkBackground
            ? primaryStyles.darkText
            : primaryStyles.text,
          style,
          status === BTNStates.disabled && baseStyles.notAllowed,
        ]}
      >
        {children}
      </Text>
    </Link>
  )
}

function ButtonSecondary(props: Props) {
  const { children, status, size, style, href, target } = props

  return (
    <View style={secondaryStyles[status]}>
      <Link href={href} passHref={true}>
        <Text
          href={href}
          target={target}
          accessibilityRole="link"
          style={[
            baseStyles.base,
            sizeStyle(size),
            baseStyles.verticallyAlign,
            fonts.navigation,
            sizeStyle(size),
            verticalSize(size),
            textStyles.medium,
            commonTextStyles[status],
            style,
          ]}
        >
          {children}
        </Text>
      </Link>
    </View>
  )
}

function ButtonTertiary(props: Props) {
  const { children, status, size, style, href, target } = props
  return (
    <Link href={href} passHref={true}>
      <Text
        href={href}
        target={target}
        accessibilityRole="link"
        style={[
          baseStyles.base,
          baseStyles.verticallyAlign,
          sizeStyle(size),
          baseStyles.floating,
          fonts.navigation,
          sizeStyle(size),
          textStyles.medium,
          commonTextStyles[status],
          style,
        ]}
      >
        {children}
      </Text>
    </Link>
  )
}

const nakedColor = {
  [BTNStates.normal]: colors.primary,
  [BTNStates.hover]: colors.primaryHover,
  [BTNStates.press]: colors.primaryPress,
  [BTNStates.disabled]: colors.inactive,
}

function nakedSize(size: SIZE) {
  switch (size) {
    case SIZE.big:
    case SIZE.fullWidth:
      return 20
    case SIZE.normal:
      return 16
    case SIZE.small:
      return 14
  }
}

function ButtonNaked(props: Props) {
  const { children, status, kind, style, href, size, target } = props
  const color = kind === BTN.DARKNAKED ? colors.dark : nakedColor[status]
  const textStyle = kind === BTN.DARKNAKED ? opacityStyle[status] : commonTextStyles[status]
  const opacity = kind === BTN.DARKNAKED ? opacityState[status].opacity : 1
  const fontSize = nakedSize(size)
  return (
    <View style={[baseStyles.base, baseStyles.floating, nakedStyles.container]}>
      <Link href={href}>
        <Text
          accessibilityRole="link"
          href={href}
          target={target}
          style={[
            fonts.navigation,
            baseStyles.verticallyAlign,
            textStyle,
            { fontSize },
            textStyles.medium,
            style,
          ]}
        >
          {children}

          <View style={nakedStyles.chevron}>
            <Chevron color={color} opacity={opacity} size={'0.75em'} />
          </View>
        </Text>
      </Link>
    </View>
  )
}
ButtonNaked.displayName = 'ButtonNaked'

const nakedStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  chevron: {
    paddingTop: '0.185em',
    paddingLeft: '0.4em',
  },
})

function ButtonNav(props: Props) {
  const { children, status, kind, style, href, target } = props
  const color = kind === BTN.DARKNAV ? colors.white : colors.dark
  return (
    <Link href={href} passHref={true}>
      <Text
        href={href}
        target={target}
        accessibilityRole="link"
        style={[
          baseStyles.base,
          baseStyles.verticallyAlign,
          baseStyles.floating,
          fonts.navigation,
          { color },
          opacityStyle[status],
          style,
        ]}
      >
        {children}
      </Text>
    </Link>
  )
}

function ButtonInline(props: Props) {
  const { children, status, style, href, target } = props
  return (
    <Link href={href} passHref={true}>
      <Text
        href={href}
        target={target}
        accessibilityRole="link"
        style={[inlineStyle.text, inlineStyle.container, opacityStyle[status], style]}
      >
        {children}
      </Text>
    </Link>
  )
}

const inlineStyle = StyleSheet.create({
  text: {
    cursor: 'pointer',
    textDecorationStyle: 'solid',
    textDecorationLine: 'underline',
  },
  container: {
    display: 'inline',
  },
})

const sizeStyle = (size: SIZE) => {
  if (size === SIZE.small) {
    return baseStyles.small
  } else if (size === SIZE.fullWidth) {
    return baseStyles.fullWidth
  } else if (size === SIZE.big) {
    return baseStyles.big
  }

  return baseStyles.standard
}

function verticalSize(size: SIZE) {
  return boxedVertical[size]
}

const borderRadius = 3
const borderWidth = 1

const primaryStyles = StyleSheet.create({
  normal: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderRadius,
    borderWidth,
  },
  hover: {
    backgroundColor: colors.primaryHover,
    borderColor: colors.primaryHover,
    borderRadius,
    borderWidth,
  },
  press: {
    backgroundColor: colors.primaryPress,
    borderColor: colors.primaryPress,
    outlineColor: colors.primaryPress,
    borderRadius,
    borderWidth,
  },
  disabled: {
    backgroundColor: colors.inactive,
    borderColor: colors.inactive,
    borderRadius,
    borderWidth,
  },
  darkText: {
    color: colors.dark,
  },
  text: {
    color: colors.white,
  },
})

const secondaryStyles = StyleSheet.create({
  normal: {
    backgroundColor: 'transparent',
    borderColor: colors.gray,
    borderRadius,
    borderWidth,
  },
  hover: {
    backgroundColor: 'transparent',
    borderColor: colors.primaryHover,
    borderRadius,
    borderWidth,
  },
  press: {
    backgroundColor: 'transparent',
    borderColor: colors.primaryPress,
    outlineColor: colors.primaryPress,
    borderRadius,
    borderWidth,
  },
  disabled: {
    backgroundColor: 'transparent',
    borderColor: colors.gray,
    cursor: 'not-allowed',
    borderRadius,
    borderWidth,
  },
})

const commonTextStyles = StyleSheet.create({
  normal: {
    color: colors.primary,
  },
  hover: {
    color: colors.primaryHover,
  },
  press: {
    color: colors.primaryPress,
  },
  disabled: {
    color: colors.inactive,
    cursor: 'not-allowed',
  },
})
const opacityState = {
  normal: {
    opacity: 1,
  },
  hover: {
    opacity: 0.75,
  },
  press: {
    opacity: 1,
  },
  disabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
}
const opacityStyle = StyleSheet.create(opacityState)

enum VERTICAL_PAD {
  big = 20,
  standard = 10,
  small = 7,
  fullWidth = 15,
}

const baseStyles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    flexGrow: 0,
    width: 'fit-content',
    opacity: 1,
  },
  verticallyAlign: {
    display: 'inline-flex',
    alignItems: 'center',
  },
  big: {
    minWidth: 200,
    paddingVertical: VERTICAL_PAD.big,
    paddingHorizontal: 30,
    fontSize: 20,
  },
  standard: {
    minWidth: 150,
    paddingVertical: VERTICAL_PAD.standard,
    paddingHorizontal: 20,
  },
  small: {
    minWidth: 100,
    paddingVertical: VERTICAL_PAD.small,
    paddingHorizontal: 10,
  },
  fullWidth: {
    flexGrow: 1,
    width: '100%',
    paddingVertical: VERTICAL_PAD.fullWidth,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floating: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    outlineColor: 'transparent',
  },
  notAllowed: { cursor: 'not-allowed' },
  iconLeft: {
    paddingRight: 8,
  },
  iconRight: {
    paddingLeft: 8,
  },
})

const boxedVertical = StyleSheet.create({
  big: {
    paddingVertical: VERTICAL_PAD.big - 1,
  },
  normal: {
    paddingVertical: VERTICAL_PAD.standard - 1,
  },
  small: {
    paddingVertical: VERTICAL_PAD.small - 1,
  },
  fullWidth: {
    paddingVertical: VERTICAL_PAD.fullWidth - 1,
  },
})
