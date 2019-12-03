import fetch from 'cross-fetch'
import * as React from 'react'

interface Props {
  query: string
  children: (x: { loading: boolean; data: any; error: boolean }) => React.ReactNode
}

interface State {
  loading: boolean
  hasError: boolean
  data: any[]
}

export default class Fetch extends React.PureComponent<Props, State> {
  state: State = {
    loading: true,
    data: [],
    hasError: false,
  }

  componentDidMount = async () => {
    try {
      const response = await fetch(this.props.query)

      if (response.status === 200) {
        const data = await response.json()
        this.setState({ data, loading: false })
      } else {
        this.setState({ hasError: true, loading: false })
      }
    } catch {
      this.setState({ hasError: true, loading: false })
    }
  }

  render() {
    return this.props.children({
      loading: this.state.loading,
      data: this.state.data,
      error: this.state.hasError,
    })
  }
}
