import * as React from 'react'
import {
  EmitterSubscription,
  findNodeHandle,
  Keyboard,
  Platform,
  ScrollView,
  ScrollViewProps,
  TextInput,
  UIManager,
} from 'react-native'

type ComponentOrHandle = null | number | React.Component<any, any> | React.ComponentClass<any>

interface Props extends ScrollViewProps {
  hasNavBar?: boolean
}

// Keeps the focused input into view when the keyboard is shown
export default class KeyboardAwareScrollView extends React.Component<Props> {
  scrollViewRef = React.createRef<ScrollView>()
  showListener: EmitterSubscription | undefined

  componentDidMount() {
    const showListener = Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow'
    this.showListener = Keyboard.addListener(showListener, () => {
      // Wait for next frame so that the layout is updated first if there's a KeyboardSpacer
      // in the hierarchy, otherwise the scroll into view has no effect
      requestAnimationFrame(() => {
        const currentlyFocusedField = TextInput.State.currentlyFocusedInput()
        this.scrollInputIntoView(currentlyFocusedField, this.scrollViewRef.current)
      })
    })
  }

  componentWillUnmount() {
    if (this.showListener) {
      this.showListener.remove()
    }
  }

  getScrollRef() {
    return this.scrollViewRef.current
  }

  focusInputOrDismissKeyboard(inputRef: React.RefObject<TextInput>) {
    const input = inputRef.current
    if (input) {
      this.focusInputAndScrollIntoView(input, this.scrollViewRef.current)
    } else {
      Keyboard.dismiss()
    }
  }

  focusInputAndScrollIntoView(input: TextInput, scrollView: ScrollView | null) {
    input.focus()

    this.scrollInputIntoView(input, scrollView)
  }

  scrollInputIntoView(
    input: ComponentOrHandle,
    scrollView: ScrollView | null,
    customKeyboardHeight: number = 0
  ) {
    const inputHandle = findNodeHandle(input)
    const { hasNavBar } = this.props
    if (!inputHandle || !scrollView) {
      return
    }

    const innerViewNode = scrollView.getInnerViewNode()
    if (!innerViewNode) {
      return
    }

    // When multiple screens are in a stack navigator we need to be sure
    // the provided input is a child of the scrollview
    // otherwise we get an exception
    // @ts-ignore, react-native type defs are missing this one!
    UIManager.viewIsDescendantOf(inputHandle, innerViewNode, (isAncestor: boolean) => {
      if (isAncestor && scrollView) {
        scrollView.scrollResponderScrollNativeHandleToKeyboard(
          inputHandle,
          hasNavBar ? customKeyboardHeight + 0 : customKeyboardHeight + 120,
          true
        )
      }
    })
  }

  render() {
    const { hasNavBar, ...other } = this.props

    return <ScrollView ref={this.scrollViewRef} keyboardShouldPersistTaps="handled" {...other} />
  }
}
