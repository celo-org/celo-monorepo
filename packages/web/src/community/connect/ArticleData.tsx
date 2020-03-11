import fetch from 'cross-fetch'
import * as React from 'react'
import ArticlesSection from 'src/community/connect/ArticlesSection'

async function getArticles() {
  const res = await fetch('/proxy/medium', {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'GET',
  })
  return res.json()
}

interface Props {
  title: string
}

export default class ArticleData extends React.PureComponent<Props> {
  state = { articles: [], loaded: false }

  componentDidMount = async () => {
    const { articles } = await getArticles()
    this.setState({ articles, loaded: true })
  }

  render() {
    const { articles, loaded } = this.state
    return <ArticlesSection title={this.props.title} articles={articles} loading={!loaded} />
  }
}
