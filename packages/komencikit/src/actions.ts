import { RawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import * as t from 'io-ts'

export interface Action<TAction, TPayload, TResp> {
  method: string
  action: TAction
  payload: TPayload
  codec: t.Type<TResp>
}

type ActionFactory<TAction, TPayload, TResp> = (
  payload: TPayload
) => Action<TAction, TPayload, TResp>

export const action = <TAction, TPayload, TResp>(
  method: string,
  _action: TAction,
  codec: t.Type<TResp>
): ActionFactory<TAction, TPayload, t.TypeOf<typeof codec>> => (payload) => ({
  method,
  action: _action,
  codec,
  payload: {
    ...payload,
  },
})

export enum ActionTypes {
  StartSession = 'startSession',
  DeployWallet = 'deployWallet',
  DistributedBlindedPepper = 'distributedBlindedPepper',
  SubmitMetaTransaction = 'submitMetaTransaction',
  RequestSubsidisedAttestation = 'requestSubsidisedAttestation',
}

export interface StartSessionPayload {
  captchaResponseToken: string
  deviceType: 'ios' | 'android'
  iosDeviceToken?: string
  androidSignedAttestation?: string
  externalAccount: string
  signature: string
}

export const StartSessionResp = t.type({
  token: t.string,
})

export type StartSessionResp = t.TypeOf<typeof StartSessionResp>

export const startSession = action<ActionTypes.StartSession, StartSessionPayload, StartSessionResp>(
  'POST',
  ActionTypes.StartSession,
  StartSessionResp
)

interface GetDistributedBlindedPepperPayload {
  e164Number: string
  clientVersion: string
}

export const GetDistributedBlindedPepperResp = t.type({
  identifier: t.string,
})

export type GetDistributedBlindedPepperResp = t.TypeOf<typeof GetDistributedBlindedPepperResp>

export const getDistributedBlindedPepper = action<
  ActionTypes.DistributedBlindedPepper,
  GetDistributedBlindedPepperPayload,
  GetDistributedBlindedPepperResp
>('POST', ActionTypes.DistributedBlindedPepper, GetDistributedBlindedPepperResp)

// export interface DeployWalletPayload {}

export const DeployWalletDeployed = t.type({
  status: t.literal('deployed'),
  walletAddress: t.string,
})

export type DeployWalletDeployed = t.TypeOf<typeof DeployWalletDeployed>

export const DeployWalletInProgress = t.type({
  status: t.literal('in-progress'),
  txHash: t.string,
  deployerAddress: t.string,
})

export type DeployWalletInProgress = t.TypeOf<typeof DeployWalletInProgress>

export const DeployWalletResp = t.union([DeployWalletDeployed, DeployWalletInProgress])
export type DeployWalletResp = t.TypeOf<typeof DeployWalletResp>

const _deployWallet = action<ActionTypes.DeployWallet, {}, DeployWalletResp>(
  'POST',
  ActionTypes.DeployWallet,
  DeployWalletResp
)

export const deployWallet = () => _deployWallet({})

export const SubmitMetaTransactionResp = t.type({
  txHash: t.string,
})

export type SubmitMetaTransactionResp = t.TypeOf<typeof SubmitMetaTransactionResp>

export const submitMetaTransaction = action<
  ActionTypes.SubmitMetaTransaction,
  RawTransaction,
  SubmitMetaTransactionResp
>('POST', ActionTypes.SubmitMetaTransaction, SubmitMetaTransactionResp)

export interface RequestSubsidisedAttestationsPayload {
  identifier: string
  attestationsRequested: number
  walletAddress: string
  transactions: {
    approve: RawTransaction
    request: RawTransaction
  }
}

export const requestSubsidisedAttestations = action<
  ActionTypes.RequestSubsidisedAttestation,
  RequestSubsidisedAttestationsPayload,
  SubmitMetaTransactionResp
>('POST', ActionTypes.RequestSubsidisedAttestation, SubmitMetaTransactionResp)
