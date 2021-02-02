import firebase from '@react-native-firebase/app'

interface ContentType {
  [lang: string]: any
}

interface Tier {
  minBalance: number
  reward: number
}

export interface ConsumerIncentivesData {
  content: ContentType
  tiers: Tier[]
}

export const fetchConsumerRewardsContent = () =>
  firebase
    .database()
    .ref('consumerIncentives')
    .once('value')
    .then((snapshot) => snapshot.val())
