export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  BigInt: { input: string; output: string; }
  JSON: { input: unknown; output: unknown; }
};

export type Meta = {
  __typename?: 'Meta';
  status?: Maybe<Scalars['JSON']['output']>;
};

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
};

export type Query = {
  __typename?: 'Query';
  _meta?: Maybe<Meta>;
  adapter?: Maybe<Adapter>;
  adapterAdded?: Maybe<AdapterAdded>;
  adapterAddeds: AdapterAddedPage;
  adapterDeposited?: Maybe<AdapterDeposited>;
  adapterDepositeds: AdapterDepositedPage;
  adapterEvacuated?: Maybe<AdapterEvacuated>;
  adapterEvacuateds: AdapterEvacuatedPage;
  adapterHarvested?: Maybe<AdapterHarvested>;
  adapterHarvesteds: AdapterHarvestedPage;
  adapterRemoved?: Maybe<AdapterRemoved>;
  adapterRemoveds: AdapterRemovedPage;
  adapterRetiredEvent?: Maybe<AdapterRetiredEvent>;
  adapterRetiredEvents: AdapterRetiredEventPage;
  adapterWithdrawn?: Maybe<AdapterWithdrawn>;
  adapterWithdrawns: AdapterWithdrawnPage;
  adapters: AdapterPage;
  deposit?: Maybe<Deposit>;
  deposits: DepositPage;
  emergencyZeroed?: Maybe<EmergencyZeroed>;
  emergencyZeroeds: EmergencyZeroedPage;
  protocolRegistered?: Maybe<ProtocolRegistered>;
  protocolRegistereds: ProtocolRegisteredPage;
  rebalance?: Maybe<Rebalance>;
  rebalances: RebalancePage;
  scoreUpdated?: Maybe<ScoreUpdated>;
  scoreUpdateds: ScoreUpdatedPage;
  vault?: Maybe<Vault>;
  vaults: VaultPage;
  withdrawal?: Maybe<Withdrawal>;
  withdrawals: WithdrawalPage;
};


export type QueryAdapterArgs = {
  id: Scalars['String']['input'];
};


export type QueryAdapterAddedArgs = {
  id: Scalars['String']['input'];
};


export type QueryAdapterAddedsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<AdapterAddedFilter>;
};


export type QueryAdapterDepositedArgs = {
  id: Scalars['String']['input'];
};


export type QueryAdapterDepositedsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<AdapterDepositedFilter>;
};


export type QueryAdapterEvacuatedArgs = {
  id: Scalars['String']['input'];
};


export type QueryAdapterEvacuatedsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<AdapterEvacuatedFilter>;
};


export type QueryAdapterHarvestedArgs = {
  id: Scalars['String']['input'];
};


export type QueryAdapterHarvestedsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<AdapterHarvestedFilter>;
};


export type QueryAdapterRemovedArgs = {
  id: Scalars['String']['input'];
};


export type QueryAdapterRemovedsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<AdapterRemovedFilter>;
};


export type QueryAdapterRetiredEventArgs = {
  id: Scalars['String']['input'];
};


export type QueryAdapterRetiredEventsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<AdapterRetiredEventFilter>;
};


export type QueryAdapterWithdrawnArgs = {
  id: Scalars['String']['input'];
};


export type QueryAdapterWithdrawnsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<AdapterWithdrawnFilter>;
};


export type QueryAdaptersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<AdapterFilter>;
};


export type QueryDepositArgs = {
  id: Scalars['String']['input'];
};


export type QueryDepositsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<DepositFilter>;
};


export type QueryEmergencyZeroedArgs = {
  id: Scalars['String']['input'];
};


export type QueryEmergencyZeroedsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<EmergencyZeroedFilter>;
};


export type QueryProtocolRegisteredArgs = {
  id: Scalars['String']['input'];
};


export type QueryProtocolRegisteredsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<ProtocolRegisteredFilter>;
};


export type QueryRebalanceArgs = {
  id: Scalars['String']['input'];
};


export type QueryRebalancesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<RebalanceFilter>;
};


export type QueryScoreUpdatedArgs = {
  id: Scalars['String']['input'];
};


export type QueryScoreUpdatedsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<ScoreUpdatedFilter>;
};


export type QueryVaultArgs = {
  id: Scalars['String']['input'];
};


export type QueryVaultsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<VaultFilter>;
};


export type QueryWithdrawalArgs = {
  id: Scalars['String']['input'];
};


export type QueryWithdrawalsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<WithdrawalFilter>;
};

export type ViewPageInfo = {
  __typename?: 'ViewPageInfo';
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
};

export type Adapter = {
  __typename?: 'adapter';
  addedAtBlock: Scalars['BigInt']['output'];
  addedAtTimestamp: Scalars['BigInt']['output'];
  allocated: Scalars['BigInt']['output'];
  apyBps: Scalars['BigInt']['output'];
  id: Scalars['String']['output'];
  lastHarvestAt?: Maybe<Scalars['BigInt']['output']>;
  lastHarvestGain?: Maybe<Scalars['BigInt']['output']>;
  paused: Scalars['Boolean']['output'];
  protocolId: Scalars['String']['output'];
  retired: Scalars['Boolean']['output'];
  stratName: Scalars['String']['output'];
  vault: Scalars['String']['output'];
};

export type AdapterAdded = {
  __typename?: 'adapterAdded';
  adapter: Scalars['String']['output'];
  blockNumber: Scalars['BigInt']['output'];
  id: Scalars['String']['output'];
  protocolId: Scalars['String']['output'];
  timestamp: Scalars['BigInt']['output'];
  txHash: Scalars['String']['output'];
  vault: Scalars['String']['output'];
};

export type AdapterAddedFilter = {
  AND?: InputMaybe<Array<InputMaybe<AdapterAddedFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<AdapterAddedFilter>>>;
  adapter?: InputMaybe<Scalars['String']['input']>;
  adapter_contains?: InputMaybe<Scalars['String']['input']>;
  adapter_ends_with?: InputMaybe<Scalars['String']['input']>;
  adapter_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  adapter_not?: InputMaybe<Scalars['String']['input']>;
  adapter_not_contains?: InputMaybe<Scalars['String']['input']>;
  adapter_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  adapter_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  adapter_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  adapter_starts_with?: InputMaybe<Scalars['String']['input']>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  id?: InputMaybe<Scalars['String']['input']>;
  id_contains?: InputMaybe<Scalars['String']['input']>;
  id_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not?: InputMaybe<Scalars['String']['input']>;
  id_not_contains?: InputMaybe<Scalars['String']['input']>;
  id_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  protocolId?: InputMaybe<Scalars['String']['input']>;
  protocolId_contains?: InputMaybe<Scalars['String']['input']>;
  protocolId_ends_with?: InputMaybe<Scalars['String']['input']>;
  protocolId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  protocolId_not?: InputMaybe<Scalars['String']['input']>;
  protocolId_not_contains?: InputMaybe<Scalars['String']['input']>;
  protocolId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  protocolId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  protocolId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  protocolId_starts_with?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  txHash?: InputMaybe<Scalars['String']['input']>;
  txHash_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  txHash_not?: InputMaybe<Scalars['String']['input']>;
  txHash_not_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  txHash_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  txHash_starts_with?: InputMaybe<Scalars['String']['input']>;
  vault?: InputMaybe<Scalars['String']['input']>;
  vault_contains?: InputMaybe<Scalars['String']['input']>;
  vault_ends_with?: InputMaybe<Scalars['String']['input']>;
  vault_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  vault_not?: InputMaybe<Scalars['String']['input']>;
  vault_not_contains?: InputMaybe<Scalars['String']['input']>;
  vault_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  vault_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  vault_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  vault_starts_with?: InputMaybe<Scalars['String']['input']>;
};

