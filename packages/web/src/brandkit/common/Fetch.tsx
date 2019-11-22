import fetch from 'cross-fetch'
import * as React from 'react'

interface Props {
  query: string
  children: (x: { loading: boolean; data: any }) => React.ReactNode
}

interface State {
  loading: boolean
  data: any[]
}

export default class Fetch extends React.PureComponent<Props, State> {
  state: State = {
    loading: true,
    data: [],
  }

  componentDidMount = async () => {
    const response = await fetch(this.props.query)
    const data = await response.json()
    console.log(data)
    this.setState({ data, loading: false })
  }

  render() {
    return this.props.children({ loading: this.state.loading, data: this.state.data })
  }
}
