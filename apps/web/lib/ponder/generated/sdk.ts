/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type * as Types from './types';

import { GraphQLClient, type RequestOptions } from 'graphql-request';
import gql from 'graphql-tag';
type GraphQLClientRequestHeaders = RequestOptions['requestHeaders'];
export type AdapterQueryVariables = Exact<{
  id: string;
}>;


export type AdapterQuery = { adapter: { id: string, vault: string, protocolId: string, stratName: string, apyBps: string, allocated: string, paused: boolean, retired: boolean, lastHarvestAt: string | null, lastHarvestGain: string | null, addedAtBlock: string, addedAtTimestamp: string } | null };

export type AdaptersQueryVariables = Exact<{
  where?: Types.AdapterFilter | null | undefined;
  orderBy?: string | null | undefined;
  orderDirection?: string | null | undefined;
  limit?: number | null | undefined;
  after?: string | null | undefined;
  before?: string | null | undefined;
}>;


export type AdaptersQuery = { adapters: { totalCount: number, items: Array<{ id: string, vault: string, protocolId: string, stratName: string, apyBps: string, allocated: string, paused: boolean, retired: boolean, lastHarvestAt: string | null, lastHarvestGain: string | null, addedAtBlock: string, addedAtTimestamp: string }>, pageInfo: { hasNextPage: boolean, hasPreviousPage: boolean, startCursor: string | null, endCursor: string | null } } };

export type AdapterAddedsQueryVariables = Exact<{
  where?: Types.AdapterAddedFilter | null | undefined;
  orderBy?: string | null | undefined;
  orderDirection?: string | null | undefined;
  limit?: number | null | undefined;
  after?: string | null | undefined;
  before?: string | null | undefined;
}>;


export type AdapterAddedsQuery = { adapterAddeds: { totalCount: number, items: Array<{ id: string, vault: string, adapter: string, protocolId: string, blockNumber: string, timestamp: string, txHash: string }>, pageInfo: { hasNextPage: boolean, hasPreviousPage: boolean, startCursor: string | null, endCursor: string | null } } };

export type AdapterRemovedsQueryVariables = Exact<{
  where?: Types.AdapterRemovedFilter | null | undefined;
  orderBy?: string | null | undefined;
  orderDirection?: string | null | undefined;
  limit?: number | null | undefined;
  after?: string | null | undefined;
  before?: string | null | undefined;
}>;


export type AdapterRemovedsQuery = { adapterRemoveds: { totalCount: number, items: Array<{ id: string, vault: string, adapter: string, protocolId: string, withdrawn: string, blockNumber: string, timestamp: string, txHash: string }>, pageInfo: { hasNextPage: boolean, hasPreviousPage: boolean, startCursor: string | null, endCursor: string | null } } };

export type AdapterEvacuatedsQueryVariables = Exact<{
  where?: Types.AdapterEvacuatedFilter | null | undefined;
  orderBy?: string | null | undefined;
  orderDirection?: string | null | undefined;
  limit?: number | null | undefined;
  after?: string | null | undefined;
  before?: string | null | undefined;
}>;


export type AdapterEvacuatedsQuery = { adapterEvacuateds: { totalCount: number, items: Array<{ id: string, vault: string, adapter: string, withdrawn: string, blockNumber: string, timestamp: string, txHash: string }>, pageInfo: { hasNextPage: boolean, hasPreviousPage: boolean, startCursor: string | null, endCursor: string | null } } };

export type AdapterDepositedsQueryVariables = Exact<{
  where?: Types.AdapterDepositedFilter | null | undefined;
  orderBy?: string | null | undefined;
  orderDirection?: string | null | undefined;
  limit?: number | null | undefined;
  after?: string | null | undefined;
  before?: string | null | undefined;
}>;


export type AdapterDepositedsQuery = { adapterDepositeds: { totalCount: number, items: Array<{ id: string, adapter: string, requested: string, supplied: string, blockNumber: string, timestamp: string, txHash: string }>, pageInfo: { hasNextPage: boolean, hasPreviousPage: boolean, startCursor: string | null, endCursor: string | null } } };

export type AdapterWithdrawnsQueryVariables = Exact<{
  where?: Types.AdapterWithdrawnFilter | null | undefined;
  orderBy?: string | null | undefined;
  orderDirection?: string | null | undefined;
  limit?: number | null | undefined;
  after?: string | null | undefined;
  before?: string | null | undefined;
}>;


