import * as React from 'react'
import * as ReactDOM from 'react-dom'

export class Portal extends React.Component<{ selector: string }> {
  element: any

  componentDidMount() {
    this.element = document.querySelector(this.props.selector)
    this.forceUpdate()
  }

  render() {
    if (this.element === undefined) {
      return null
    }

    return ReactDOM.createPortal(this.props.children, this.element)
  }
}
