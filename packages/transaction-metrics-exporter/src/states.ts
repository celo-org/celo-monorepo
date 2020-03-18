/* tslint:disable:ban-types */

import { ContractKit, CeloContract } from '@celo/contractkit'

type PromiseValue<T> = T extends PromiseLike<infer U> ? U : T
type ContractWrapperType<C extends any> = PromiseValue<ReturnType<ContractKit['contracts'][C]>>
type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any ? A : never
type ReturnMethodType<F extends Function> = F extends (...args: any) => infer A ? A : never

export interface Contracts {
  Exchange: ContractWrapperType<'getExchange'>
  SortedOracles: ContractWrapperType<'getSortedOracles'>
  Reserve: ContractWrapperType<'getReserve'>
  GoldToken: ContractWrapperType<'getGoldToken'>
  EpochRewards: ContractWrapperType<'getEpochRewards'>
}

export interface StateGetter {
  contract: string
  method: string
  params: any[]
  transformValues: Function
}

export function getter<T extends keyof Contracts, M extends keyof Contracts[T] & string>(
  contract: T,
  method: M,
  transformValues: (
    state: PromiseValue<ReturnMethodType<Contracts[T][M] & Function>>
  ) => { [key: string]: any },
  params: ArgumentTypes<Contracts[T][M] & Function> = [] as any
): StateGetter {
  return { contract, method, params, transformValues }
}

export const stateGetters: StateGetter[] = [
  getter(
    'Exchange',
    'getBuyAndSellBuckets',
    ([currentStableBucket, currentGoldBucket]) => ({ currentStableBucket, currentGoldBucket }),
    [true]
  ),
  getter('SortedOracles', 'medianRate', ({ rate }) => ({ medianRate: +rate }), [
    CeloContract.StableToken,
  ]),
  // getter(
  //   'Reserve',
  //   'getReserveGoldBalance',
  //   (goldBalance) => ({goldBalance: +goldBalance}),
  // ),
  getter('GoldToken', 'totalSupply', (goldTokenTotalSupply) => ({
    goldTokenTotalSupply: +goldTokenTotalSupply,
  })),
  getter('EpochRewards', 'getTargetGoldTotalSupply', (rewardsAmount) => ({
    rewardsAmount: +rewardsAmount,
  })),
  getter('EpochRewards', 'getRewardsMultiplier', (rewardsMultiplier) => ({
    rewardsMultiplier: +rewardsMultiplier,
  })),
]
