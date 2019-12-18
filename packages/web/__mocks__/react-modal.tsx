import * as React from 'react'

interface Props {
  id: string
  isOpen: boolean
  contentLabel: string
  overlayClassName: string
  className: any
  parentSelector: any
  shouldCloseOnOverlayClick(): void
  onRequestClose(): void
  onAfterOpen(): void
}

export default class MockReactModal extends React.Component<Props, any> {
  static setAppElement() {
    return null
  }

  render() {
    return <div id={this.props.id}>{this.props.isOpen && this.props.children}</div>
  }
}
