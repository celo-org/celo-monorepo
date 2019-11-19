import fetch from 'cross-fetch'
import * as React from 'react'

interface Props {
  assetType: string
}

export default class ImageryFetcher extends React.Component<Props> {
  componentDidMount = async () => {
    const assets = await fetch(`/brand/api/assets:${this.props.assetType}`)
    console.log(await assets.json())
  }

  render() {
    return null
  }
}
