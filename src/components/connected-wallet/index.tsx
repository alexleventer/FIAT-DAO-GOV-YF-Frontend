import React from 'react';
import * as Antd from 'antd';
import { UnsupportedChainIdError } from '@web3-react/core';
import { NoEthereumProviderError } from '@web3-react/injected-connector';

import { useTheme } from 'components/theme-provider';
import ConnectWalletModal from 'components/connect-wallet-modal';
import UnsupportedChainModal from 'components/unsupported-chain-modal';
import InstallMetaMaskModal from 'components/install-metamask-modal';
import Identicon from 'components/identicon';
import ExternalLink from 'components/externalLink';

import { useWallet, WalletConnector, WalletConnectors } from 'web3/wallet';
import { getEtherscanAddressUrl, shortenAddr } from 'web3/utils';

import { ReactComponent as ZeroNotificationsSvg } from 'resources/svg/zero-notifications.svg';
import { ReactComponent as ZeroNotificationsDarkSvg } from 'resources/svg/zero-notifications-dark.svg';
import { ReactComponent as ChevronTopSvg } from 'resources/svg/icons/chevron-top.svg';
import { ReactComponent as BellSvg } from 'resources/svg/icons/bell.svg';
import { ReactComponent as GlobeSvg } from 'resources/svg/icons/globe.svg';
import { ReactComponent as WalletSvg } from 'resources/svg/icons/wallet.svg';
import { ReactComponent as NetworkSvg } from 'resources/svg/icons/network.svg';

import s from './styles.module.css';

const ConnectedWallet: React.FunctionComponent = props => {
  const { isDarkTheme } = useTheme();
  const wallet = useWallet();

  const [connectWalletVisible, setConnectWalletVisible] = React.useState<boolean>(false);
  const [unsupportedChainVisible, setUnsupportedChainVisible] = React.useState<boolean>(false);
  const [installMetaMaskVisible, setInstallMetaMaskVisible] = React.useState<boolean>(false);

  function handleConnectWallet() {
    setConnectWalletVisible(true);
  }

  function handleSwitchWallet() {
    setUnsupportedChainVisible(false);
    setConnectWalletVisible(true);
  }

  async function handleConnectorSelect(connector: WalletConnector) {
    setConnectWalletVisible(false);

    try {
      await wallet.connect(connector.id);
    } catch (error) {
      if (error instanceof UnsupportedChainIdError) {
        setUnsupportedChainVisible(true);
      } else if (error instanceof NoEthereumProviderError)
        setInstallMetaMaskVisible(true);
    }
  }

  function handleDisconnect() {
    wallet.disconnect();
  }

  if (!wallet.initialized) {
    return null;
  }

  return (
    <div className={s.component}>
      {!wallet.isActive ? (
        <>
          <Antd.Button type="primary" size="large" className={s.connectBtn} onClick={handleConnectWallet}>
            Connect Wallet
          </Antd.Button>

          <ConnectWalletModal
            visible={connectWalletVisible}
            connectors={WalletConnectors}
            onCancel={() => setConnectWalletVisible(false)}
            onConnectorSelect={handleConnectorSelect} />
          <UnsupportedChainModal
            visible={unsupportedChainVisible}
            onCancel={() => setUnsupportedChainVisible(false)}
            onSwitchWallet={handleSwitchWallet} />
          <InstallMetaMaskModal
            visible={installMetaMaskVisible}
            onCancel={() => setInstallMetaMaskVisible(false)}
          />
        </>
      ) : (
        <div className={s.walletBox}>
          <Antd.Popover
            overlayClassName={s.overlay}
            placement="bottomRight"
            content={
              <div>
                <Antd.Row className={s.notificationHeader}>
                  Notifications
                </Antd.Row>
                <Antd.Row className={s.notificationBody}>
                  <div className={s.notificationZero}>
                    {isDarkTheme ? <ZeroNotificationsDarkSvg /> : <ZeroNotificationsSvg />}
                    <span>There are no notifications to show</span>
                  </div>
                </Antd.Row>
              </div>
            }
            trigger="click"
          >
            <Antd.Badge className={s.notificationBtn} dot count={0} showZero={false}><BellSvg /></Antd.Badge>
          </Antd.Popover>
          <div className={s.divider} />
          <Antd.Popover
            overlayClassName={s.overlay}
            placement="bottomRight"
            content={
              <div>
                <Antd.Row className={s.walletHeader}>
                  <Antd.Col>
                    <Identicon address={wallet.account} className={s.walletAvatar} />
                  </Antd.Col>
                  <Antd.Col>
                    <ExternalLink
                      href={getEtherscanAddressUrl(wallet.account!)}
                      className={s.walletPreviewHash}
                    >{shortenAddr(wallet.account!, 8, 8)}</ExternalLink>
                  </Antd.Col>
                </Antd.Row>
                <div className={s.stats}>
                  <Antd.Row className={s.statRow}>
                    <Antd.Col>
                      <GlobeSvg className={s.statIcon} />
                    </Antd.Col>
                    <Antd.Col>
                      <span className={s.statName}>Status</span>
                    </Antd.Col>
                    <Antd.Col>
                      <Antd.Tag className={s.statTag}>Connected</Antd.Tag>
                    </Antd.Col>
                  </Antd.Row>
                  <Antd.Row className={s.statRow}>
                    <Antd.Col>
                      <WalletSvg className={s.statIcon} />
                    </Antd.Col>
                    <Antd.Col>
                      <span className={s.statName}>Wallet</span>
                    </Antd.Col>
                    <Antd.Col>
                      <span className={s.statValue}>{wallet.connector?.name}</span>
                    </Antd.Col>
                  </Antd.Row>
                  <Antd.Row className={s.statRow}>
                    <Antd.Col>
                      <NetworkSvg className={s.statIcon} />
                    </Antd.Col>
                    <Antd.Col>
                      <span className={s.statName}>Network</span>
                    </Antd.Col>
                    <Antd.Col>
                      <span className={s.statValue}>{wallet.networkName}</span>
                    </Antd.Col>
                  </Antd.Row>
                </div>
                <Antd.Row className={s.disconnectBtnRow}>
                  <Antd.Button
                    type="ghost"
                    className={s.disconnectBtn}
                    onClick={handleDisconnect}
                  >Disconnect</Antd.Button>
                </Antd.Row>
              </div>
            }
            trigger="click"
          >
            <Antd.Row className={s.walletPreview}>
              <Antd.Col>
                <Identicon address={wallet.account} className={s.walletPreviewAvatar} />
              </Antd.Col>
              <Antd.Col>
                <span className={s.walletPreviewHash}>{shortenAddr(wallet.account!, 4, 4)}</span>
              </Antd.Col>
              <Antd.Col>
                <ChevronTopSvg className={s.walletPreviewArrow} />
              </Antd.Col>
            </Antd.Row>
          </Antd.Popover>
        </div>
      )}
    </div>
  );
};

export default ConnectedWallet;
