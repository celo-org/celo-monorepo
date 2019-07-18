// @ts-ignore - `import * as` and `import {}` don't work for hoist-non-react-statics
const hoistNonReactStatics = require('hoist-non-react-statics')
import CeloAnalyticsType from '@celo/react-components/analytics/CeloAnalytics'
import { DefaultEventNames } from '@celo/react-components/analytics/constants'
import ReactNativeLogger from '@celo/react-components/services/ReactNativeLogger'
import * as React from 'react'

function getDisplayName<P extends {}>(WrappedComponent: React.ComponentType<P>) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component'
}

interface ForwardedRef {
  forwardedRef?: React.Ref<React.ReactElement<any>>
}

export default function Initializer(CeloAnalytics: CeloAnalyticsType, Logger: ReactNativeLogger) {
  // Wrapper type: https://medium.com/@jrwebdev/react-higher-order-component-patterns-in-typescript-42278f7590fb
  // Component name: https://reactjs.org/docs/forwarding-refs.html

  function componentWithAnalytics<P extends {}>(
    WrappedComponent: React.ComponentType<P>
  ): React.ComponentClass<P> {
    const displayName = getDisplayName(WrappedComponent)

    class ComponentWithAnalytics extends React.Component<P & ForwardedRef> {
      timestamp: number | undefined

      render() {
        return <WrappedComponent {...this.props} ref={this.props.forwardedRef} />
      }

      trackEvent(event: any, props: any, attachDeviceInfo = false) {
        try {
          CeloAnalytics.track(event, props, attachDeviceInfo)
        } catch {
          Logger.error('analytics/wrapper/trackEvent', `${event} tracking failed`)
        }
      }

      componentDidMount() {
        this.timestamp = Date.now()
        this.trackEvent(DefaultEventNames.componentMount, {
          component: displayName,
          ...Object(this.props),
        })
      }

      componentWillUnmount() {
        this.trackEvent(DefaultEventNames.componentUnmount, {
          ...Object(this.props),
          component: displayName,
          timeElapsed: Date.now() - (this.timestamp || Date.now()),
        })
      }
    }

    function forwardRef(props: {}, ref?: React.Ref<React.ReactElement<any>>) {
      return <ComponentWithAnalytics {...props as P} forwardedRef={ref} />
    }

    forwardRef.displayName = `WithAnalytics(${displayName})`

    return hoistNonReactStatics(React.forwardRef(forwardRef), WrappedComponent)
  }
  return componentWithAnalytics
}
