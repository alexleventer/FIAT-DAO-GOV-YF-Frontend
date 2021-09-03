import BigNumber from 'bignumber.js';
import QueryString from 'query-string';
import { getHumanValue } from 'web3/utils';

import { XyzToken } from 'components/providers/known-tokens-provider';
import config from 'config';

const API_URL = config.api.baseUrl;

type PaginatedResult<T extends Record<string, any>> = {
  data: T[];
  meta: {
    count: number;
  };
};

export type APIOverviewData = {
  avgLockTimeSeconds: number;
  totalDelegatedPower: BigNumber;
  TotalVKek: BigNumber;
  holders: number;
  holdersStakingExcluded: number;
  voters: number;
  supernovaUsers: number;
};

export function fetchOverviewData(): Promise<APIOverviewData> {
  const url = new URL(`/api/governance/overview`, API_URL);

  return fetch(url.toString())
    .then(result => result.json())
    .then(result => ({
      ...result.data,
      totalDelegatedPower: getHumanValue(new BigNumber(result.data.totalDelegatedPower), 18),
      TotalVKek: getHumanValue(new BigNumber(result.data.TotalVKek), 18),
    }));
}

export type APIVoterEntity = {
  address: string;
  kekStaked: BigNumber;
  lockedUntil: number;
  delegatedPower: BigNumber;
  votes: number;
  proposals: number;
  votingPower: BigNumber;
  hasActiveDelegation: boolean;
};

export function fetchVoters(page = 1, limit = 10): Promise<PaginatedResult<APIVoterEntity>> {
  const url = new URL(`/api/governance/voters?page=${page}&limit=${limit}`, API_URL);

  return fetch(url.toString())
    .then(result => result.json())
    .then((result: PaginatedResult<APIVoterEntity>) => ({
      ...result,
      data: (result.data ?? []).map((item: APIVoterEntity) => ({
        ...item,
        kekStaked: getHumanValue(new BigNumber(item.kekStaked), XyzToken.decimals)!,
        delegatedPower: getHumanValue(new BigNumber(item.delegatedPower), 18)!,
        votingPower: getHumanValue(new BigNumber(item.votingPower), 18)!,
      })),
    }));
}

export enum APIProposalState {
  CREATED = 'CREATED',
  WARMUP = 'WARMUP',
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
  FAILED = 'FAILED',
  ACCEPTED = 'ACCEPTED',
  QUEUED = 'QUEUED',
  GRACE = 'GRACE',
  EXPIRED = 'EXPIRED',
  EXECUTED = 'EXECUTED',
  ABROGATED = 'ABROGATED',
}

export enum APIProposalStateId {
  WARMUP = 0,
  ACTIVE,
  CANCELED,
  FAILED,
  ACCEPTED,
  QUEUED,
  GRACE,
  EXPIRED,
  EXECUTED,
  ABROGATED,
}

export const APIProposalStateMap = new Map<APIProposalState, string>([
  [APIProposalState.CREATED, 'Created'],
  [APIProposalState.WARMUP, 'Warm-Up'],
  [APIProposalState.ACTIVE, 'Voting'],
  [APIProposalState.CANCELED, 'Canceled'],
  [APIProposalState.FAILED, 'Failed'],
  [APIProposalState.ACCEPTED, 'Accepted'],
  [APIProposalState.QUEUED, 'Queued for execution'],
  [APIProposalState.GRACE, 'Pending execution'],
  [APIProposalState.EXPIRED, 'Expired'],
  [APIProposalState.EXECUTED, 'Executed'],
  [APIProposalState.ABROGATED, 'Abrogated'],
]);

export type APILiteProposalEntity = {
  proposalId: number;
  proposer: string;
  title: string;
  description: string;
  createTime: number;
  state: APIProposalState;
  stateTimeLeft: number | null;
  forVotes: BigNumber;
  againstVotes: BigNumber;
};

export function fetchProposals(
  page = 1,
  limit = 10,
  state?: string,
  search?: string,
): Promise<PaginatedResult<APILiteProposalEntity>> {
  const query = QueryString.stringify(
    {
      page: String(page),
      limit: String(limit),
      state,
      title: search,
    },
    {
      skipNull: true,
      skipEmptyString: true,
      encode: true,
    },
  );

  const url = new URL(`/api/governance/proposals?${query}`, API_URL);

  return fetch(url.toString())
    .then(result => result.json())
    .then(({ status, ...data }) => {
      if (status !== 200) {
        return Promise.reject(status);
      }

      return data;
    })
    .then((result: PaginatedResult<APILiteProposalEntity>) => ({
      ...result,
      data: (result.data ?? []).map(proposal => ({
        ...proposal,
        forVotes: getHumanValue(new BigNumber(proposal.forVotes), 18)!,
        againstVotes: getHumanValue(new BigNumber(proposal.againstVotes), 18)!,
      })),
    }));
}

export type APIProposalHistoryEntity = {
  name: string;
  startTimestamp: number;
  endTimestamp: number;
  txHash: string;
};

export type APIProposalEntity = APILiteProposalEntity & {
  blockTimestamp: number;
  warmUpDuration: number;
  activeDuration: number;
  queueDuration: number;
  gracePeriodDuration: number;
  minQuorum: number;
  acceptanceThreshold: number;
  targets: string[];
  values: string[];
  signatures: string[];
  calldatas: string[];
  history: APIProposalHistoryEntity[];
};

export function fetchProposal(proposalId: number): Promise<APIProposalEntity> {
  const url = new URL(`/api/governance/proposals/${proposalId}`, API_URL);

  return fetch(url.toString())
    .then(result => result.json())
    .then(({ data, status }) => {
      if (status !== 200) {
        return Promise.reject(status);
      }

      return data;
    })
    .then((data: APIProposalEntity) => ({
      ...data,
      forVotes: getHumanValue(new BigNumber(data.forVotes), 18)!,
      againstVotes: getHumanValue(new BigNumber(data.againstVotes), 18)!,
    }));
}

