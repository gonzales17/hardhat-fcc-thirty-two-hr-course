// everything in 'deploy' directory gets run when we execute 'yarn hardhat deploy'
// typically, you number the deploy scripts in the order you want them run

const { network, getUnnamedAccounts, ethers } = require("hardhat");
const {
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
} = require("../helper-hardhat-config");

// below is shortcut for:
// module.exports = async(hre) => {
//     const {getNamedAccounts, deployments} = hre
// }
// hardhat-deploy calls the function below, providing the hre
// as an argument.
module.exports = async ({ getNamedAccounts, deployments }) => {
    // deploy and log are two functions (among many) on deployments object
    const { deploy, log } = deployments;

    // namedAccounts are specified in hardhat.config.js
    const { deployer } = await getNamedAccounts();

    // without any arguments, 'yarn hardhat deploy' runs on network 'hardhat'
    // so if we're running on one of the dev chains, deploy the mock contract
    if (developmentChains.includes(network.name)) {
        log("Local network detected! Deploying mocks...");
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true, // causes informational messages to be printed to console during deployment
            args: [DECIMALS, INITIAL_ANSWER], // contract's constructor args
        });
        log("Mocks deployed.");
    }
};

module.exports.tags = ["all", "mocks"];