export type AdapterWithdrawnsQuery = { adapterWithdrawns: { totalCount: number, items: Array<{ id: string, adapter: string, requested: string, received: string, blockNumber: string, timestamp: string, txHash: string }>, pageInfo: { hasNextPage: boolean, hasPreviousPage: boolean, startCursor: string | null, endCursor: string | null } } };

export type AdapterHarvestedsQueryVariables = Exact<{
  where?: Types.AdapterHarvestedFilter | null | undefined;
  orderBy?: string | null | undefined;
  orderDirection?: string | null | undefined;
  limit?: number | null | undefined;
  after?: string | null | undefined;
  before?: string | null | undefined;
}>;


export type AdapterHarvestedsQuery = { adapterHarvesteds: { totalCount: number, items: Array<{ id: string, adapter: string, gain: string, totalAssetsAfter: string, blockNumber: string, timestamp: string, txHash: string }>, pageInfo: { hasNextPage: boolean, hasPreviousPage: boolean, startCursor: string | null, endCursor: string | null } } };

export type AdapterRetiredEventsQueryVariables = Exact<{
  where?: Types.AdapterRetiredEventFilter | null | undefined;
  orderBy?: string | null | undefined;
  orderDirection?: string | null | undefined;
  limit?: number | null | undefined;
  after?: string | null | undefined;
  before?: string | null | undefined;
}>;


export type AdapterRetiredEventsQuery = { adapterRetiredEvents: { totalCount: number, items: Array<{ id: string, adapter: string, withdrawn: string, blockNumber: string, timestamp: string, txHash: string }>, pageInfo: { hasNextPage: boolean, hasPreviousPage: boolean, startCursor: string | null, endCursor: string | null } } };

export type DepositsQueryVariables = Exact<{
  where?: Types.DepositFilter | null | undefined;
  orderBy?: string | null | undefined;
  orderDirection?: string | null | undefined;
  limit?: number | null | undefined;
  after?: string | null | undefined;
  before?: string | null | undefined;
}>;


export type DepositsQuery = { deposits: { totalCount: number, items: Array<{ id: string, vault: string, sender: string, owner: string, assets: string, shares: string, blockNumber: string, timestamp: string, txHash: string }>, pageInfo: { hasNextPage: boolean, hasPreviousPage: boolean, startCursor: string | null, endCursor: string | null } } };

export type WithdrawalsQueryVariables = Exact<{
  where?: Types.WithdrawalFilter | null | undefined;
  orderBy?: string | null | undefined;
  orderDirection?: string | null | undefined;
  limit?: number | null | undefined;
  after?: string | null | undefined;
  before?: string | null | undefined;
}>;


export type WithdrawalsQuery = { withdrawals: { totalCount: number, items: Array<{ id: string, vault: string, sender: string, receiver: string, owner: string, assets: string, shares: string, blockNumber: string, timestamp: string, txHash: string }>, pageInfo: { hasNextPage: boolean, hasPreviousPage: boolean, startCursor: string | null, endCursor: string | null } } };

export type ProtocolRegisteredsQueryVariables = Exact<{
  where?: Types.ProtocolRegisteredFilter | null | undefined;
  orderBy?: string | null | undefined;
  orderDirection?: string | null | undefined;
  limit?: number | null | undefined;
  after?: string | null | undefined;
  before?: string | null | undefined;
}>;


export type ProtocolRegisteredsQuery = { protocolRegistereds: { totalCount: number, items: Array<{ id: string, protocolId: string, initialScore: number, blockNumber: string, timestamp: string, txHash: string }>, pageInfo: { hasNextPage: boolean, hasPreviousPage: boolean, startCursor: string | null, endCursor: string | null } } };

export type ScoreUpdatedsQueryVariables = Exact<{
  where?: Types.ScoreUpdatedFilter | null | undefined;
  orderBy?: string | null | undefined;
  orderDirection?: string | null | undefined;
  limit?: number | null | undefined;
  after?: string | null | undefined;
  before?: string | null | undefined;
}>;


export type ScoreUpdatedsQuery = { scoreUpdateds: { totalCount: number, items: Array<{ id: string, protocolId: string, oldScore: number, newScore: number, blockNumber: string, timestamp: string, txHash: string }>, pageInfo: { hasNextPage: boolean, hasPreviousPage: boolean, startCursor: string | null, endCursor: string | null } } };

export type EmergencyZeroedsQueryVariables = Exact<{
  where?: Types.EmergencyZeroedFilter | null | undefined;
  orderBy?: string | null | undefined;
  orderDirection?: string | null | undefined;
  limit?: number | null | undefined;
  after?: string | null | undefined;
  before?: string | null | undefined;
}>;


