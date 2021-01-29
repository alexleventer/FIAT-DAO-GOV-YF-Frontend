import React from 'react';
import { useHistory } from 'react-router';
import * as Antd from 'antd';
import BigNumber from 'bignumber.js';

import { useAsyncEffect } from 'hooks/useAsyncEffect';
import { useReload } from 'hooks/useReload';
import { ZERO_BIG_NUMBER } from 'web3/utils';
import { useWeb3Contracts } from 'web3/contracts';
import { GetReceiptCallResult } from 'web3/contracts/daoGovernance';
import { useWallet } from 'wallets/wallet';
import { APIProposalEntity, fetchProposal } from 'modules/governance/api';

export type ProposalProviderState = {
  proposal?: APIProposalEntity;
  forRate?: number;
  againstRate?: number;
  quorum?: number;
  votingPower?: BigNumber;
  receipt?: GetReceiptCallResult;
  threshold?: boolean;
  canceled?: boolean;
};

export type ProposalContextType = ProposalProviderState & {
  reload(): void;
  cancelProposal(): Promise<any>;
  startAbrogationProposal(): Promise<any>;
  queueForExecution(): Promise<any>;
  queueForExecution(): Promise<any>;
  executeProposal(): Promise<any>;
};

const InitialState: ProposalProviderState = {};

const ProposalContext = React.createContext<ProposalContextType>({
  ...InitialState,
  reload: () => undefined,
  cancelProposal: () => Promise.reject(),
  startAbrogationProposal: () => Promise.reject(),
  queueForExecution: () => Promise.reject(),
  executeProposal: () => Promise.reject(),
});

export function useProposal(): ProposalContextType {
  return React.useContext(ProposalContext);
}

export type ProposalProviderProps = {
  proposalId?: number;
};

const ProposalProvider: React.FunctionComponent<ProposalProviderProps> = props => {
  const { proposalId, children } = props;

  const [reload, version] = useReload();
  const history = useHistory();
  const wallet = useWallet();
  const web3c = useWeb3Contracts();

  const [state, setState] = React.useState<ProposalProviderState>(InitialState);

  React.useEffect(() => {
    if (!proposalId) {
      return;
    }

    fetchProposal(proposalId)
      .then(proposal => {
        setState(prevState => ({
          ...prevState,
          proposal,
        }));
      })
      .catch((status: number) => {
        if (status === 404) {
          Antd.notification.error({
            message: `Proposal with id=${proposalId} doesn't exist.`,
          });
        } else {
          Antd.notification.error({
            message: `Failed to fetch proposal with id=${proposalId}. (Status: ${status})`,
          });
        }

        history.push('/governance/proposals');
      });
  }, [proposalId, version]);

  useAsyncEffect(async () => {
    setState(prevState => ({
      ...prevState,
      forRate: undefined,
      againstRate: undefined,
      quorum: undefined,
      threshold: undefined,
      canceled: undefined,
    }));

    if (!state.proposal) {
      return;
    }

    const { forVotes, againstVotes } = state.proposal;
    const total = forVotes.plus(againstVotes);

    let forRate = 0;
    let againstRate = 0;

    if (total.gt(ZERO_BIG_NUMBER)) {
      forRate = forVotes.multipliedBy(100).div(total).toNumber();
      againstRate = againstVotes.multipliedBy(100).div(total).toNumber();
    }

    setState(prevState => ({
      ...prevState,
      forRate,
      againstRate,
    }));

    const ts = state.proposal.createTime + state.proposal.warmUpDuration;

    web3c.daoBarn.actions.bondStakedAtTs(ts)
      .then(([bondStakedAt]) => {
        let quorum = 0;

        if (bondStakedAt.gt(ZERO_BIG_NUMBER)) {
          quorum = total.multipliedBy(100).div(bondStakedAt).toNumber();
        }

        setState(prevState => ({
          ...prevState,
          quorum,
        }));
      });

    web3c.daoGovernance.actions.abrogationProposals(state.proposal.proposalId)
      .then((result) => {
        const canceled = result?.createTime! > 0;

        setState(prevState => ({
          ...prevState,
          canceled,
        }));
      });

    web3c.daoBarn.actions.votingPower(state.proposal.proposer)
      .then(([votingPower]) => {
        const bondStaked = web3c.daoBarn.bondStaked;

        setState(prevState => ({
          ...prevState,
          threshold: bondStaked?.div(100).isLessThan(votingPower) ?? true,
        }));
      });
  }, [state.proposal]);

  React.useEffect(() => {
    if (!state.proposal || !wallet.account) {
      return;
    }

    const ts = state.proposal.createTime + state.proposal.warmUpDuration;

    web3c.daoBarn.actions.votingPowerAtTs(ts)
      .then(([votingPower]) => {
        setState(prevState => ({
          ...prevState,
          votingPower,
        }));
      });

    web3c.daoGovernance.actions.getReceipt(state.proposal.proposalId)
      .then((result: GetReceiptCallResult) => {
        setState(prevState => ({
          ...prevState,
          receipt: result,
        }));
      });
  }, [state.proposal, wallet.account]);

  function cancelProposal() {
    return proposalId ? web3c.daoGovernance.actions.cancelProposal(proposalId) : Promise.reject();
  }

  function startAbrogationProposal() {
    return Promise.reject();
    // return proposalId ? web3c.daoGovernance.actions.startAbrogationProposal(proposalId) : Promise.reject();
  }

  function queueForExecution() {
    return proposalId ? web3c.daoGovernance.actions.queueForExecution(proposalId) : Promise.reject();
  }

  function executeProposal() {
    return proposalId ? web3c.daoGovernance.actions.executeProposal(proposalId) : Promise.reject();
  }

  return (
    <ProposalContext.Provider value={{
      ...state,
      reload,
      cancelProposal,
      startAbrogationProposal: startAbrogationProposal,
      queueForExecution,
      executeProposal,
    }}>{children}</ProposalContext.Provider>
  );
};

export default ProposalProvider;
