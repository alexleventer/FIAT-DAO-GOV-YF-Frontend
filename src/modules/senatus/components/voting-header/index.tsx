import React from 'react';
import { Spin } from 'antd';
import BigNumber from 'bignumber.js';
import cn from 'classnames';
import { formatBigValue, formatEntrValue, formatToken, isSmallEntrValue } from 'web3/utils';

import Button from 'components/antd/button';
import Divider from 'components/antd/divider';
import Skeleton from 'components/antd/skeleton';
import Tooltip from 'components/antd/tooltip';
import Grid from 'components/custom/grid';
import Icon from 'components/custom/icon';
import { Text } from 'components/custom/typography';
import { UseLeftTime } from 'hooks/useLeftTime';
import useMergeState from 'hooks/useMergeState';
import imgSrc from 'resources/png/enterdao.png';

import { FDTToken } from '../../../../components/providers/known-tokens-provider';
import useMediaQuery from '../../../../hooks/useMediaQuery';
import Erc20Contract from '../../../../web3/erc20Contract';
import { useDAO } from '../dao-provider';
import VotingDetailedModal from '../voting-detailed-modal';

import { getFormattedDuration, inRange } from 'utils';

import s from './s.module.scss';

type VotingHeaderState = {
  claiming: boolean;
  showDetailedView: boolean;
};

const InitialState: VotingHeaderState = {
  claiming: false,
  showDetailedView: false,
};

const VotingHeader: React.FC = () => {
  const daoCtx = useDAO();
  const isMobile = useMediaQuery(767);

  const [state, setState] = useMergeState<VotingHeaderState>(InitialState);

  const { claimValue } = daoCtx.daoReward;
  const fdtBalance = (FDTToken.contract as Erc20Contract).balance?.unscaleBy(FDTToken.decimals);
  const { votingPower, userLockedUntil, multiplier = 1 } = daoCtx.daoComitium;

  const loadedUserLockedUntil = (userLockedUntil ?? Date.now()) - Date.now();

  function handleLeftTimeEnd() {
    daoCtx.daoComitium.reload();
  }

  function handleClaim() {
    setState({ claiming: true });

    daoCtx.daoReward.actions
      .claim()
      .catch(Error)
      .then(() => {
        daoCtx.daoReward.reload();
        (FDTToken.contract as Erc20Contract).loadBalance().catch(Error);
        setState({ claiming: false });
      });
  }

  return (
    <div className={cn(s.component, 'pv-24')}>
      <div className="container-limit">
        <Text type="lb2" weight="500" color="primary" className="mb-16">
          My Voting Power
        </Text>
        <Grid flow="col" gap={24} className={s.items}>
          <Grid flow="row" gap={4} className={s.item1}>
            <Text type="p2" color="secondary">
              Current reward
            </Text>
            <Grid flow="col" align="center" className={s.item1__grid}>
              <Tooltip title={<Text type="p2">{formatBigValue(claimValue, FDTToken.decimals)}</Text>}>
                <Skeleton loading={claimValue === undefined}>
                  <Text type="h3" weight="semibold" color="primary">
                    {isSmallEntrValue(claimValue) && '> '}
                    {formatEntrValue(claimValue)}
                  </Text>
                </Skeleton>
              </Tooltip>
              <Icon name="png/fiat-dao" width={27} height={27} style={{ marginLeft: 10 }} />
              <button
                type="button"
                className="button-primary button-small"
                disabled={claimValue?.isZero()}
                onClick={handleClaim}
                style={{ marginLeft: isMobile ? 0 : 15 }}>
                {!state.claiming ? 'Claim' : <Spin spinning />}
              </button>
            </Grid>
          </Grid>
          <Divider type="vertical" />

          <Grid flow="row" gap={2} className={s.item2}>
            <Text type="p2" color="secondary" className="mb-4">
              {FDTToken.symbol} Balance
            </Text>
            <Skeleton loading={fdtBalance === undefined}>
              <Grid flow="col" gap={8} align="center">
                <Text type="h3" weight="semibold" color="primary">
                  {formatEntrValue(fdtBalance)}
                </Text>
                <Icon name={FDTToken.icon!} width={27} height={27} />
              </Grid>
            </Skeleton>
          </Grid>

          <Divider type="vertical" />
          <Grid flow="row" gap={4} className={s.item4}>
            <Text type="p2" color="secondary" className="sm-mb-8">
              Total voting power
            </Text>
            <div className={cn('flex col-gap-8 align-center', s.item4__flex)}>
              <Skeleton loading={votingPower === undefined}>
                <Text type="h3" weight="semibold" color="primary">
                  {formatEntrValue(votingPower) || '-'}
                </Text>
                <Icon name={FDTToken.icon!} width={27} height={27} />
              </Skeleton>
              <div className={s.break} />
              <button
                type="button"
                className="button-primary button-small"
                onClick={() => setState({ showDetailedView: true })}>
                Detailed view
              </button>
              {state.showDetailedView && <VotingDetailedModal onCancel={() => setState({ showDetailedView: false })} />}
            </div>
          </Grid>

          <UseLeftTime end={userLockedUntil ?? 0} delay={1_000} onEnd={handleLeftTimeEnd}>
            {leftTime => {
              const leftMultiplier = new BigNumber(multiplier - 1)
                .multipliedBy(leftTime)
                .div(loadedUserLockedUntil)
                .plus(1);

              return leftMultiplier.gt(1) ? (
                <>
                  <Divider type="vertical" />
                  <Grid flow="row" gap={4} className={s.item4}>
                    <Text type="p2" color="secondary">
                      Multiplier & Lock timer
                    </Text>
                    <Grid flow="col" gap={8} align="center">
                      <Tooltip title={`x${leftMultiplier}`}>
                        <Text type="lb1" weight="semibold" color="red" className={s.ratio}>
                          {inRange(multiplier, 1, 1.01) ? '>' : ''} {formatBigValue(leftMultiplier, 2, '-', 2)}x
                        </Text>
                      </Tooltip>
                      <Text type="p2" color="secondary">
                        for
                      </Text>
                      <Text type="h3" weight="semibold" color="primary">
                        {getFormattedDuration(0, userLockedUntil)}
                      </Text>
                    </Grid>
                  </Grid>
                </>
              ) : undefined;
            }}
          </UseLeftTime>
        </Grid>
      </div>
    </div>
  );
};

export default VotingHeader;
