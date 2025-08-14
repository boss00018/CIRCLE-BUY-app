import NetInfo from '@react-native-community/netinfo';

export function subscribeConnection(callback: (online: boolean) => void) {
  const unsub = NetInfo.addEventListener(state => {
    callback(Boolean(state.isConnected));
  });
  return unsub;
}