export type APIVoteEntity = {
  address: string;
  power: BigNumber;
  support: boolean;
  blockTimestamp: number;
};

export function fetchProposalVoters(
  proposalId: number,
  page = 1,
  limit = 10,
  support?: boolean,
): Promise<PaginatedResult<APIVoteEntity>> {
  const query = QueryString.stringify(
    {
      page: String(page),
      limit: String(limit),
      support,
    },
    {
      skipNull: true,
      skipEmptyString: true,
      encode: true,
    },
  );

  const url = new URL(`/api/governance/proposals/${proposalId}/votes?${query}`, API_URL);

  return fetch(url.toString())
    .then(result => result.json())
    .then(({ status, ...data }) => {
      if (status !== 200) {
        return Promise.reject(status);
      }

      return data;
    })
    .then((result: PaginatedResult<APIVoteEntity>) => ({
      ...result,
      data: (result.data ?? []).map(vote => ({
        ...vote,
        power: getHumanValue(new BigNumber(vote.power), 18)!,
      })),
    }));
}

export type APIAbrogationEntity = {
  proposalId: number;
  caller: string;
  createTime: number;
  description: string;
  forVotes: BigNumber;
  againstVotes: BigNumber;
};

export function fetchAbrogation(proposalId: number): Promise<APIAbrogationEntity> {
  const url = new URL(`/api/governance/abrogation-proposals/${proposalId}`, API_URL);

  return fetch(url.toString())
    .then(result => result.json())
    .then(({ data, status }) => {
      if (status !== 200) {
        return Promise.reject(status);
      }

      return data;
    })
    .then((data: APIAbrogationEntity) => ({
      ...data,
      forVotes: getHumanValue(new BigNumber(data.forVotes), 18)!,
      againstVotes: getHumanValue(new BigNumber(data.againstVotes), 18)!,
    }));
}

export type APIAbrogationVoteEntity = {
  address: string;
  power: BigNumber;
  support: boolean;
  blockTimestamp: number;
};

export function fetchAbrogationVoters(
  proposalId: number,
  page = 1,
  limit = 10,
  support?: boolean,
): Promise<PaginatedResult<APIAbrogationVoteEntity>> {
  const query = QueryString.stringify(
    {
      page: String(page),
      limit: String(limit),
      support,
    },
    {
      skipNull: true,
      skipEmptyString: true,
      encode: true,
    },
  );

  const url = new URL(`/api/governance/abrogation-proposals/${proposalId}/votes?${query}`, API_URL);

  return fetch(url.toString())
    .then(result => result.json())
    .then(({ status, ...data }) => {
      if (status !== 200) {
        return Promise.reject(status);
      }

      return data;
    })
    .then((result: PaginatedResult<APIVoteEntity>) => ({
      ...result,
      data: (result.data ?? []).map(vote => ({
        ...vote,
        power: getHumanValue(new BigNumber(vote.power), 18)!,
      })),
    }));
}

export type APITreasuryToken = {
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals: number;
};

export function fetchTreasuryTokens(): Promise<APITreasuryToken[]> {
  const url = new URL(`/v1/protocols/tokens/balances?addresses%5B%5D=${config.contracts.dao.governance}&network=ethereum&api_key=${config.zapper.apiKey}`, config.zapper.baseUrl);

  return fetch(url.toString())
    .then(result => result.json())
    .then((res) => {
      const assets = res[`${config.contracts.dao.governance}`].products[0].assets


      const data = assets.filter((t: { symbol: string; }) => t.symbol != 'ETH').map((m: { address: any; symbol: any; decimals: any; }) => {
        return {
          tokenAddress: m.address,
          tokenSymbol: m.symbol,
          tokenDecimals: m.decimals
        }
      })


      return data;
    });
}

export type APITreasuryHistory = {
  accountAddress: string;
  accountLabel: string;
  counterpartyAddress: string;
  counterpartyLabel: string;
  amount: string;
  transactionDirection: string;
  tokenAddress: string;
  tokenSymbol: string;
  transactionHash: string;
  blockTimestamp: number;
  blockNumber: number;
};

type ZapperTransactionHistory = {
  hash: string;
  blockNumber: number;
  timeStamp: string;
  symbol: string;
  address: string;
  direction: string;
  from: string;
  amount: string;
  destination: string;
}

export function fetchTreasuryHistory(): Promise<PaginatedResult<APITreasuryHistory>> {

  // const url = new URL(`/api/governance/treasury/transactions?${query}`, API_URL);
  const url = new URL(`/v1/transactions?address=${config.contracts.dao.governance}&addresses%5B%5D=${config.contracts.dao.governance}&network=ethereum&api_key=${config.zapper.apiKey}`, config.zapper.baseUrl);

  return fetch(url.toString())
    .then(result => result.json())
    .then((res) => {

      const data = res.data.map((m: ZapperTransactionHistory) => {
        return {
          accountAddress: (m.direction == 'incoming') ? m.destination : m.from,
          accountLabel: 'DAO',
          counterpartyAddress: (m.direction == 'incoming') ? m.from : m.destination,
          counterpartyLabel: "",
          amount: m.amount,
          transactionDirection: (m.direction == 'incoming') ? 'IN' : 'OUT',
          tokenAddress: m.address,
          tokenSymbol: m.symbol,
          transactionHash: m.hash,
          blockTimestamp: Number.parseInt(m.timeStamp),
          blockNumber: m.blockNumber
        }
      })

      return { data, meta: { count: data.length } };
    });
}
