const { network } = require("hardhat");
const {
    networkConfig,
    developmentChains,
} = require("../helper-hardhat-config.js");
const { verify } = require("../utils/verify.js");

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    let vrfCoordinatorV2Address, subscriptionId;

    if (developmentChains.includes(network.name)) {
        const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("2");
        const vrfCoordinatorV2Mock = await ethers.getContract(
            "VRFCoordinatorV2Mock"
        );
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
        const transactionResponse =
            await vrfCoordinatorV2Mock.createSubscription();

        const transactionReceipt = await transactionResponse.wait(1);
        subscriptionId = transactionReceipt.events[0].args.subId;

        // Fund the subscription (normally, you'd require real LINK)
        await vrfCoordinatorV2Mock.fundSubscription(
            subscriptionId,
            VRF_SUB_FUND_AMOUNT
        );
    } else {
        vrfCoordinatorV2Address =
            networkConfig[network.config.chainId]["vrfCoordinatorV2"];
        subscriptionId =
            networkConfig[network.config.chainId]["subscriptionId"];
    }

    const entranceFee = networkConfig[network.config.chainId]["entranceFee"];
    const gasLane = networkConfig[network.config.chainId]["gasLane"];
    const callbackGasLimit =
        networkConfig[network.config.chainId]["callbackGasLimit"];
    const interval = networkConfig[network.config.chainId]["interval"];
    const lottery = await deploy("Lottery", {
        from: deployer,
        args: [
            vrfCoordinatorV2Address,
            entranceFee,
            gasLane,
            subscriptionId,
            callbackGasLimit,
            interval,
        ],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        log("Verifying contract...");
        await verify(lottery.address, [
            vrfCoordinatorV2Address,
            entranceFee,
            gasLane,
            subscriptionId,
            callbackGasLimit,
            interval,
        ]);
    }
    log("---------------------------------------------------");
};

module.exports.tags = ["all", "lottery"];
