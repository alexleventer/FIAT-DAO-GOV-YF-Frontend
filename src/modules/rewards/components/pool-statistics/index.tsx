import React, { FC, useState } from 'react';
import BigNumber from 'bignumber.js';
import cn from 'classnames';
import TxConfirmModal, { ConfirmTxModalArgs } from 'web3/components/tx-confirm-modal';
import Erc20Contract from 'web3/erc20Contract';
import { formatToken, formatUSD } from 'web3/utils';

import Spin from 'components/antd/spin';
import Tooltip from 'components/antd/tooltip';
import Icon from 'components/custom/icon';
import { Tabs as ElasticTabs } from 'components/custom/tabs';
import { Text } from 'components/custom/typography';
import { FDTToken, convertTokenInUSD, useKnownTokens } from 'components/providers/known-tokens-provider';
import { YfPoolContract } from 'modules/rewards/contracts/yfPool';
import { useWallet } from 'wallets/wallet';

import { useYFPool } from '../../providers/pool-provider';
import { useYFPools } from '../../providers/pools-provider';

import s from './s.module.scss';

const PoolStatistics: FC = () => {
  const knownTokensCtx = useKnownTokens();
  const walletCtx = useWallet();
  const yfPoolsCtx = useYFPools();
  const yfPoolCtx = useYFPool();

  const { poolMeta, poolMetaOld } = yfPoolCtx;

  const [activeToken, setActiveToken] = useState(poolMeta?.tokens[0]);
  const [claiming, setClaiming] = useState(false);
  const [oldClaiming, setOldClaiming] = useState(false);
  const [confirmClaimVisible, setConfirmClaimVisible] = useState(false);
  const [confirmOldClaimVisible, setConfirmOldClaimVisible] = useState(false);

  const fdtContract = FDTToken.contract as Erc20Contract;
  const activeContract = activeToken?.contract as Erc20Contract;

  if (!walletCtx.isActive || !poolMeta) {
    return null;
  }

  const { lastActiveEpoch } = poolMeta.contract;

  const selectedStakedToken = yfPoolsCtx.stakingContract?.stakedTokens.get(activeToken?.address!);

  function handleTabSelect(tokenSymbol: string) {
    const tokenMeta = knownTokensCtx.getTokenBySymbol(tokenSymbol);
    setActiveToken(tokenMeta);
  }

  function handleClaim() {
    setConfirmClaimVisible(true);
  }

  function handleOldClaim() {
    setConfirmOldClaimVisible(true);
  }

  const confirmClaim = async <A extends ConfirmTxModalArgs>(args: A) => {
    setConfirmClaimVisible(false);
    setClaiming(true);

    try {
      await poolMeta.contract.claim(args.gasPrice);
      fdtContract.loadBalance().catch(Error);
      (poolMeta.contract as YfPoolContract).loadUserData().catch(Error);
    } catch {}

    setClaiming(false);
  };

  const confirmOldClaim = async <A extends ConfirmTxModalArgs>(args: A) => {
    setConfirmOldClaimVisible(false);
    setOldClaiming(true);

    try {
      await poolMetaOld?.contract.claim(args.gasPrice);
      fdtContract.loadBalance().catch(Error);
      (poolMetaOld?.contract as YfPoolContract).loadUserData().catch(Error);
    } catch {}

    setOldClaiming(false);
  };

  const isEnded = poolMeta?.contract.isPoolEnded === true;

  return (
    <div className={cn(s.component, 'flex flow-row')}>
      <div className="card mb-24 sm-mb-16">
        <div className="card-header">
          <Text type="p1" weight="500" color="primary">
            My rewards
          </Text>
        </div>
        <div className="p-24">
          <div className="flex align-center justify-space-between mb-24">
            <Text type="small" weight="semibold" color="secondary">
              {FDTToken.symbol} balance
            </Text>
            <div className="flex align-center">
              <Icon width={16} height={16} name={FDTToken.icon!} className="mr-8" />
              <Text type="p1" weight="semibold" color="primary">
                {formatToken(fdtContract.balance?.unscaleBy(FDTToken.decimals)) ?? '-'}
              </Text>
            </div>
          </div>
          {!isEnded && !!lastActiveEpoch && (
            <div className="flex align-center justify-space-between">
              <Text type="small" weight="500" color="secondary">
                Potential reward this epoch
              </Text>
              <div className="flex align-center">
                <Icon width={16} height={16}  name={FDTToken.icon!}  className="mr-8" />
                <Text type="p1" weight="semibold" color="primary">
                  {formatToken(poolMeta.contract.potentialReward) ?? '-'}
                </Text>
              </div>
            </div>
          )}
        </div>
        {!!poolMetaOld && (
          <div className="p-4">
            <div className={cn('flex align-center justify-space-between', s.claimBlock)}>
              <div className="flex flow-row">
                <div className="flex align-center mb-4">
                  <Tooltip
                    title={
                      formatToken(poolMetaOld.contract.toClaim?.unscaleBy(FDTToken.decimals), {
                        decimals: FDTToken.decimals,
                      }) ?? '-'
                    }>
                    <Text
                      type="h2"
                      weight="semibold"
                      color="primary"
                      className="mr-8 text-ellipsis"
                      style={{ maxWidth: '120px' }}>
                      {formatToken(poolMetaOld.contract.toClaim?.unscaleBy(FDTToken.decimals), {
                        decimals: FDTToken.decimals,
                        compact: true
                      }) ?? '-'}
                    </Text>
                  </Tooltip>
                  <Icon name={FDTToken.icon!} width={24} height={24} />
                </div>
                <Text type="small" weight="500" color="secondary">
                  Current reward
                </Text>
              </div>
              <button
                type="button"
                className="button-primary"
                disabled={!poolMetaOld.contract.toClaim?.gt(BigNumber.ZERO) || oldClaiming}
                onClick={handleOldClaim}>
                {oldClaiming && <Spin spinning />}
                Claim old reward
              </button>
            </div>
          </div>
        )}
        <div className="p-4">
          <div className={cn('flex align-center justify-space-between', s.claimBlock)}>
            <div className="flex flow-row">
              <div className="flex align-center mb-4">
                <Tooltip
                  title={
                    formatToken(poolMeta.contract.toClaim?.unscaleBy(FDTToken.decimals), {
                      decimals: FDTToken.decimals,
                    }) ?? '-'
                  }>
                  <Text
                    type="h2"
                    weight="semibold"
                    color="primary"
                    className="mr-8 text-ellipsis"
                    style={{ maxWidth: '120px' }}>
                    {formatToken(poolMeta.contract.toClaim?.unscaleBy(FDTToken.decimals), {
                      decimals: FDTToken.decimals,
                      compact: true
                    }) ?? '-'}
                  </Text>
                </Tooltip>
                <Icon name={FDTToken.icon!} width={24} height={24} />
              </div>
              <Text type="small" weight="500" color="secondary">
                Current reward
              </Text>
            </div>
            <button
              type="button"
              className="button-primary"
              disabled={!poolMeta.contract.toClaim?.gt(BigNumber.ZERO) || claiming}
              onClick={handleClaim}>
              {claiming && <Spin spinning />}
              Claim reward
            </button>
          </div>
        </div>
      </div>

      <div className="card flex-grow">
        <div className="card-header">
          <Text type="p1" weight="500" color="primary">
            My stake
          </Text>
        </div>
        <div className="p-24">
          {poolMeta.tokens.length > 1 && (
            <ElasticTabs
              tabs={poolMeta.tokens.map(token => ({
                id: token.symbol,
                children: token.symbol,
              }))}
              activeKey={activeToken?.symbol!}
              onClick={handleTabSelect}
              variation="elastic"
              className="mb-32"
              style={{
                width: '100%',
                height: 40,
              }}
            />
          )}
          <div className="flex flow-row">
            <div className="flex align-center justify-space-between mb-24">
              <Text type="small" weight="500" color="secondary">
                Staked balance
              </Text>
              <Tooltip
                title={
                  formatUSD(
                    convertTokenInUSD(
                      selectedStakedToken?.nextEpochUserBalance?.unscaleBy(activeToken?.decimals),
                      activeToken?.symbol!,
                    ),
                  ) ?? '-'
                }>
                <Text type="p1" weight="semibold" color="primary">
                  {formatToken(selectedStakedToken?.nextEpochUserBalance?.unscaleBy(activeToken?.decimals), {
                    decimals: (activeToken?.decimals || 12) >= 6 ? 6 : activeToken?.decimals,
                  }) ?? '-'}
                </Text>
              </Tooltip>
            </div>

            {!!lastActiveEpoch && (
              <div className="flex align-center justify-space-between mb-24">
                <Text type="small" weight="500" color="secondary">
                  Effective Staked balance
                </Text>
                <Tooltip
                  title={
                    formatUSD(
                      convertTokenInUSD(
                        selectedStakedToken?.currentEpochUserBalance?.unscaleBy(activeToken?.decimals),
                        activeToken?.symbol!,
                      ),
                    ) ?? '-'
                  }>
                  <Text type="p1" weight="semibold" color="primary">
                    {formatToken(selectedStakedToken?.currentEpochUserBalance?.unscaleBy(activeToken?.decimals), {
                      decimals: (activeToken?.decimals || 12) >= 6 ? 6 : activeToken?.decimals,
                    }) ?? '-'}
                  </Text>
                </Tooltip>
              </div>
            )}

            <div className="flex align-center justify-space-between">
              <Text type="small" weight="500" color="secondary">
                Wallet balance
              </Text>
              <Tooltip
                title={
                  formatUSD(
                    convertTokenInUSD(activeContract.balance?.unscaleBy(activeToken?.decimals), activeToken?.symbol!),
                  ) ?? '-'
                }>
                <Text type="p1" weight="semibold" color="primary">
                  {formatToken(activeContract.balance?.unscaleBy(activeToken?.decimals), {
                    decimals: (activeToken?.decimals || 12) >= 6 ? 6 : activeToken?.decimals,
                  }) ?? '-'}
                </Text>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {confirmClaimVisible && (
        <TxConfirmModal
          title="Confirm your claim"
          header={
            <div className="flex col-gap-8 align-center justify-center">
              <Text type="h2" weight="500" color="primary">
                {formatToken(poolMeta.contract.toClaim?.unscaleBy(FDTToken.decimals)) ?? '-'}
              </Text>
              <Icon name={FDTToken.icon!} width={32} height={32} />
            </div>
          }
          submitText="Claim"
          onCancel={() => setConfirmClaimVisible(false)}
          onConfirm={confirmClaim}
        />
      )}
      {confirmOldClaimVisible && (
        <TxConfirmModal
          title="Confirm your claim"
          header={
            <div className="flex col-gap-8 align-center justify-center">
              <Text type="h2" weight="500" color="primary">
                {formatToken(poolMetaOld?.contract.toClaim?.unscaleBy(FDTToken.decimals)) ?? '-'}
              </Text>
              <Icon name={FDTToken.icon!} width={32} height={32} />
            </div>
          }
          submitText="Claim"
          onCancel={() => setConfirmOldClaimVisible(false)}
          onConfirm={confirmOldClaim}
        />
      )}
    </div>
  );
};

export default PoolStatistics;