export type EmergencyZeroedsQuery = { emergencyZeroeds: { totalCount: number, items: Array<{ id: string, protocolId: string, previousScore: number, blockNumber: string, timestamp: string, txHash: string }>, pageInfo: { hasNextPage: boolean, hasPreviousPage: boolean, startCursor: string | null, endCursor: string | null } } };

export type RebalancesQueryVariables = Exact<{
  where?: Types.RebalanceFilter | null | undefined;
  orderBy?: string | null | undefined;
  orderDirection?: string | null | undefined;
  limit?: number | null | undefined;
  after?: string | null | undefined;
  before?: string | null | undefined;
}>;


export type RebalancesQuery = { rebalances: { totalCount: number, items: Array<{ id: string, vault: string, totalPool: string, blockNumber: string, timestamp: string, txHash: string }>, pageInfo: { hasNextPage: boolean, hasPreviousPage: boolean, startCursor: string | null, endCursor: string | null } } };

export type VaultQueryVariables = Exact<{
  id: string;
}>;


export type VaultQuery = { vault: { id: string, asset: string, oracle: string, kind: number, vaultName: string, vaultSymbol: string, assetName: string, assetSymbol: string, assetDecimals: number, createdAtBlock: string, createdAtTimestamp: string, txHash: string } | null };

export type VaultsQueryVariables = Exact<{
  where?: Types.VaultFilter | null | undefined;
  orderBy?: string | null | undefined;
  orderDirection?: string | null | undefined;
  limit?: number | null | undefined;
  after?: string | null | undefined;
  before?: string | null | undefined;
}>;


export type VaultsQuery = { vaults: { totalCount: number, items: Array<{ id: string, asset: string, oracle: string, kind: number, vaultName: string, vaultSymbol: string, assetName: string, assetSymbol: string, assetDecimals: number, createdAtBlock: string, createdAtTimestamp: string, txHash: string }>, pageInfo: { hasNextPage: boolean, hasPreviousPage: boolean, startCursor: string | null, endCursor: string | null } } };


export const AdapterDocument = gql`
    query Adapter($id: String!) {
  adapter(id: $id) {
    id
    vault
    protocolId
    stratName
    apyBps
    allocated
    paused
    retired
    lastHarvestAt
    lastHarvestGain
    addedAtBlock
    addedAtTimestamp
  }
}
    `;
export const AdaptersDocument = gql`
    query Adapters($where: adapterFilter, $orderBy: String, $orderDirection: String, $limit: Int, $after: String, $before: String) {
  adapters(
    where: $where
    orderBy: $orderBy
    orderDirection: $orderDirection
    limit: $limit
    after: $after
    before: $before
  ) {
    items {
      id
      vault
      protocolId
      stratName
      apyBps
      allocated
      paused
      retired
      lastHarvestAt
      lastHarvestGain
      addedAtBlock
      addedAtTimestamp
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
    `;
export const AdapterAddedsDocument = gql`
    query AdapterAddeds($where: adapterAddedFilter, $orderBy: String, $orderDirection: String, $limit: Int, $after: String, $before: String) {
  adapterAddeds(
    where: $where
    orderBy: $orderBy
    orderDirection: $orderDirection
    limit: $limit
    after: $after
    before: $before
  ) {
    items {
      id
      vault
      adapter
      protocolId
      blockNumber
      timestamp
      txHash
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
    `;
export const AdapterRemovedsDocument = gql`
    query AdapterRemoveds($where: adapterRemovedFilter, $orderBy: String, $orderDirection: String, $limit: Int, $after: String, $before: String) {
  adapterRemoveds(
    where: $where
    orderBy: $orderBy
    orderDirection: $orderDirection
    limit: $limit
    after: $after
    before: $before
  ) {
    items {
      id
      vault
      adapter
      protocolId
      withdrawn
      blockNumber
      timestamp
      txHash
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
    `;
export const AdapterEvacuatedsDocument = gql`
    query AdapterEvacuateds($where: adapterEvacuatedFilter, $orderBy: String, $orderDirection: String, $limit: Int, $after: String, $before: String) {
  adapterEvacuateds(
    where: $where
    orderBy: $orderBy
    orderDirection: $orderDirection
    limit: $limit
    after: $after
    before: $before
  ) {
    items {
      id
      vault
      adapter
      withdrawn
      blockNumber
      timestamp
      txHash
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
    `;