export type AdapterAddedPage = {
  __typename?: 'adapterAddedPage';
  items: Array<AdapterAdded>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type AdapterDeposited = {
  __typename?: 'adapterDeposited';
  adapter: Scalars['String']['output'];
  blockNumber: Scalars['BigInt']['output'];
  id: Scalars['String']['output'];
  requested: Scalars['BigInt']['output'];
  supplied: Scalars['BigInt']['output'];
  timestamp: Scalars['BigInt']['output'];
  txHash: Scalars['String']['output'];
};

export type AdapterDepositedFilter = {
  AND?: InputMaybe<Array<InputMaybe<AdapterDepositedFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<AdapterDepositedFilter>>>;
  adapter?: InputMaybe<Scalars['String']['input']>;
  adapter_contains?: InputMaybe<Scalars['String']['input']>;
  adapter_ends_with?: InputMaybe<Scalars['String']['input']>;
  adapter_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  adapter_not?: InputMaybe<Scalars['String']['input']>;
  adapter_not_contains?: InputMaybe<Scalars['String']['input']>;
  adapter_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  adapter_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  adapter_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  adapter_starts_with?: InputMaybe<Scalars['String']['input']>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  id?: InputMaybe<Scalars['String']['input']>;
  id_contains?: InputMaybe<Scalars['String']['input']>;
  id_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not?: InputMaybe<Scalars['String']['input']>;
  id_not_contains?: InputMaybe<Scalars['String']['input']>;
  id_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  requested?: InputMaybe<Scalars['BigInt']['input']>;
  requested_gt?: InputMaybe<Scalars['BigInt']['input']>;
  requested_gte?: InputMaybe<Scalars['BigInt']['input']>;
  requested_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  requested_lt?: InputMaybe<Scalars['BigInt']['input']>;
  requested_lte?: InputMaybe<Scalars['BigInt']['input']>;
  requested_not?: InputMaybe<Scalars['BigInt']['input']>;
  requested_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  supplied?: InputMaybe<Scalars['BigInt']['input']>;
  supplied_gt?: InputMaybe<Scalars['BigInt']['input']>;
  supplied_gte?: InputMaybe<Scalars['BigInt']['input']>;
  supplied_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  supplied_lt?: InputMaybe<Scalars['BigInt']['input']>;
  supplied_lte?: InputMaybe<Scalars['BigInt']['input']>;
  supplied_not?: InputMaybe<Scalars['BigInt']['input']>;
  supplied_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  txHash?: InputMaybe<Scalars['String']['input']>;
  txHash_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  txHash_not?: InputMaybe<Scalars['String']['input']>;
  txHash_not_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  txHash_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  txHash_starts_with?: InputMaybe<Scalars['String']['input']>;
};

export type AdapterDepositedPage = {
  __typename?: 'adapterDepositedPage';
  items: Array<AdapterDeposited>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type AdapterEvacuated = {
  __typename?: 'adapterEvacuated';
  adapter: Scalars['String']['output'];
  blockNumber: Scalars['BigInt']['output'];
  id: Scalars['String']['output'];
  timestamp: Scalars['BigInt']['output'];
  txHash: Scalars['String']['output'];
  vault: Scalars['String']['output'];
  withdrawn: Scalars['BigInt']['output'];
};

export type AdapterEvacuatedFilter = {
  AND?: InputMaybe<Array<InputMaybe<AdapterEvacuatedFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<AdapterEvacuatedFilter>>>;
  adapter?: InputMaybe<Scalars['String']['input']>;
  adapter_contains?: InputMaybe<Scalars['String']['input']>;
  adapter_ends_with?: InputMaybe<Scalars['String']['input']>;
  adapter_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  adapter_not?: InputMaybe<Scalars['String']['input']>;
  adapter_not_contains?: InputMaybe<Scalars['String']['input']>;
  adapter_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  adapter_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  adapter_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  adapter_starts_with?: InputMaybe<Scalars['String']['input']>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  id?: InputMaybe<Scalars['String']['input']>;
  id_contains?: InputMaybe<Scalars['String']['input']>;
  id_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not?: InputMaybe<Scalars['String']['input']>;
  id_not_contains?: InputMaybe<Scalars['String']['input']>;
  id_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  txHash?: InputMaybe<Scalars['String']['input']>;
  txHash_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  txHash_not?: InputMaybe<Scalars['String']['input']>;
  txHash_not_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  txHash_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  txHash_starts_with?: InputMaybe<Scalars['String']['input']>;
  vault?: InputMaybe<Scalars['String']['input']>;
  vault_contains?: InputMaybe<Scalars['String']['input']>;
  vault_ends_with?: InputMaybe<Scalars['String']['input']>;
  vault_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  vault_not?: InputMaybe<Scalars['String']['input']>;
  vault_not_contains?: InputMaybe<Scalars['String']['input']>;
  vault_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  vault_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  vault_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  vault_starts_with?: InputMaybe<Scalars['String']['input']>;
  withdrawn?: InputMaybe<Scalars['BigInt']['input']>;
  withdrawn_gt?: InputMaybe<Scalars['BigInt']['input']>;
  withdrawn_gte?: InputMaybe<Scalars['BigInt']['input']>;
  withdrawn_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  withdrawn_lt?: InputMaybe<Scalars['BigInt']['input']>;
  withdrawn_lte?: InputMaybe<Scalars['BigInt']['input']>;
  withdrawn_not?: InputMaybe<Scalars['BigInt']['input']>;
  withdrawn_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
};

export type AdapterEvacuatedPage = {
  __typename?: 'adapterEvacuatedPage';
  items: Array<AdapterEvacuated>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type AdapterFilter = {
  AND?: InputMaybe<Array<InputMaybe<AdapterFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<AdapterFilter>>>;
  addedAtBlock?: InputMaybe<Scalars['BigInt']['input']>;
  addedAtBlock_gt?: InputMaybe<Scalars['BigInt']['input']>;
  addedAtBlock_gte?: InputMaybe<Scalars['BigInt']['input']>;
  addedAtBlock_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  addedAtBlock_lt?: InputMaybe<Scalars['BigInt']['input']>;
  addedAtBlock_lte?: InputMaybe<Scalars['BigInt']['input']>;
  addedAtBlock_not?: InputMaybe<Scalars['BigInt']['input']>;
  addedAtBlock_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  addedAtTimestamp?: InputMaybe<Scalars['BigInt']['input']>;
  addedAtTimestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  addedAtTimestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  addedAtTimestamp_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  addedAtTimestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  addedAtTimestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  addedAtTimestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  addedAtTimestamp_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  allocated?: InputMaybe<Scalars['BigInt']['input']>;
  allocated_gt?: InputMaybe<Scalars['BigInt']['input']>;
  allocated_gte?: InputMaybe<Scalars['BigInt']['input']>;
  allocated_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  allocated_lt?: InputMaybe<Scalars['BigInt']['input']>;
  allocated_lte?: InputMaybe<Scalars['BigInt']['input']>;
  allocated_not?: InputMaybe<Scalars['BigInt']['input']>;
  allocated_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  apyBps?: InputMaybe<Scalars['BigInt']['input']>;
  apyBps_gt?: InputMaybe<Scalars['BigInt']['input']>;
  apyBps_gte?: InputMaybe<Scalars['BigInt']['input']>;
  apyBps_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  apyBps_lt?: InputMaybe<Scalars['BigInt']['input']>;
  apyBps_lte?: InputMaybe<Scalars['BigInt']['input']>;
  apyBps_not?: InputMaybe<Scalars['BigInt']['input']>;
  apyBps_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  id?: InputMaybe<Scalars['String']['input']>;
  id_contains?: InputMaybe<Scalars['String']['input']>;
  id_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not?: InputMaybe<Scalars['String']['input']>;
  id_not_contains?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_starts_with?: InputMaybe<Scalars['String']['input']>;
  lastHarvestAt?: InputMaybe<Scalars['BigInt']['input']>;
  lastHarvestAt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  lastHarvestAt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  lastHarvestAt_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  lastHarvestAt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  lastHarvestAt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  lastHarvestAt_not?: InputMaybe<Scalars['BigInt']['input']>;
  lastHarvestAt_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  lastHarvestGain?: InputMaybe<Scalars['BigInt']['input']>;
  lastHarvestGain_gt?: InputMaybe<Scalars['BigInt']['input']>;
  lastHarvestGain_gte?: InputMaybe<Scalars['BigInt']['input']>;
  lastHarvestGain_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  lastHarvestGain_lt?: InputMaybe<Scalars['BigInt']['input']>;
  lastHarvestGain_lte?: InputMaybe<Scalars['BigInt']['input']>;
  lastHarvestGain_not?: InputMaybe<Scalars['BigInt']['input']>;
  lastHarvestGain_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  paused?: InputMaybe<Scalars['Boolean']['input']>;
  paused_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  paused_not?: InputMaybe<Scalars['Boolean']['input']>;
  paused_not_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  protocolId?: InputMaybe<Scalars['String']['input']>;
  protocolId_contains?: InputMaybe<Scalars['String']['input']>;
  protocolId_ends_with?: InputMaybe<Scalars['String']['input']>;
  protocolId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  protocolId_not?: InputMaybe<Scalars['String']['input']>;
  protocolId_not_contains?: InputMaybe<Scalars['String']['input']>;
  protocolId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  protocolId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  protocolId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  protocolId_starts_with?: InputMaybe<Scalars['String']['input']>;
  retired?: InputMaybe<Scalars['Boolean']['input']>;
  retired_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  retired_not?: InputMaybe<Scalars['Boolean']['input']>;
  retired_not_in?: InputMaybe<Array<InputMaybe<Scalars['Boolean']['input']>>>;
  stratName?: InputMaybe<Scalars['String']['input']>;
  stratName_contains?: InputMaybe<Scalars['String']['input']>;
  stratName_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  stratName_ends_with?: InputMaybe<Scalars['String']['input']>;
  stratName_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  stratName_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  stratName_not?: InputMaybe<Scalars['String']['input']>;
  stratName_not_contains?: InputMaybe<Scalars['String']['input']>;
  stratName_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  stratName_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  stratName_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  stratName_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  stratName_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  stratName_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  stratName_starts_with?: InputMaybe<Scalars['String']['input']>;
  stratName_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  vault?: InputMaybe<Scalars['String']['input']>;
  vault_contains?: InputMaybe<Scalars['String']['input']>;
  vault_ends_with?: InputMaybe<Scalars['String']['input']>;
  vault_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  vault_not?: InputMaybe<Scalars['String']['input']>;
  vault_not_contains?: InputMaybe<Scalars['String']['input']>;
  vault_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  vault_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  vault_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  vault_starts_with?: InputMaybe<Scalars['String']['input']>;
};

export type AdapterHarvested = {
  __typename?: 'adapterHarvested';
  adapter: Scalars['String']['output'];
  blockNumber: Scalars['BigInt']['output'];
  gain: Scalars['BigInt']['output'];
  id: Scalars['String']['output'];
  timestamp: Scalars['BigInt']['output'];
  totalAssetsAfter: Scalars['BigInt']['output'];
  txHash: Scalars['String']['output'];
};

export type AdapterHarvestedFilter = {
  AND?: InputMaybe<Array<InputMaybe<AdapterHarvestedFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<AdapterHarvestedFilter>>>;
  adapter?: InputMaybe<Scalars['String']['input']>;
  adapter_contains?: InputMaybe<Scalars['String']['input']>;
  adapter_ends_with?: InputMaybe<Scalars['String']['input']>;
  adapter_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  adapter_not?: InputMaybe<Scalars['String']['input']>;
  adapter_not_contains?: InputMaybe<Scalars['String']['input']>;
  adapter_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  adapter_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  adapter_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  adapter_starts_with?: InputMaybe<Scalars['String']['input']>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  gain?: InputMaybe<Scalars['BigInt']['input']>;
  gain_gt?: InputMaybe<Scalars['BigInt']['input']>;
  gain_gte?: InputMaybe<Scalars['BigInt']['input']>;
  gain_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  gain_lt?: InputMaybe<Scalars['BigInt']['input']>;
  gain_lte?: InputMaybe<Scalars['BigInt']['input']>;
  gain_not?: InputMaybe<Scalars['BigInt']['input']>;
  gain_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  id?: InputMaybe<Scalars['String']['input']>;
  id_contains?: InputMaybe<Scalars['String']['input']>;
  id_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not?: InputMaybe<Scalars['String']['input']>;
  id_not_contains?: InputMaybe<Scalars['String']['input']>;
  id_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  totalAssetsAfter?: InputMaybe<Scalars['BigInt']['input']>;
  totalAssetsAfter_gt?: InputMaybe<Scalars['BigInt']['input']>;
  totalAssetsAfter_gte?: InputMaybe<Scalars['BigInt']['input']>;
  totalAssetsAfter_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  totalAssetsAfter_lt?: InputMaybe<Scalars['BigInt']['input']>;
  totalAssetsAfter_lte?: InputMaybe<Scalars['BigInt']['input']>;
  totalAssetsAfter_not?: InputMaybe<Scalars['BigInt']['input']>;
  totalAssetsAfter_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  txHash?: InputMaybe<Scalars['String']['input']>;
  txHash_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  txHash_not?: InputMaybe<Scalars['String']['input']>;
  txHash_not_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  txHash_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  txHash_starts_with?: InputMaybe<Scalars['String']['input']>;
};

export type AdapterHarvestedPage = {
  __typename?: 'adapterHarvestedPage';
  items: Array<AdapterHarvested>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type AdapterPage = {
  __typename?: 'adapterPage';
  items: Array<Adapter>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type AdapterRemoved = {
  __typename?: 'adapterRemoved';
  adapter: Scalars['String']['output'];
  blockNumber: Scalars['BigInt']['output'];
  id: Scalars['String']['output'];
  protocolId: Scalars['String']['output'];
  timestamp: Scalars['BigInt']['output'];
  txHash: Scalars['String']['output'];
  vault: Scalars['String']['output'];
  withdrawn: Scalars['BigInt']['output'];
};

export type AdapterRemovedFilter = {
  AND?: InputMaybe<Array<InputMaybe<AdapterRemovedFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<AdapterRemovedFilter>>>;
  adapter?: InputMaybe<Scalars['String']['input']>;
  adapter_contains?: InputMaybe<Scalars['String']['input']>;
  adapter_ends_with?: InputMaybe<Scalars['String']['input']>;
  adapter_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  adapter_not?: InputMaybe<Scalars['String']['input']>;
  adapter_not_contains?: InputMaybe<Scalars['String']['input']>;
  adapter_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  adapter_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  adapter_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  adapter_starts_with?: InputMaybe<Scalars['String']['input']>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  id?: InputMaybe<Scalars['String']['input']>;
  id_contains?: InputMaybe<Scalars['String']['input']>;
  id_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not?: InputMaybe<Scalars['String']['input']>;
  id_not_contains?: InputMaybe<Scalars['String']['input']>;
  id_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  protocolId?: InputMaybe<Scalars['String']['input']>;
  protocolId_contains?: InputMaybe<Scalars['String']['input']>;
  protocolId_ends_with?: InputMaybe<Scalars['String']['input']>;
  protocolId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  protocolId_not?: InputMaybe<Scalars['String']['input']>;
  protocolId_not_contains?: InputMaybe<Scalars['String']['input']>;
  protocolId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  protocolId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  protocolId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  protocolId_starts_with?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  txHash?: InputMaybe<Scalars['String']['input']>;
  txHash_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  txHash_not?: InputMaybe<Scalars['String']['input']>;
  txHash_not_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  txHash_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  txHash_starts_with?: InputMaybe<Scalars['String']['input']>;
  vault?: InputMaybe<Scalars['String']['input']>;
  vault_contains?: InputMaybe<Scalars['String']['input']>;
  vault_ends_with?: InputMaybe<Scalars['String']['input']>;
  vault_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  vault_not?: InputMaybe<Scalars['String']['input']>;
  vault_not_contains?: InputMaybe<Scalars['String']['input']>;
  vault_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  vault_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  vault_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  vault_starts_with?: InputMaybe<Scalars['String']['input']>;
  withdrawn?: InputMaybe<Scalars['BigInt']['input']>;
  withdrawn_gt?: InputMaybe<Scalars['BigInt']['input']>;
  withdrawn_gte?: InputMaybe<Scalars['BigInt']['input']>;
  withdrawn_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  withdrawn_lt?: InputMaybe<Scalars['BigInt']['input']>;
  withdrawn_lte?: InputMaybe<Scalars['BigInt']['input']>;
  withdrawn_not?: InputMaybe<Scalars['BigInt']['input']>;
  withdrawn_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
};

export type AdapterRemovedPage = {
  __typename?: 'adapterRemovedPage';
  items: Array<AdapterRemoved>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type AdapterRetiredEvent = {
  __typename?: 'adapterRetiredEvent';
  adapter: Scalars['String']['output'];
  blockNumber: Scalars['BigInt']['output'];
  id: Scalars['String']['output'];
  timestamp: Scalars['BigInt']['output'];
  txHash: Scalars['String']['output'];
  withdrawn: Scalars['BigInt']['output'];
};

export type AdapterRetiredEventFilter = {
  AND?: InputMaybe<Array<InputMaybe<AdapterRetiredEventFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<AdapterRetiredEventFilter>>>;
  adapter?: InputMaybe<Scalars['String']['input']>;
  adapter_contains?: InputMaybe<Scalars['String']['input']>;
  adapter_ends_with?: InputMaybe<Scalars['String']['input']>;
  adapter_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  adapter_not?: InputMaybe<Scalars['String']['input']>;
  adapter_not_contains?: InputMaybe<Scalars['String']['input']>;
  adapter_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  adapter_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  adapter_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  adapter_starts_with?: InputMaybe<Scalars['String']['input']>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  id?: InputMaybe<Scalars['String']['input']>;
  id_contains?: InputMaybe<Scalars['String']['input']>;
  id_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not?: InputMaybe<Scalars['String']['input']>;
  id_not_contains?: InputMaybe<Scalars['String']['input']>;
  id_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  txHash?: InputMaybe<Scalars['String']['input']>;
  txHash_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  txHash_not?: InputMaybe<Scalars['String']['input']>;
  txHash_not_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  txHash_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  txHash_starts_with?: InputMaybe<Scalars['String']['input']>;
  withdrawn?: InputMaybe<Scalars['BigInt']['input']>;
  withdrawn_gt?: InputMaybe<Scalars['BigInt']['input']>;
  withdrawn_gte?: InputMaybe<Scalars['BigInt']['input']>;
  withdrawn_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  withdrawn_lt?: InputMaybe<Scalars['BigInt']['input']>;
  withdrawn_lte?: InputMaybe<Scalars['BigInt']['input']>;
  withdrawn_not?: InputMaybe<Scalars['BigInt']['input']>;
  withdrawn_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
};

export type AdapterRetiredEventPage = {
  __typename?: 'adapterRetiredEventPage';
  items: Array<AdapterRetiredEvent>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type AdapterWithdrawn = {
  __typename?: 'adapterWithdrawn';
  adapter: Scalars['String']['output'];
  blockNumber: Scalars['BigInt']['output'];
  id: Scalars['String']['output'];
  received: Scalars['BigInt']['output'];
  requested: Scalars['BigInt']['output'];
  timestamp: Scalars['BigInt']['output'];
  txHash: Scalars['String']['output'];
};

export type AdapterWithdrawnFilter = {
  AND?: InputMaybe<Array<InputMaybe<AdapterWithdrawnFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<AdapterWithdrawnFilter>>>;
  adapter?: InputMaybe<Scalars['String']['input']>;
  adapter_contains?: InputMaybe<Scalars['String']['input']>;
  adapter_ends_with?: InputMaybe<Scalars['String']['input']>;
  adapter_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  adapter_not?: InputMaybe<Scalars['String']['input']>;
  adapter_not_contains?: InputMaybe<Scalars['String']['input']>;
  adapter_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  adapter_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  adapter_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  adapter_starts_with?: InputMaybe<Scalars['String']['input']>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  id?: InputMaybe<Scalars['String']['input']>;
  id_contains?: InputMaybe<Scalars['String']['input']>;
  id_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not?: InputMaybe<Scalars['String']['input']>;
  id_not_contains?: InputMaybe<Scalars['String']['input']>;
  id_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  received?: InputMaybe<Scalars['BigInt']['input']>;
  received_gt?: InputMaybe<Scalars['BigInt']['input']>;
  received_gte?: InputMaybe<Scalars['BigInt']['input']>;
  received_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  received_lt?: InputMaybe<Scalars['BigInt']['input']>;
  received_lte?: InputMaybe<Scalars['BigInt']['input']>;
  received_not?: InputMaybe<Scalars['BigInt']['input']>;
  received_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  requested?: InputMaybe<Scalars['BigInt']['input']>;
  requested_gt?: InputMaybe<Scalars['BigInt']['input']>;
  requested_gte?: InputMaybe<Scalars['BigInt']['input']>;
  requested_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  requested_lt?: InputMaybe<Scalars['BigInt']['input']>;
  requested_lte?: InputMaybe<Scalars['BigInt']['input']>;
  requested_not?: InputMaybe<Scalars['BigInt']['input']>;
  requested_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  txHash?: InputMaybe<Scalars['String']['input']>;
  txHash_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  txHash_not?: InputMaybe<Scalars['String']['input']>;
  txHash_not_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  txHash_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  txHash_starts_with?: InputMaybe<Scalars['String']['input']>;
};

export type AdapterWithdrawnPage = {
  __typename?: 'adapterWithdrawnPage';
  items: Array<AdapterWithdrawn>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type Deposit = {
  __typename?: 'deposit';
  assets: Scalars['BigInt']['output'];
  blockNumber: Scalars['BigInt']['output'];
  id: Scalars['String']['output'];
  owner: Scalars['String']['output'];
  sender: Scalars['String']['output'];
  shares: Scalars['BigInt']['output'];
  timestamp: Scalars['BigInt']['output'];
  txHash: Scalars['String']['output'];
  vault: Scalars['String']['output'];
};

export type DepositFilter = {
  AND?: InputMaybe<Array<InputMaybe<DepositFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<DepositFilter>>>;
  assets?: InputMaybe<Scalars['BigInt']['input']>;
  assets_gt?: InputMaybe<Scalars['BigInt']['input']>;
  assets_gte?: InputMaybe<Scalars['BigInt']['input']>;
  assets_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  assets_lt?: InputMaybe<Scalars['BigInt']['input']>;
  assets_lte?: InputMaybe<Scalars['BigInt']['input']>;
  assets_not?: InputMaybe<Scalars['BigInt']['input']>;
  assets_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  id?: InputMaybe<Scalars['String']['input']>;
  id_contains?: InputMaybe<Scalars['String']['input']>;
  id_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not?: InputMaybe<Scalars['String']['input']>;
  id_not_contains?: InputMaybe<Scalars['String']['input']>;
  id_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  owner?: InputMaybe<Scalars['String']['input']>;
  owner_contains?: InputMaybe<Scalars['String']['input']>;
  owner_ends_with?: InputMaybe<Scalars['String']['input']>;
  owner_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  owner_not?: InputMaybe<Scalars['String']['input']>;
  owner_not_contains?: InputMaybe<Scalars['String']['input']>;
  owner_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  owner_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  owner_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  owner_starts_with?: InputMaybe<Scalars['String']['input']>;
  sender?: InputMaybe<Scalars['String']['input']>;
  sender_contains?: InputMaybe<Scalars['String']['input']>;
  sender_ends_with?: InputMaybe<Scalars['String']['input']>;
  sender_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  sender_not?: InputMaybe<Scalars['String']['input']>;
  sender_not_contains?: InputMaybe<Scalars['String']['input']>;
  sender_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  sender_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  sender_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  sender_starts_with?: InputMaybe<Scalars['String']['input']>;
  shares?: InputMaybe<Scalars['BigInt']['input']>;
  shares_gt?: InputMaybe<Scalars['BigInt']['input']>;
  shares_gte?: InputMaybe<Scalars['BigInt']['input']>;
  shares_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  shares_lt?: InputMaybe<Scalars['BigInt']['input']>;
  shares_lte?: InputMaybe<Scalars['BigInt']['input']>;
  shares_not?: InputMaybe<Scalars['BigInt']['input']>;
  shares_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  txHash?: InputMaybe<Scalars['String']['input']>;
  txHash_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  txHash_not?: InputMaybe<Scalars['String']['input']>;
  txHash_not_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  txHash_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  txHash_starts_with?: InputMaybe<Scalars['String']['input']>;
  vault?: InputMaybe<Scalars['String']['input']>;
  vault_contains?: InputMaybe<Scalars['String']['input']>;
  vault_ends_with?: InputMaybe<Scalars['String']['input']>;
  vault_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  vault_not?: InputMaybe<Scalars['String']['input']>;
  vault_not_contains?: InputMaybe<Scalars['String']['input']>;
  vault_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  vault_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  vault_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  vault_starts_with?: InputMaybe<Scalars['String']['input']>;
};

export type DepositPage = {
  __typename?: 'depositPage';
  items: Array<Deposit>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type EmergencyZeroed = {
  __typename?: 'emergencyZeroed';
  blockNumber: Scalars['BigInt']['output'];
  id: Scalars['String']['output'];
  previousScore: Scalars['Int']['output'];
  protocolId: Scalars['String']['output'];
  timestamp: Scalars['BigInt']['output'];
  txHash: Scalars['String']['output'];
};

export type EmergencyZeroedFilter = {
  AND?: InputMaybe<Array<InputMaybe<EmergencyZeroedFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<EmergencyZeroedFilter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  id?: InputMaybe<Scalars['String']['input']>;
  id_contains?: InputMaybe<Scalars['String']['input']>;
  id_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not?: InputMaybe<Scalars['String']['input']>;
  id_not_contains?: InputMaybe<Scalars['String']['input']>;
  id_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  previousScore?: InputMaybe<Scalars['Int']['input']>;
  previousScore_gt?: InputMaybe<Scalars['Int']['input']>;
  previousScore_gte?: InputMaybe<Scalars['Int']['input']>;
  previousScore_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  previousScore_lt?: InputMaybe<Scalars['Int']['input']>;
  previousScore_lte?: InputMaybe<Scalars['Int']['input']>;
  previousScore_not?: InputMaybe<Scalars['Int']['input']>;
  previousScore_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  protocolId?: InputMaybe<Scalars['String']['input']>;
  protocolId_contains?: InputMaybe<Scalars['String']['input']>;
  protocolId_ends_with?: InputMaybe<Scalars['String']['input']>;
  protocolId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  protocolId_not?: InputMaybe<Scalars['String']['input']>;
  protocolId_not_contains?: InputMaybe<Scalars['String']['input']>;
  protocolId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  protocolId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  protocolId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  protocolId_starts_with?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  txHash?: InputMaybe<Scalars['String']['input']>;
  txHash_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  txHash_not?: InputMaybe<Scalars['String']['input']>;
  txHash_not_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  txHash_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  txHash_starts_with?: InputMaybe<Scalars['String']['input']>;
};

export type EmergencyZeroedPage = {
  __typename?: 'emergencyZeroedPage';
  items: Array<EmergencyZeroed>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type ProtocolRegistered = {
  __typename?: 'protocolRegistered';
  blockNumber: Scalars['BigInt']['output'];
  id: Scalars['String']['output'];
  initialScore: Scalars['Int']['output'];
  protocolId: Scalars['String']['output'];
  timestamp: Scalars['BigInt']['output'];
  txHash: Scalars['String']['output'];
};

export type ProtocolRegisteredFilter = {
  AND?: InputMaybe<Array<InputMaybe<ProtocolRegisteredFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<ProtocolRegisteredFilter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  id?: InputMaybe<Scalars['String']['input']>;
  id_contains?: InputMaybe<Scalars['String']['input']>;
  id_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not?: InputMaybe<Scalars['String']['input']>;
  id_not_contains?: InputMaybe<Scalars['String']['input']>;
  id_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  initialScore?: InputMaybe<Scalars['Int']['input']>;
  initialScore_gt?: InputMaybe<Scalars['Int']['input']>;
  initialScore_gte?: InputMaybe<Scalars['Int']['input']>;
  initialScore_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  initialScore_lt?: InputMaybe<Scalars['Int']['input']>;
  initialScore_lte?: InputMaybe<Scalars['Int']['input']>;
  initialScore_not?: InputMaybe<Scalars['Int']['input']>;
  initialScore_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  protocolId?: InputMaybe<Scalars['String']['input']>;
  protocolId_contains?: InputMaybe<Scalars['String']['input']>;
  protocolId_ends_with?: InputMaybe<Scalars['String']['input']>;
  protocolId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  protocolId_not?: InputMaybe<Scalars['String']['input']>;
  protocolId_not_contains?: InputMaybe<Scalars['String']['input']>;
  protocolId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  protocolId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  protocolId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  protocolId_starts_with?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  txHash?: InputMaybe<Scalars['String']['input']>;
  txHash_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  txHash_not?: InputMaybe<Scalars['String']['input']>;
  txHash_not_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  txHash_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  txHash_starts_with?: InputMaybe<Scalars['String']['input']>;
};

export type ProtocolRegisteredPage = {
  __typename?: 'protocolRegisteredPage';
  items: Array<ProtocolRegistered>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type Rebalance = {
  __typename?: 'rebalance';
  blockNumber: Scalars['BigInt']['output'];
  id: Scalars['String']['output'];
  timestamp: Scalars['BigInt']['output'];
  totalPool: Scalars['BigInt']['output'];
  txHash: Scalars['String']['output'];
  vault: Scalars['String']['output'];
};

export type RebalanceFilter = {
  AND?: InputMaybe<Array<InputMaybe<RebalanceFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<RebalanceFilter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  id?: InputMaybe<Scalars['String']['input']>;
  id_contains?: InputMaybe<Scalars['String']['input']>;
  id_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not?: InputMaybe<Scalars['String']['input']>;
  id_not_contains?: InputMaybe<Scalars['String']['input']>;
  id_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  totalPool?: InputMaybe<Scalars['BigInt']['input']>;
  totalPool_gt?: InputMaybe<Scalars['BigInt']['input']>;
  totalPool_gte?: InputMaybe<Scalars['BigInt']['input']>;
  totalPool_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  totalPool_lt?: InputMaybe<Scalars['BigInt']['input']>;
  totalPool_lte?: InputMaybe<Scalars['BigInt']['input']>;
  totalPool_not?: InputMaybe<Scalars['BigInt']['input']>;
  totalPool_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  txHash?: InputMaybe<Scalars['String']['input']>;
  txHash_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  txHash_not?: InputMaybe<Scalars['String']['input']>;
  txHash_not_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  txHash_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  txHash_starts_with?: InputMaybe<Scalars['String']['input']>;
  vault?: InputMaybe<Scalars['String']['input']>;
  vault_contains?: InputMaybe<Scalars['String']['input']>;
  vault_ends_with?: InputMaybe<Scalars['String']['input']>;
  vault_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  vault_not?: InputMaybe<Scalars['String']['input']>;
  vault_not_contains?: InputMaybe<Scalars['String']['input']>;
  vault_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  vault_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  vault_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  vault_starts_with?: InputMaybe<Scalars['String']['input']>;
};

export type RebalancePage = {
  __typename?: 'rebalancePage';
  items: Array<Rebalance>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type ScoreUpdated = {
  __typename?: 'scoreUpdated';
  blockNumber: Scalars['BigInt']['output'];
  id: Scalars['String']['output'];
  newScore: Scalars['Int']['output'];
  oldScore: Scalars['Int']['output'];
  protocolId: Scalars['String']['output'];
  timestamp: Scalars['BigInt']['output'];
  txHash: Scalars['String']['output'];
};

export type ScoreUpdatedFilter = {
  AND?: InputMaybe<Array<InputMaybe<ScoreUpdatedFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<ScoreUpdatedFilter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  id?: InputMaybe<Scalars['String']['input']>;
  id_contains?: InputMaybe<Scalars['String']['input']>;
  id_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not?: InputMaybe<Scalars['String']['input']>;
  id_not_contains?: InputMaybe<Scalars['String']['input']>;
  id_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  newScore?: InputMaybe<Scalars['Int']['input']>;
  newScore_gt?: InputMaybe<Scalars['Int']['input']>;
  newScore_gte?: InputMaybe<Scalars['Int']['input']>;
  newScore_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  newScore_lt?: InputMaybe<Scalars['Int']['input']>;
  newScore_lte?: InputMaybe<Scalars['Int']['input']>;
  newScore_not?: InputMaybe<Scalars['Int']['input']>;
  newScore_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  oldScore?: InputMaybe<Scalars['Int']['input']>;
  oldScore_gt?: InputMaybe<Scalars['Int']['input']>;
  oldScore_gte?: InputMaybe<Scalars['Int']['input']>;
  oldScore_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  oldScore_lt?: InputMaybe<Scalars['Int']['input']>;
  oldScore_lte?: InputMaybe<Scalars['Int']['input']>;
  oldScore_not?: InputMaybe<Scalars['Int']['input']>;
  oldScore_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  protocolId?: InputMaybe<Scalars['String']['input']>;
  protocolId_contains?: InputMaybe<Scalars['String']['input']>;
  protocolId_ends_with?: InputMaybe<Scalars['String']['input']>;
  protocolId_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  protocolId_not?: InputMaybe<Scalars['String']['input']>;
  protocolId_not_contains?: InputMaybe<Scalars['String']['input']>;
  protocolId_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  protocolId_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  protocolId_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  protocolId_starts_with?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  txHash?: InputMaybe<Scalars['String']['input']>;
  txHash_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  txHash_not?: InputMaybe<Scalars['String']['input']>;
  txHash_not_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  txHash_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  txHash_starts_with?: InputMaybe<Scalars['String']['input']>;
};

export type ScoreUpdatedPage = {
  __typename?: 'scoreUpdatedPage';
  items: Array<ScoreUpdated>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type Vault = {
  __typename?: 'vault';
  asset: Scalars['String']['output'];
  assetDecimals: Scalars['Int']['output'];
  assetName: Scalars['String']['output'];
  assetSymbol: Scalars['String']['output'];
  createdAtBlock: Scalars['BigInt']['output'];
  createdAtTimestamp: Scalars['BigInt']['output'];
  id: Scalars['String']['output'];
  kind: Scalars['Int']['output'];
  oracle: Scalars['String']['output'];
  txHash: Scalars['String']['output'];
  vaultName: Scalars['String']['output'];
  vaultSymbol: Scalars['String']['output'];
};

export type VaultFilter = {
  AND?: InputMaybe<Array<InputMaybe<VaultFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<VaultFilter>>>;
  asset?: InputMaybe<Scalars['String']['input']>;
  assetDecimals?: InputMaybe<Scalars['Int']['input']>;
  assetDecimals_gt?: InputMaybe<Scalars['Int']['input']>;
  assetDecimals_gte?: InputMaybe<Scalars['Int']['input']>;
  assetDecimals_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  assetDecimals_lt?: InputMaybe<Scalars['Int']['input']>;
  assetDecimals_lte?: InputMaybe<Scalars['Int']['input']>;
  assetDecimals_not?: InputMaybe<Scalars['Int']['input']>;
  assetDecimals_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  assetName?: InputMaybe<Scalars['String']['input']>;
  assetName_contains?: InputMaybe<Scalars['String']['input']>;
  assetName_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  assetName_ends_with?: InputMaybe<Scalars['String']['input']>;
  assetName_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  assetName_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  assetName_not?: InputMaybe<Scalars['String']['input']>;
  assetName_not_contains?: InputMaybe<Scalars['String']['input']>;
  assetName_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  assetName_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  assetName_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  assetName_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  assetName_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  assetName_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  assetName_starts_with?: InputMaybe<Scalars['String']['input']>;
  assetName_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  assetSymbol?: InputMaybe<Scalars['String']['input']>;
  assetSymbol_contains?: InputMaybe<Scalars['String']['input']>;
  assetSymbol_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  assetSymbol_ends_with?: InputMaybe<Scalars['String']['input']>;
  assetSymbol_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  assetSymbol_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  assetSymbol_not?: InputMaybe<Scalars['String']['input']>;
  assetSymbol_not_contains?: InputMaybe<Scalars['String']['input']>;
  assetSymbol_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  assetSymbol_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  assetSymbol_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  assetSymbol_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  assetSymbol_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  assetSymbol_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  assetSymbol_starts_with?: InputMaybe<Scalars['String']['input']>;
  assetSymbol_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  asset_contains?: InputMaybe<Scalars['String']['input']>;
  asset_ends_with?: InputMaybe<Scalars['String']['input']>;
  asset_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  asset_not?: InputMaybe<Scalars['String']['input']>;
  asset_not_contains?: InputMaybe<Scalars['String']['input']>;
  asset_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  asset_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  asset_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  asset_starts_with?: InputMaybe<Scalars['String']['input']>;
  createdAtBlock?: InputMaybe<Scalars['BigInt']['input']>;
  createdAtBlock_gt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAtBlock_gte?: InputMaybe<Scalars['BigInt']['input']>;
  createdAtBlock_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  createdAtBlock_lt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAtBlock_lte?: InputMaybe<Scalars['BigInt']['input']>;
  createdAtBlock_not?: InputMaybe<Scalars['BigInt']['input']>;
  createdAtBlock_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  createdAtTimestamp?: InputMaybe<Scalars['BigInt']['input']>;
  createdAtTimestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAtTimestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  createdAtTimestamp_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  createdAtTimestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAtTimestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  createdAtTimestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  createdAtTimestamp_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  id?: InputMaybe<Scalars['String']['input']>;
  id_contains?: InputMaybe<Scalars['String']['input']>;
  id_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not?: InputMaybe<Scalars['String']['input']>;
  id_not_contains?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_starts_with?: InputMaybe<Scalars['String']['input']>;
  kind?: InputMaybe<Scalars['Int']['input']>;
  kind_gt?: InputMaybe<Scalars['Int']['input']>;
  kind_gte?: InputMaybe<Scalars['Int']['input']>;
  kind_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  kind_lt?: InputMaybe<Scalars['Int']['input']>;
  kind_lte?: InputMaybe<Scalars['Int']['input']>;
  kind_not?: InputMaybe<Scalars['Int']['input']>;
  kind_not_in?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  oracle?: InputMaybe<Scalars['String']['input']>;
  oracle_contains?: InputMaybe<Scalars['String']['input']>;
  oracle_ends_with?: InputMaybe<Scalars['String']['input']>;
  oracle_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  oracle_not?: InputMaybe<Scalars['String']['input']>;
  oracle_not_contains?: InputMaybe<Scalars['String']['input']>;
  oracle_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  oracle_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  oracle_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  oracle_starts_with?: InputMaybe<Scalars['String']['input']>;
  txHash?: InputMaybe<Scalars['String']['input']>;
  txHash_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  txHash_not?: InputMaybe<Scalars['String']['input']>;
  txHash_not_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  txHash_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  txHash_starts_with?: InputMaybe<Scalars['String']['input']>;
  vaultName?: InputMaybe<Scalars['String']['input']>;
  vaultName_contains?: InputMaybe<Scalars['String']['input']>;
  vaultName_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  vaultName_ends_with?: InputMaybe<Scalars['String']['input']>;
  vaultName_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  vaultName_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  vaultName_not?: InputMaybe<Scalars['String']['input']>;
  vaultName_not_contains?: InputMaybe<Scalars['String']['input']>;
  vaultName_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  vaultName_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  vaultName_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  vaultName_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  vaultName_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  vaultName_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  vaultName_starts_with?: InputMaybe<Scalars['String']['input']>;
  vaultName_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  vaultSymbol?: InputMaybe<Scalars['String']['input']>;
  vaultSymbol_contains?: InputMaybe<Scalars['String']['input']>;
  vaultSymbol_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  vaultSymbol_ends_with?: InputMaybe<Scalars['String']['input']>;
  vaultSymbol_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  vaultSymbol_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  vaultSymbol_not?: InputMaybe<Scalars['String']['input']>;
  vaultSymbol_not_contains?: InputMaybe<Scalars['String']['input']>;
  vaultSymbol_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  vaultSymbol_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  vaultSymbol_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  vaultSymbol_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  vaultSymbol_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  vaultSymbol_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  vaultSymbol_starts_with?: InputMaybe<Scalars['String']['input']>;
  vaultSymbol_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
};

export type VaultPage = {
  __typename?: 'vaultPage';
  items: Array<Vault>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};

export type Withdrawal = {
  __typename?: 'withdrawal';
  assets: Scalars['BigInt']['output'];
  blockNumber: Scalars['BigInt']['output'];
  id: Scalars['String']['output'];
  owner: Scalars['String']['output'];
  receiver: Scalars['String']['output'];
  sender: Scalars['String']['output'];
  shares: Scalars['BigInt']['output'];
  timestamp: Scalars['BigInt']['output'];
  txHash: Scalars['String']['output'];
  vault: Scalars['String']['output'];
};

export type WithdrawalFilter = {
  AND?: InputMaybe<Array<InputMaybe<WithdrawalFilter>>>;
  OR?: InputMaybe<Array<InputMaybe<WithdrawalFilter>>>;
  assets?: InputMaybe<Scalars['BigInt']['input']>;
  assets_gt?: InputMaybe<Scalars['BigInt']['input']>;
  assets_gte?: InputMaybe<Scalars['BigInt']['input']>;
  assets_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  assets_lt?: InputMaybe<Scalars['BigInt']['input']>;
  assets_lte?: InputMaybe<Scalars['BigInt']['input']>;
  assets_not?: InputMaybe<Scalars['BigInt']['input']>;
  assets_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  id?: InputMaybe<Scalars['String']['input']>;
  id_contains?: InputMaybe<Scalars['String']['input']>;
  id_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not?: InputMaybe<Scalars['String']['input']>;
  id_not_contains?: InputMaybe<Scalars['String']['input']>;
  id_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  id_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  id_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id_starts_with?: InputMaybe<Scalars['String']['input']>;
  id_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  owner?: InputMaybe<Scalars['String']['input']>;
  owner_contains?: InputMaybe<Scalars['String']['input']>;
  owner_ends_with?: InputMaybe<Scalars['String']['input']>;
  owner_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  owner_not?: InputMaybe<Scalars['String']['input']>;
  owner_not_contains?: InputMaybe<Scalars['String']['input']>;
  owner_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  owner_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  owner_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  owner_starts_with?: InputMaybe<Scalars['String']['input']>;
  receiver?: InputMaybe<Scalars['String']['input']>;
  receiver_contains?: InputMaybe<Scalars['String']['input']>;
  receiver_ends_with?: InputMaybe<Scalars['String']['input']>;
  receiver_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  receiver_not?: InputMaybe<Scalars['String']['input']>;
  receiver_not_contains?: InputMaybe<Scalars['String']['input']>;
  receiver_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  receiver_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  receiver_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  receiver_starts_with?: InputMaybe<Scalars['String']['input']>;
  sender?: InputMaybe<Scalars['String']['input']>;
  sender_contains?: InputMaybe<Scalars['String']['input']>;
  sender_ends_with?: InputMaybe<Scalars['String']['input']>;
  sender_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  sender_not?: InputMaybe<Scalars['String']['input']>;
  sender_not_contains?: InputMaybe<Scalars['String']['input']>;
  sender_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  sender_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  sender_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  sender_starts_with?: InputMaybe<Scalars['String']['input']>;
  shares?: InputMaybe<Scalars['BigInt']['input']>;
  shares_gt?: InputMaybe<Scalars['BigInt']['input']>;
  shares_gte?: InputMaybe<Scalars['BigInt']['input']>;
  shares_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  shares_lt?: InputMaybe<Scalars['BigInt']['input']>;
  shares_lte?: InputMaybe<Scalars['BigInt']['input']>;
  shares_not?: InputMaybe<Scalars['BigInt']['input']>;
  shares_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<InputMaybe<Scalars['BigInt']['input']>>>;
  txHash?: InputMaybe<Scalars['String']['input']>;
  txHash_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  txHash_not?: InputMaybe<Scalars['String']['input']>;
  txHash_not_contains?: InputMaybe<Scalars['String']['input']>;
  txHash_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  txHash_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  txHash_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  txHash_starts_with?: InputMaybe<Scalars['String']['input']>;
  vault?: InputMaybe<Scalars['String']['input']>;
  vault_contains?: InputMaybe<Scalars['String']['input']>;
  vault_ends_with?: InputMaybe<Scalars['String']['input']>;
  vault_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  vault_not?: InputMaybe<Scalars['String']['input']>;
  vault_not_contains?: InputMaybe<Scalars['String']['input']>;
  vault_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  vault_not_in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  vault_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  vault_starts_with?: InputMaybe<Scalars['String']['input']>;
};

export type WithdrawalPage = {
  __typename?: 'withdrawalPage';
  items: Array<Withdrawal>;
  pageInfo: PageInfo;
  totalCount: Scalars['Int']['output'];
};
