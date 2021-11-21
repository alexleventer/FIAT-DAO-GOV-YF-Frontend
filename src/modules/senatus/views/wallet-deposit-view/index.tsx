import React from 'react';
import { isMobile } from 'react-device-detect';
import AntdForm from 'antd/lib/form';
import AntdSwitch from 'antd/lib/switch';
import BigNumber from 'bignumber.js';
import cn from 'classnames';
import { ZERO_BIG_NUMBER, formatEntrValue } from 'web3/utils';

import Alert from 'components/antd/alert';
import Button from 'components/antd/button';
import Form from 'components/antd/form';
import GasFeeList from 'components/custom/gas-fee-list';
import Grid from 'components/custom/grid';
import Icon from 'components/custom/icon';
import TokenAmount from 'components/custom/token-amount';
import { Text } from 'components/custom/typography';
import { FDTToken } from 'components/providers/known-tokens-provider';
import useMergeState from 'hooks/useMergeState';

import config from '../../../../config';
import Erc20Contract from '../../../../web3/erc20Contract';
import { useDAO } from '../../components/dao-provider';
import WalletDepositConfirmModal from './components/wallet-deposit-confirm-modal';

import s from './s.module.scss';

type DepositFormData = {
  amount?: BigNumber;
  gasPrice?: {
    value: number;
  };
};

const InitialFormValues: DepositFormData = {
  amount: undefined,
  gasPrice: undefined,
};

type WalletDepositViewState = {
  showDepositConfirmModal: boolean;
  enabling: boolean;
  enabled?: boolean;
  saving: boolean;
  expanded: boolean;
};

const InitialState: WalletDepositViewState = {
  showDepositConfirmModal: false,
  enabling: false,
  enabled: undefined,
  saving: false,
  expanded: false,
};

const WalletDepositView: React.FC = () => {
  const daoCtx = useDAO();
  const [form] = AntdForm.useForm<DepositFormData>();

  const [state, setState] = useMergeState<WalletDepositViewState>(InitialState);

  const { balance: stakedBalance, userLockedUntil } = daoCtx.daoComitium;
  const fdtBalance = (FDTToken.contract as Erc20Contract).balance?.unscaleBy(FDTToken.decimals);
  const comitiumAllowance = (FDTToken.contract as Erc20Contract).getAllowanceOf(config.contracts.dao.comitium);
  const isLocked = (userLockedUntil ?? 0) > Date.now();

  async function handleSwitchChange(checked: boolean) {
    setState({ enabling: true });

    try {
      await (FDTToken.contract as Erc20Contract).approve(checked, config.contracts.dao.comitium);
    } catch (e) {
      console.error(e);
    }

    setState({ enabling: false });
  }

  async function handleSubmit(values: DepositFormData) {
    const { amount, gasPrice } = values;

    if (!amount || !gasPrice) {
      return;
    }

    setState({ saving: true });

    try {
      await daoCtx.daoComitium.actions.deposit(amount, gasPrice.value);
      form.setFieldsValue(InitialFormValues);
      daoCtx.daoComitium.reload();
      (FDTToken.contract as Erc20Contract).loadBalance().catch(Error);
    } catch {}

    setState({ saving: false });
  }

  function handleFinish(values: DepositFormData) {
    if (isLocked) {
      setState({ showDepositConfirmModal: true });
      return;
    }

    handleSubmit(values);
  }

  React.useEffect(() => {
    const isEnabled = comitiumAllowance?.gt(ZERO_BIG_NUMBER) ?? false;

    setState({
      enabled: isEnabled,
      expanded: isEnabled,
    });
  }, [comitiumAllowance]);

  return (
    <div className={cn('card', s.card)}>
      <Grid gap={24} className={cn('card-header', s.cardHeader)}>
        <Grid flow="col" gap={12} align="center">
          <Icon name="png/fiat-dao" width={27} height={27} />
          <Text type="p1" weight="semibold" color="primary">
            {FDTToken.symbol}
          </Text>
        </Grid>

        <Grid flow="row" gap={4}>
          <Text type="small" weight="500" color="secondary">
            Staked Balance
          </Text>
          <Text type="p1" weight="semibold" color="primary">
            {formatEntrValue(stakedBalance)}
          </Text>
        </Grid>

        <Grid flow="row" gap={4}>
          <Text type="small" weight="500" color="secondary">
            Wallet Balance
          </Text>
          <Text type="p1" weight="semibold" color="primary">
            {formatEntrValue(fdtBalance)}
          </Text>
        </Grid>

        <Grid flow="row" gap={4}>
          <Text type="small" weight="500" color="secondary">
            Enable Token
          </Text>
          <AntdSwitch
            style={{ justifySelf: 'flex-start' }}
            checked={state.enabled}
            loading={state.enabled === undefined || state.enabling}
            onChange={handleSwitchChange}
          />
        </Grid>

        {state.enabled && !isMobile && (
          <button
            type="button"
            className="button-ghost-monochrome p-8"
            onClick={() =>
              setState(prevState => ({
                ...prevState,
                expanded: !prevState.expanded,
              }))
            }>
            <Icon name="chevron-right" rotate={state.expanded ? 270 : 0} />
          </button>
        )}
      </Grid>

      {state.expanded && (
        <Form
          className={cn('p-24', s.cardForm)}
          form={form}
          initialValues={InitialFormValues}
          validateTrigger={['onSubmit']}
          onFinish={handleFinish}>
          <Grid flow="row" gap={32}>
            <Grid className={s.cardCont}>
              <Grid flow="row" gap={32}>
                <Form.Item name="amount" label="Amount" rules={[{ required: true, message: 'Required' }]}>
                  <TokenAmount
                    tokenIcon={FDTToken.icon}
                    max={fdtBalance}
                    maximumFractionDigits={FDTToken.decimals}
                    name={FDTToken.symbol}
                    displayDecimals={4}
                    disabled={state.saving}
                    slider
                  />
                </Form.Item>
                <Alert message="Deposits made after you have an ongoing lock will be added to the locked balance and will be subjected to the same lock timer." />
              </Grid>
              <Grid flow="row">
                <Form.Item
                  name="gasPrice"
                  label="Gas Fee (Gwei)"
                  hint="This value represents the gas price you're willing to pay for each unit of gas. Gwei is the unit of ETH typically used to denominate gas prices and generally, the more gas fees you pay, the faster the transaction will be mined."
                  rules={[{ required: true, message: 'Required' }]}>
                  <GasFeeList disabled={state.saving} />
                </Form.Item>
              </Grid>
            </Grid>
            <button type="submit" className="button-primary" disabled={state.saving} style={{ justifySelf: 'start' }}>
              Deposit
            </button>
          </Grid>
        </Form>
      )}

      {state.showDepositConfirmModal && (
        <WalletDepositConfirmModal
          deposit={form.getFieldsValue().amount}
          lockDuration={userLockedUntil}
          onCancel={() => setState({ showDepositConfirmModal: false })}
          onOk={() => {
            setState({ showDepositConfirmModal: false });
            return handleSubmit(form.getFieldsValue());
          }}
        />
      )}
    </div>
  );
};

export default WalletDepositView;
