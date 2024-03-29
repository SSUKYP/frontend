import { useEffect } from 'react';
import { atom, SetterOrUpdater, useRecoilState } from 'recoil';
import ethereumProviderProxy from '../lib/ethereumProviderProxy';
import makeContract from '../lib/makeKsea';
import hasKaikas from '../lib/wallet/kaikas/hasKaikas';
import hasMetamask from '../lib/wallet/metamask/hasMetamask';
import useAuth from './authState';
import { useSignedWallet } from './signedWalletState';

const networkState = atom<KlaytnNetworkVersion | null>({
  key: 'networkState',
  default: null,
});

export function useWalletNetwork(): [
  KlaytnNetworkVersion,
  SetterOrUpdater<KlaytnNetworkVersion>
] {
  const signedWallet = useSignedWallet();
  const [networkVersion, setNetworkVersion] = useRecoilState(networkState);
  const { logout } = useAuth();

  useEffect(() => {
    const callback = function (
      newNetworkVersion: KlaytnNetworkVersion | string
    ) {
      if (typeof newNetworkVersion === 'string') {
        newNetworkVersion = Number.parseInt(newNetworkVersion);
      }
      if (networkVersion !== newNetworkVersion) {
        setNetworkVersion(newNetworkVersion);
      }
    };

    switch (signedWallet) {
      case 'KLAY': {
        if (!hasKaikas()) break;
        window.caver = new Caver(klaytn);
        window.ksea = makeContract();
        klaytn.on('networkChanged', callback);
        if (klaytn.networkVersion) {
          setNetworkVersion(klaytn.networkVersion);
        }
        return () => {
          klaytn.off('networkChanged', callback);
        };
      }

      case 'ETH': {
        if (!hasMetamask()) break;
        window.caver = new Caver(ethereumProviderProxy());
        window.ksea = makeContract();
        ethereum.on('chainChanged', callback);
        setNetworkVersion(Number.parseInt(ethereum.chainId));
        return () => {
          ethereum.removeListener('chainChanged', callback);
        };
      }

      default: {
        if (hasKaikas()) {
          window.caver = new Caver(klaytn);
        } else if (hasMetamask()) {
          window.caver = new Caver(ethereumProviderProxy());
        }
        window.ksea = makeContract();

        logout();
        return null;
      }
    }
  }, [networkVersion, setNetworkVersion, signedWallet, logout]);
  return [networkVersion, setNetworkVersion];
}
