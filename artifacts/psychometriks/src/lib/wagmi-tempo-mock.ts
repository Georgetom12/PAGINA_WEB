// Mock for @wagmi/core/tempo — not available in wagmi 2.x
// Required by @wagmi/connectors which imports tempoWallet from here
export const tempo = undefined;
export const tempoWallet = () => ({
  id: "tempo",
  name: "Tempo Wallet",
  type: "tempo",
  connect: async () => {},
  disconnect: async () => {},
  getAccounts: async () => [],
  getChainId: async () => 1,
  isAuthorized: async () => false,
  onAccountsChanged: () => {},
  onChainChanged: () => {},
  onDisconnect: () => {},
});
export default {};
