// @ts-ignore - `import * as` and `import {}` don't work for hoist-non-react-statics
const hoistNonReactStatics = require('hoist-non-react-statics')
import CeloAnalyticsType from '@celo/react-components/analytics/CeloAnalytics'
import { DefaultEventNames } from '@celo/react-components/analytics/constants'
import ReactNativeLogger from '@celo/react-components/services/ReactNativeLogger'
import * as React from 'react'
// tslint:disable-next-line
import { Component, ComponentType, forwardRef, Ref } from 'react'

function getDisplayName<P extends {}>(WrappedComponent: React.ComponentType<P>) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component'
}

export default function Initializer(CeloAnalytics: CeloAnalyticsType, Logger: ReactNativeLogger) {
  // Wrapper type: https://gist.github.com/OliverJAsh/d2f462b03b3e6c24f5588ca7915d010e
  // Component name: https://reactjs.org/docs/forwarding-refs.html

  function componentWithAnalytics<ComposedComponentProps extends {}>(
    ComposedComponent: ComponentType<ComposedComponentProps>
  ) {
    const displayName = getDisplayName(ComposedComponent)
    // @ts-ignore
    type ComposedComponentInstance = InstanceType<typeof ComposedComponent>
    type WrapperComponentProps = ComposedComponentProps & {
      wrapperComponentProp: number
    }
    type WrapperComponentPropsWithForwardedRef = WrapperComponentProps & {
      forwardedRef: Ref<ComposedComponentInstance>
    }

    class WrapperComponent extends Component<WrapperComponentPropsWithForwardedRef, {}> {
      timestamp: number | undefined

      render() {
        const { forwardedRef, wrapperComponentProp, ...composedComponentProps } = this.props

        return (
          <ComposedComponent
            ref={forwardedRef}
            // We need a cast because:
            // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/32355
            // https://github.com/Microsoft/TypeScript/issues/28938#issuecomment-450636046
            {...(composedComponentProps as ComposedComponentProps)}
          />
        )
      }

      trackEvent(event: any, props: any, attachDeviceInfo = false) {
        if (!CeloAnalytics) {
          return
        }

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

    function forward(props: WrapperComponentProps, ref: Ref<ComposedComponentInstance>) {
      return <WrapperComponent forwardedRef={ref} {...props} />
    }

    forward.displayName = `WithAnalytics(${displayName})`

    return hoistNonReactStatics(
      forwardRef<ComposedComponentInstance, WrapperComponentProps>(forward),
      ComposedComponent
    )
  }
  return componentWithAnalytics
}
