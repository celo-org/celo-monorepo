import * as React from 'react'

interface State {
  isHovered: boolean
  showHover: boolean
}

type KidsOrKidsAsFunc = ((currentlyHovering: boolean) => React.ReactNode) | React.ReactNode

interface Props {
  children: KidsOrKidsAsFunc
  onHoverIn?: () => void
  onHoverOut?: () => void
  onPressDown?: () => void
  onPressUp?: () => void
  onPress?: () => void
}

export default class Hoverable extends React.Component<Props, State> {
  isHoverEnabled: boolean = true

  constructor(props) {
    super(props)
    this.state = { isHovered: false, showHover: true }
  }

  checkIfHoverEnabled = () => {
    /**
     * Web browsers emulate mouse events (and hover states) after touch events.
     * This code infers when the currently-in-use modality supports hover
     * (including for multi-modality devices) and considers "hover" to be enabled
     * if a mouse movement occurs more than 1 second after the last touch event.
     * This threshold is long enough to account for longer delays between the
     * browser firing touch and mouse events on low-powered devices.
     */
    const HOVER_THRESHOLD_MS = 1000
    let lastTouchTimestamp = 0

    function enableHover() {
      if (this.isHoverEnabled || Date.now() - lastTouchTimestamp < HOVER_THRESHOLD_MS) {
        return
      }
      this.isHoverEnabled = true
    }

    function disableHover() {
      lastTouchTimestamp = Date.now()
      if (this.isHoverEnabled) {
        this.isHoverEnabled = false
      }
    }

    window.document.addEventListener('touchstart', disableHover, true)
    window.document.addEventListener('touchmove', disableHover, true)
    window.document.addEventListener('mousemove', enableHover, true)
  }

  onMouseEnter = () => {
    if (this.isHoverEnabled && !this.state.isHovered) {
      const { onHoverIn } = this.props
      if (onHoverIn) {
        onHoverIn()
      }
      this.setState((state) => ({ ...state, isHovered: true }))
    }
  }

  onMouseLeave = () => {
    if (this.state.isHovered) {
      const { onHoverOut } = this.props
      if (onHoverOut) {
        onHoverOut()
      }
      this.setState((state) => ({ ...state, isHovered: false }))
    }
  }

  onPressIn = () => {
    if (this.props.onPressDown) {
      this.props.onPressDown()
    }
    this.onGrant()
  }
  onPressOut = () => {
    if (this.props.onPressUp) {
      this.props.onPressUp()
    }
    this.onRelease()
  }

  onGrant = () => {
    this.setState((state) => ({ ...state, showHover: false }))
  }

  onRelease = () => {
    this.setState((state) => ({ ...state, showHover: true }))
  }

  render() {
    const isHovering = this.state.showHover && this.state.isHovered

    const { children } = this.props

    const child = getChild(children, isHovering)

    // @ts-ignore
    return React.cloneElement(React.Children.only(child), {
      onMouseEnter: this.onMouseEnter,
      onMouseLeave: this.onMouseLeave,
      // prevent hover showing while responder
      onResponderGrant: this.onGrant,
      onResponderRelease: this.onRelease,
      // if child is Touchable
      onPressIn: this.onPressIn,
      onPressOut: this.onPressOut,
      onMouseDown: this.onPressIn,
      onMouseUp: this.onPressOut,
      onClick: this.props.onPress,
    })
  }
}

function isFunction(thing: unknown): boolean {
  return typeof thing === 'function'
}

function getChild(children: KidsOrKidsAsFunc, isHovering: boolean) {
  if (isFunction(children)) {
    const kids = children as (isHovering: boolean) => React.ReactNode
    return kids(isHovering)
  } else {
    return children as React.ReactChild
  }
}
