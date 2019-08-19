import * as React from 'react'
import {
  NavigationEventCallback,
  NavigationEventPayload,
  NavigationEvents,
  NavigationInjectedProps,
} from 'react-navigation'
import { connect } from 'react-redux'
import Logger from 'src/utils/Logger'

const TAG = 'navigator/withDispatchAfterNavigate'

export function withDispatchAfterNavigate<P extends {}>(
  WrappedComponent: React.ComponentType<P>
): React.ComponentType<P> {
  type WrappedComponentProps = NavigationInjectedProps &
    P & {
      dispatch: (action: any) => void
    }

  return connect<null, null, any>(null)(
    class WithDispatchAfterNavigateWrapper extends React.Component<WrappedComponentProps> {
      onDidFocus: NavigationEventCallback = (payload: NavigationEventPayload) => {
        if (!payload.state || !payload.state.params) {
          return
        }

        const action = payload.state.params.dispatchAfterNavigate

        if (action && action.type) {
          Logger.debug(TAG, 'Found action to dispatch', action.type)
          this.props.dispatch(action)
        }
      }

      render() {
        return (
          <>
            <NavigationEvents onDidFocus={this.onDidFocus} />
            <WrappedComponent {...this.props} />
          </>
        )
      }
    }
  )
}
