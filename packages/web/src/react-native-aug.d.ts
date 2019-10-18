import 'react-native'

declare module 'react-native' {
  interface TextProps {
    accessibilityRole?: 'button' | 'heading' | 'label' | 'link' | 'listitem'
    tabIndex?: number
    href?: string
    target?: string
    id?: string
    onClick?: () => void
  }

  interface TextStyle {
    textRendering?: string
    listStyle?: 'disc' | 'circle' | 'square' | 'decimal' | 'none'
    display?: 'list-item' | 'inline' | 'none' | 'inline-flex'
    transitionProperty?: string
    transitionDuration?: string
  }

  interface ViewStyle {
    appearance?: string
    animationDelay?: string
    animationDuration?: string
    animationFillMode?: 'both' | 'backwards' | 'forwards' | 'none'
    animationIterationCount?: string | number
    animationKeyframes?: unknown[]
    animationTimingFunction?: string
    cursor?: string
    display?: 'none' | 'flex' | 'inline' | 'inline-flex'
    fill?: string
    filter?: string
  }

  interface ImageProps {
    className?: string
  }
  interface ScrollViewProps {
    className?: string
  }

  interface ViewProps {
    onClick?: () => void
    accessibilityRole?: 'list' | 'link' | 'button'
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
