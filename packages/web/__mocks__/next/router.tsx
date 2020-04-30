import * as React from 'react'
export const SingletonRouter = {}

export function withRouter(Component) {
  return function Wrapped(props) {
    return <Component router={{ pathName: '/test/' }} {...props} />
  }
}
