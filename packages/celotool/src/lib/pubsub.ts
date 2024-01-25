import PubSub from '@google-cloud/pubsub'

export const createClient = (credentials?: any) => {
  // @ts-ignore-next-line
  return new PubSub.v1.SubscriberClient({ credentials })
}

export const buildSubscriptionName = (envName: string, purpose: string) => {
  return `${envName}-${purpose}`
}

export const createSubscription = async (
  client: any,
  projectID: string,
  topic: string,
  subscriptionName: string
) => {
  const formattedName = client.subscriptionPath(projectID, subscriptionName)
  const formattedTopic = client.topicPath(projectID, topic)

  const request = {
    name: formattedName,
    topic: formattedTopic,
  }
  const [subscriptionInfo] = await client.createSubscription(request)

  return subscriptionInfo
}

export const deleteSubscription = async (
  client: any,
  projectID: string,
  subscriptionName: string
) => {
  const formattedName = client.subscriptionPath(projectID, subscriptionName)

  await client.deleteSubscription({ subscription: formattedName })

  return true
}

export const createStreamingPull = (
  client: any,
  projectID: string,
  subscriptionName: string,
  // eslint-disable-next-line: ban-types
  handler: Function
) => {
  const stream = client.streamingPull().on('data', handler)
  const formattedName = client.subscriptionPath(projectID, subscriptionName)
  const request = {
    subscription: formattedName,
    streamAckDeadlineSeconds: 10,
  }
  stream.write(request)
}
