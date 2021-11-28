import React, { FC, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BigNumber from 'bignumber.js';
import cn from 'classnames';
import { formatNumber, formatPercent, formatUSD } from 'web3/utils';

import Icon, { IconNames } from 'components/custom/icon';
import IconsSet from 'components/custom/icons-set';
import { Text } from 'components/custom/typography';
import { KnownTokens } from 'components/providers/known-tokens-provider';
import { convertTokenInUSD } from 'components/providers/known-tokens-provider';

import { useYFPool } from '../../providers/pool-provider';

import s from './s.module.scss';
import { YFPoolID } from '../../providers/pools-provider';

const PoolHeader: FC = () => {
  const yfPoolCtx = useYFPool();

  const { poolMeta, poolBalance, effectivePoolBalance } = yfPoolCtx;

  useEffect(() => {
    document.documentElement.scrollTop = 0;
  }, []);

  if (!poolMeta) {
    return null;
  }

  const apr =
    poolBalance?.isGreaterThan(BigNumber.ZERO) && poolMeta?.contract.epochReward
      ? convertTokenInUSD(poolMeta?.contract.epochReward * 52, KnownTokens.FDT)?.dividedBy(poolBalance)
      : undefined;

  return (
    <>
      <Link to="/rewards" className="flex inline align-center mb-16 sm-mb-8">
        <Icon name="arrow-back" width={18} height={18} className="mr-8" />
        <Text type="p1" weight="500" color="secondary">
          Pools
        </Text>
      </Link>
      <div className="flex align-center mb-40 sm-mb-24">
        <IconsSet
          icons={poolMeta.icons.map(icon => (
            <Icon key={icon} name={icon as IconNames} width={40} height={40} />
          ))}
          className="mr-16"
        />
        <div>
          <Text type="p1" weight="500" color="primary" className="mb-4">
            {poolMeta.label}
          </Text>
          <Text type="small" weight="semibold" color="primary">
            Epoch {poolMeta?.contract?.lastActiveEpoch && poolMeta.name === YFPoolID.wsOHM_FDT_SLP
            ? (poolMeta.contract.lastActiveEpoch as number) + 2 : poolMeta.contract.lastActiveEpoch ?? '-'}
            /{poolMeta?.contract?.totalEpochs && poolMeta.name === YFPoolID.wsOHM_FDT_SLP ? 4 : poolMeta.contract.totalEpochs ?? '-'}
          </Text>
        </div>
      </div>
      <div className={cn('card p-24 flex col-gap-48 mb-24', s.card)}>
        <div>
          <Text type="small" weight="500" color="secondary" className="mb-8">
            APR
          </Text>
          <div className="flex align-center">
            <Text type="p1" weight="500" color="primary">
              {formatPercent(apr) ?? '-'}
            </Text>
          </div>
        </div>
        <div>
          <Text type="small" weight="500" color="secondary" className="mb-8">
            Pool balance
          </Text>
          <Text type="p1" weight="semibold" color="primary">
            {formatUSD(poolBalance) ?? '-'}
          </Text>
        </div>
        {!!poolMeta.contract.lastActiveEpoch && (
          <div>
            <Text type="small" weight="500" color="secondary" className="mb-8">
              Effective pool balance
            </Text>
            <Text type="p1" weight="semibold" color="primary">
              {formatUSD(effectivePoolBalance) ?? '-'}
            </Text>
          </div>
        )}
        <div>
          <Text type="small" weight="500" color="secondary" className="mb-8">
            Epoch rewards
          </Text>
          <div className="flex align-center">
            <Icon name="png/fiat-dao" width={16} height={16} className="mr-8" />
            <Text type="p1" weight="semibold" color="primary">
              {formatNumber(poolMeta.contract.epochReward) ?? '-'}
            </Text>
          </div>
        </div>
      </div>
    </>
  );
};

export default PoolHeader;
