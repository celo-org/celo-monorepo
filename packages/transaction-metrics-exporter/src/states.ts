/* tslint:disable:ban-types */

import { CeloContract, ContractKit } from '@celo/contractkit'

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
  StableToken: ContractWrapperType<'getStableToken'>
}

export interface StateGetter {
  contract: keyof Contracts
  method: string
  args: any[]
  transformValues: Function
  maxBucketSize: { [key: string]: number }
}

export function getter<
  T extends keyof Contracts,
  M extends keyof Contracts[T] & string,
  RV extends string
>(
  contract: T,
  method: M,
  transformValues: (
    state: PromiseValue<ReturnMethodType<Contracts[T][M] & Function>>
  ) => { [key in RV]: any },
  args: ArgumentTypes<Contracts[T][M] & Function> = [] as any,
  maxBucketSize: { [key in RV]: any } = {} as any
): StateGetter {
  return { contract, method, args, transformValues, maxBucketSize }
}

export const stateGetters: StateGetter[] = [
    getter(
      'Exchange',
      'getBuyAndSellBuckets',
      ([currentStableBucket, currentGoldBucket]) => ({
        currentStableBucket: +currentStableBucket,
        currentGoldBucket: +currentGoldBucket,
      }),
      [true],
      { currentStableBucket: 10 ** 26, currentGoldBucket: 10 ** 26 }
    ),
    getter('SortedOracles', 'medianRate', ({ rate }) => ({ medianRate: +rate }), [
      CeloContract.StableToken,
    ]),
    getter('Reserve', 'getReserveGoldBalance', (goldBalance) => ({ goldBalance: +goldBalance })),
    getter('Exchange', 'reserveFraction', (reserveFraction) => ({
      reserveFraction: +reserveFraction,
    })),
    getter(
      'GoldToken',
      'totalSupply',
      (goldTokenTotalSupply) => ({
        goldTokenTotalSupply: +goldTokenTotalSupply,
      }),
      undefined,
      { goldTokenTotalSupply: 10 ** 27 }
    ),
    getter('EpochRewards', 'getTargetGoldTotalSupply', (rewardsAmount) => ({
      rewardsAmount: +rewardsAmount,
    })),
    getter('EpochRewards', 'getRewardsMultiplier', (rewardsMultiplier) => ({
      rewardsMultiplier: +rewardsMultiplier,
    })),
  ]

  // Include getters for accounts
;(process.env.WATCH_ADDRESS || '')
  .split(/,\s?/)
  .filter((address) => address.match(/^0x[a-f0-9]{40}$/i))
  .forEach((address) => {
    stateGetters.push(
      getter(
        'GoldToken',
        'balanceOf',
        (balance) => ({
          balance: +balance,
        }),
        [address]
      )
    )
    stateGetters.push(
      getter(
        'StableToken',
        'balanceOf',
        (balance) => ({
          balance: +balance,
        }),
        [address]
      )
    )
  })
