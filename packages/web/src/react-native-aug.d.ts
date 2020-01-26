import 'react-native'

declare module 'react-native' {
  interface TextStyle {
    textRendering?: string
    listStyle?: 'disc' | 'circle' | 'square' | 'decimal' | 'none' | 'lower-alpha'
    display?: 'list-item' | 'inline' | 'none' | 'inline-flex' | 'flex'
    transitionProperty?: string
    transitionDuration?: string
    gridArea?: string
  }

  interface ViewStyle {
    position?: 'absolute' | 'relative' | 'fixed' | 'static'
    isolation?: 'isolate'
    appearance?: string
    transformOrigin?: string | number
    animationDelay?: string
    animationDuration?: string
    animationFillMode?: 'both' | 'backwards' | 'forwards' | 'none'
    animationIterationCount?: 'infinite' | number
    animationKeyframes?: unknown[]
    animationTimingFunction?: string
    gridArea?: string
    gridRowGap?: string | number
    gridColumnGap?: string | number
    gridTemplateColumns?: string
    cursor?: string
    display?: 'none' | 'flex' | 'inline' | 'inline-flex' | 'list-item' | 'block' | 'grid'
    fill?: string
    filter?: string
    mixBlendMode?: 'multiply' | 'screen'
    scrollPadding?: number
  }

  interface ImageProps {
    className?: string
  }
  interface ScrollViewProps {
    className?: string
  }

  interface TextProps {
    accessibilityRole?: 'button' | 'heading' | 'label' | 'link' | 'listitem'
    tabIndex?: number
    href?: string
    target?: string
    id?: string
    onClick?: () => void
    style?: StyleProp<TextStyle>
  }

  interface ViewProps {
    onClick?: () => void
    accessibilityRole?: 'list' | 'link' | 'button'
    style?: StyleProp<ViewStyle>
  }

  interface TextInputProps {
    name?: string
    type?: string
    required?: boolean
  }

  interface PickerProps {
    name?: string
  }
}
