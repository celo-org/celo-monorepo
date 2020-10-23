import { RawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import * as t from 'io-ts'

export enum ActionTypes {
  StartSession = 'StartSession',
  DeployWallet = 'DeployWallet',
  DistributedBlindedPepper = 'DistributedBlindedPepper',
  SubmitMetaTransaction = 'SubmitMetaTransaction',
  RequestSubsidisedAttestation = 'RequestSubsidisedAttestation',
}

export interface Action<TAction, TPayload, TResp> {
  method: string
  action: TAction
  path: string
  payload: TPayload
  codec: t.Type<TResp>
}

type ActionFactory<TAction, TPayload, TResp> = (
  payload: TPayload
) => Action<TAction, TPayload, TResp>

export const action = <TAction, TPayload, TResp>(
  action: TAction,
  method: string,
  path: string,
  codec: t.Type<TResp>
): ActionFactory<TAction, TPayload, TResp> => (payload) => ({
  method,
  path: path,
  action: action,
  codec,
  payload: {
    ...payload,
  },
})

export interface StartSessionPayload {
  captchaResponseToken: string
  externalAccount: string
  signature: string
}

export const StartSessionResp = t.type({
  token: t.string,
})

export type StartSessionResp = t.TypeOf<typeof StartSessionResp>

export const startSession = action<ActionTypes.StartSession, StartSessionPayload, StartSessionResp>(
  ActionTypes.StartSession,
  'POST',
  'v1/startSession',
  StartSessionResp
)

interface GetDistributedBlindedPepperPayload {
  e164Number: string
  clientVersion: string
}

export const GetDistributedBlindedPepperResp = t.type({
  identifier: t.string,
  pepper: t.string,
})

export type GetDistributedBlindedPepperResp = t.TypeOf<typeof GetDistributedBlindedPepperResp>

export const getDistributedBlindedPepper = action<
  ActionTypes.DistributedBlindedPepper,
  GetDistributedBlindedPepperPayload,
  GetDistributedBlindedPepperResp
>(
  ActionTypes.DistributedBlindedPepper,
  'POST',
  'v1/distributedBlindedPepper',
  GetDistributedBlindedPepperResp
)

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

export interface DeployWalletPayload {
  implementationAddress: string
}

export const deployWallet = action<ActionTypes.DeployWallet, DeployWalletPayload, DeployWalletResp>(
  ActionTypes.DeployWallet,
  'POST',
  'v1/deployWallet',
  DeployWalletResp
)

export const SubmitMetaTransactionResp = t.type({
  txHash: t.string,
})

export type SubmitMetaTransactionResp = t.TypeOf<typeof SubmitMetaTransactionResp>

export const submitMetaTransaction = action<ActionTypes, RawTransaction, SubmitMetaTransactionResp>(
  ActionTypes.SubmitMetaTransaction,
  'POST',
  'v1/submitMetaTransaction',
  SubmitMetaTransactionResp
)

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
>(
  ActionTypes.RequestSubsidisedAttestation,
  'POST',
  'v1/requestSubsidisedAttestations',
  SubmitMetaTransactionResp
)