export const AdapterDepositedsDocument = gql`
    query AdapterDepositeds($where: adapterDepositedFilter, $orderBy: String, $orderDirection: String, $limit: Int, $after: String, $before: String) {
  adapterDepositeds(
    where: $where
    orderBy: $orderBy
    orderDirection: $orderDirection
    limit: $limit
    after: $after
    before: $before
  ) {
    items {
      id
      adapter
      requested
      supplied
      blockNumber
      timestamp
      txHash
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
    `;
export const AdapterWithdrawnsDocument = gql`
    query AdapterWithdrawns($where: adapterWithdrawnFilter, $orderBy: String, $orderDirection: String, $limit: Int, $after: String, $before: String) {
  adapterWithdrawns(
    where: $where
    orderBy: $orderBy
    orderDirection: $orderDirection
    limit: $limit
    after: $after
    before: $before
  ) {
    items {
      id
      adapter
      requested
      received
      blockNumber
      timestamp
      txHash
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
    `;
export const AdapterHarvestedsDocument = gql`
    query AdapterHarvesteds($where: adapterHarvestedFilter, $orderBy: String, $orderDirection: String, $limit: Int, $after: String, $before: String) {
  adapterHarvesteds(
    where: $where
    orderBy: $orderBy
    orderDirection: $orderDirection
    limit: $limit
    after: $after
    before: $before
  ) {
    items {
      id
      adapter
      gain
      totalAssetsAfter
      blockNumber
      timestamp
      txHash
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
    `;
export const AdapterRetiredEventsDocument = gql`
    query AdapterRetiredEvents($where: adapterRetiredEventFilter, $orderBy: String, $orderDirection: String, $limit: Int, $after: String, $before: String) {
  adapterRetiredEvents(
    where: $where
    orderBy: $orderBy
    orderDirection: $orderDirection
    limit: $limit
    after: $after
    before: $before
  ) {
    items {
      id
      adapter
      withdrawn
      blockNumber
      timestamp
      txHash
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
    `;
export const DepositsDocument = gql`
    query Deposits($where: depositFilter, $orderBy: String, $orderDirection: String, $limit: Int, $after: String, $before: String) {
  deposits(
    where: $where
    orderBy: $orderBy
    orderDirection: $orderDirection
    limit: $limit
    after: $after
    before: $before
  ) {
    items {
      id
      vault
      sender
      owner
      assets
      shares
      blockNumber
      timestamp
      txHash
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
    `;
export const WithdrawalsDocument = gql`
    query Withdrawals($where: withdrawalFilter, $orderBy: String, $orderDirection: String, $limit: Int, $after: String, $before: String) {
  withdrawals(
    where: $where
    orderBy: $orderBy
    orderDirection: $orderDirection
    limit: $limit
    after: $after
    before: $before
  ) {
    items {
      id
      vault
      sender
      receiver
      owner
      assets
      shares
      blockNumber
      timestamp
      txHash
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
    `;
export const ProtocolRegisteredsDocument = gql`
    query ProtocolRegistereds($where: protocolRegisteredFilter, $orderBy: String, $orderDirection: String, $limit: Int, $after: String, $before: String) {
  protocolRegistereds(
    where: $where
    orderBy: $orderBy
    orderDirection: $orderDirection
    limit: $limit
    after: $after
    before: $before
  ) {
    items {
      id
      protocolId
      initialScore
      blockNumber
      timestamp
      txHash
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
    `;
export const ScoreUpdatedsDocument = gql`
    query ScoreUpdateds($where: scoreUpdatedFilter, $orderBy: String, $orderDirection: String, $limit: Int, $after: String, $before: String) {
  scoreUpdateds(
    where: $where
    orderBy: $orderBy
    orderDirection: $orderDirection
    limit: $limit
    after: $after
    before: $before
  ) {
    items {
      id
      protocolId
      oldScore
      newScore
      blockNumber
      timestamp
      txHash
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
    `;
export const EmergencyZeroedsDocument = gql`
    query EmergencyZeroeds($where: emergencyZeroedFilter, $orderBy: String, $orderDirection: String, $limit: Int, $after: String, $before: String) {
  emergencyZeroeds(
    where: $where
    orderBy: $orderBy
    orderDirection: $orderDirection
    limit: $limit
    after: $after
    before: $before
  ) {
    items {
      id
      protocolId
      previousScore
      blockNumber
      timestamp
      txHash
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
    `;
