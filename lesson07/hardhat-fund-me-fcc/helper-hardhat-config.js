// map chainId to its ETH-USD price feed contract address
const NETWORK_CONFIG = {
    4: {
        name: "rinkeby",
        ethUsdPriceFeedAddress: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
    },
    42: {
        name: "kovan",
        ethUsdPriceFeedAddress: "0x9326BFA02ADD2366b30bacB125260Af641031331",
    },
    43114: {
        name: "avalanche",
        ethUsdPriceFeedAddress: "0x976B3D034E162d8bD72D6b9C989d545b839003b0",
    },
};

const developmentChains = ["hardhat", "localhost"];

// parameters for the mock price feed contract
const DECIMALS = 8;
const INITIAL_ANSWER = 1800e8;

module.exports = {
    NETWORK_CONFIG,
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
};
