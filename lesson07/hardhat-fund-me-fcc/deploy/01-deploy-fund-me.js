//
//module.exports = async (hre) => {
//   const { getNamedAccounts, deployments } = hre;

const { network } = require("hardhat");
const {
    NETWORK_CONFIG,
    developmentChains,
} = require("../helper-hardhat-config.js");
// above is shorthand for:
// const helperConfig = require("../helper-hardhat-config.js");
// const networkConfig = helperConfig.NETWORK_CONFIG;
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    let ethUsdPriceFeedAddr;

    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator");
        ethUsdPriceFeedAddr = ethUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddr =
            NETWORK_CONFIG[network.config.chainId]["ethUsdPriceFeedAddress"];
    }

    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: [ethUsdPriceFeedAddr], // contract constructor args
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, [ethUsdPriceFeedAddr]);
    }
    log("---------------end deploy-fund-me.js---------------");
};

module.exports.tags = ["all", "fundme"];