export const RebalancesDocument = gql`
    query Rebalances($where: rebalanceFilter, $orderBy: String, $orderDirection: String, $limit: Int, $after: String, $before: String) {
  rebalances(
    where: $where
    orderBy: $orderBy
    orderDirection: $orderDirection
    limit: $limit
    after: $after
    before: $before
  ) {
    items {
      id
      vault
      totalPool
      blockNumber
      timestamp
      txHash
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
    `;
export const VaultDocument = gql`
    query Vault($id: String!) {
  vault(id: $id) {
    id
    asset
    oracle
    kind
    vaultName
    vaultSymbol
    assetName
    assetSymbol
    assetDecimals
    createdAtBlock
    createdAtTimestamp
    txHash
  }
}
    `;
export const VaultsDocument = gql`
    query Vaults($where: vaultFilter, $orderBy: String, $orderDirection: String, $limit: Int, $after: String, $before: String) {
  vaults(
    where: $where
    orderBy: $orderBy
    orderDirection: $orderDirection
    limit: $limit
    after: $after
    before: $before
  ) {
    items {
      id
      asset
      oracle
      kind
      vaultName
      vaultSymbol
      assetName
      assetSymbol
      assetDecimals
      createdAtBlock
      createdAtTimestamp
      txHash
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string, variables?: any) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType, _variables) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    Adapter(variables: AdapterQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<AdapterQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<AdapterQuery>({ document: AdapterDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Adapter', 'query', variables);
    },
    Adapters(variables?: AdaptersQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<AdaptersQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<AdaptersQuery>({ document: AdaptersDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Adapters', 'query', variables);
    },
    AdapterAddeds(variables?: AdapterAddedsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<AdapterAddedsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<AdapterAddedsQuery>({ document: AdapterAddedsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'AdapterAddeds', 'query', variables);
    },
    AdapterRemoveds(variables?: AdapterRemovedsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<AdapterRemovedsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<AdapterRemovedsQuery>({ document: AdapterRemovedsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'AdapterRemoveds', 'query', variables);
    },
    AdapterEvacuateds(variables?: AdapterEvacuatedsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<AdapterEvacuatedsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<AdapterEvacuatedsQuery>({ document: AdapterEvacuatedsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'AdapterEvacuateds', 'query', variables);
    },
    AdapterDepositeds(variables?: AdapterDepositedsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<AdapterDepositedsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<AdapterDepositedsQuery>({ document: AdapterDepositedsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'AdapterDepositeds', 'query', variables);
    },
    AdapterWithdrawns(variables?: AdapterWithdrawnsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<AdapterWithdrawnsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<AdapterWithdrawnsQuery>({ document: AdapterWithdrawnsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'AdapterWithdrawns', 'query', variables);
    },
    AdapterHarvesteds(variables?: AdapterHarvestedsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<AdapterHarvestedsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<AdapterHarvestedsQuery>({ document: AdapterHarvestedsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'AdapterHarvesteds', 'query', variables);
    },
    AdapterRetiredEvents(variables?: AdapterRetiredEventsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<AdapterRetiredEventsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<AdapterRetiredEventsQuery>({ document: AdapterRetiredEventsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'AdapterRetiredEvents', 'query', variables);
    },
    Deposits(variables?: DepositsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<DepositsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<DepositsQuery>({ document: DepositsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Deposits', 'query', variables);
    },
    Withdrawals(variables?: WithdrawalsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<WithdrawalsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<WithdrawalsQuery>({ document: WithdrawalsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Withdrawals', 'query', variables);
    },
    ProtocolRegistereds(variables?: ProtocolRegisteredsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<ProtocolRegisteredsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ProtocolRegisteredsQuery>({ document: ProtocolRegisteredsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'ProtocolRegistereds', 'query', variables);
    },
    ScoreUpdateds(variables?: ScoreUpdatedsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<ScoreUpdatedsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ScoreUpdatedsQuery>({ document: ScoreUpdatedsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'ScoreUpdateds', 'query', variables);
    },
    EmergencyZeroeds(variables?: EmergencyZeroedsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<EmergencyZeroedsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<EmergencyZeroedsQuery>({ document: EmergencyZeroedsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'EmergencyZeroeds', 'query', variables);
    },
    Rebalances(variables?: RebalancesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<RebalancesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<RebalancesQuery>({ document: RebalancesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Rebalances', 'query', variables);
    },
    Vault(variables: VaultQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<VaultQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<VaultQuery>({ document: VaultDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Vault', 'query', variables);
    },
    Vaults(variables?: VaultsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<VaultsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<VaultsQuery>({ document: VaultsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'Vaults', 'query', variables);
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;