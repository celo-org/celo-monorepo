import * as React from 'react'

interface IProps {
  id: string
  isOpen: boolean
  contentLabel: string
  overlayClassName: string
  className: any
  shouldCloseOnOverlayClick(): void
  onRequestClose(): void
  parentSelector: any
  onAfterOpen(): void
}

export default class MockReactModal extends React.Component<IProps, any> {
  static setAppElement() {}

  render() {
    return <div id={this.props.id}>{this.props.isOpen && this.props.children}</div>
  }
}
