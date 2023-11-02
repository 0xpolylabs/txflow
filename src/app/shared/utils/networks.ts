export enum ChainID {
  ETHEREUM_MAINNET = 1,
  SEPOLIA_TESTNET = 11155111,
  MANTLE_MAINNET = 5000,
  MANTLE_TESTNET = 5001,
}

export interface Network {
  chainID: ChainID,
  name: string,
  shortName: string,
  nativeCurrency: {
    name: string,
    symbol: string;
  },
  maxGasPrice: number,
  rpcURLs: string[],
  wssRpcURLs?: string[],
  explorerURLs: string[],
}

export const MantleNetwork: Network = {
  chainID: ChainID.MANTLE_MAINNET,
  name: 'Mantle',
  shortName: 'mantle',
  nativeCurrency: {
    name: 'MNT',
    symbol: 'MNT',
  },
  maxGasPrice: 1,
  rpcURLs: ['https://rpc.mantle.xyz'],
  wssRpcURLs: [
    'wss://mantle.publicnode.com',
  ],
  explorerURLs: ['https://explorer.mantle.xyz/'],
}

export const MantleTestnetNetwork: Network = {
  chainID: ChainID.MANTLE_TESTNET,
  name: 'Mantle (testnet)',
  shortName: 'mantle-testnet',
  nativeCurrency: {
    name: 'MNT',
    symbol: 'MNT',
  },
  maxGasPrice: 1,
  rpcURLs: ['https://rpc.testnet.mantle.xyz'],
  wssRpcURLs: [],
  explorerURLs: ['https://explorer.testnet.mantle.xyz/'],
}

export const SepoliaNetwork: Network = {
  chainID: ChainID.SEPOLIA_TESTNET,
  name: 'Sepolia (testnet)',
  shortName: 'sepolia',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
  },
  maxGasPrice: 20,
  rpcURLs: ['https://ethereum-sepolia.publicnode.com'],
  wssRpcURLs: [
    'wss://ethereum-sepolia.publicnode.com',
  ],
  explorerURLs: ['https://sepolia.etherscan.io/'],
}

export const EthereumNetwork: Network = {
  chainID: ChainID.ETHEREUM_MAINNET,
  name: 'Ethereum',
  shortName: 'ethereum',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
  },
  maxGasPrice: 20,
  rpcURLs: ['https://mainnet.infura.io/v3/'],
  wssRpcURLs: [
    'wss://mainnet.infura.io/ws/v3/',
  ],
  explorerURLs: ['https://etherscan.io/'],
}

export const Networks: { [key in ChainID]: Network } = {
  [ChainID.SEPOLIA_TESTNET]: SepoliaNetwork,
  [ChainID.ETHEREUM_MAINNET]: EthereumNetwork,
  [ChainID.MANTLE_MAINNET]: MantleNetwork,
  [ChainID.MANTLE_TESTNET]: MantleTestnetNetwork
}
