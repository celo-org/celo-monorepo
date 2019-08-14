import * as React from 'react'
import { NavigationFocusInjectedProps, withNavigationFocus } from 'react-navigation'

export function withDispatchAfterNavigate<P extends {}>(
  ownProps: any,
  WrappedComponent: React.ComponentType<P>
): React.ComponentType<P> {
  type WrappedComponentProps = NavigationFocusInjectedProps & P
  return withNavigationFocus<P>(
    class WithDispatchAfterNavigateWrapper extends React.Component<WrappedComponentProps> {
      componentDidUpdate(prevProps: WrappedComponentProps) {
        if (prevProps.isFocused !== this.props.isFocused) {
          // console.log('ITS FOCUSED!')
        }
      }

      render() {
        return <WrappedComponent {...this.props} />
      }
    }
  )
}
