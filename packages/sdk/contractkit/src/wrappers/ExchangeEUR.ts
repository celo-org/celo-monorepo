import { BaseExchangeWrapper } from './BaseExchange'
import { ExchangeEur } from '../generated/ExchangeEUR'

/**
 * Contract that allows to exchange StableToken (cEUR) for GoldToken and vice versa
 * using a Constant Product Market Maker Model
 */
export class ExchangeWrapperEUR extends BaseExchangeWrapper<ExchangeEur> {}
