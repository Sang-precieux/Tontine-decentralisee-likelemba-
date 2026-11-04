export const CHAIN_ID = 11155111
export const CONTRACTS = {
  mockUSD: import.meta.env.VITE_MOCKUSD_ADDRESS || '0xB668C95fDa0fDaDa874dBE82f814F5E4a534fB50',
  likelemba: import.meta.env.VITE_LIKELEMBA_ADDRESS || '0x4610Fa7518636236b3d7A420EaA98D5b3cC45F20',
caisse: import.meta.env.VITE_CAISSE_ADDRESS || '0x14A7Cd98e92aCA05C4B12171067dDe7aaA64f21F',
}
export const RPC = import.meta.env.VITE_SEPOLIA_RPC || 'https://ethereum-sepolia-rpc.publicnode.com'
export const EXPLORER = 'https://sepolia.etherscan.io'
