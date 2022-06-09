const { ethers, run, network } = require("hardhat");
require("dotenv").config();

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    console.log("Account balance: ", (await deployer.getBalance()).toString());
    const contract = await deploySimpleStorage();
    await verify(contract, []);
    let favoriteNumber = await getFavoriteNumber(contract);
    console.log(`Favorite number is ${favoriteNumber}`);
    let rando = Math.floor((Math.random() + 0.01) * 500);
    console.log(`Setting favorite number to ${rando}`);
    let result = await setFavoriteNumber(contract, rando);
    await result.wait(1);
    favoriteNumber = await getFavoriteNumber(contract);
    console.log(`Favorite number is ${favoriteNumber}`);
    await addPersonMemory(contract, "Frankenstein", 711);
    result = await getPerson(contract, 0);
    console.log(`Person 0 is ${result}`);
}

async function deploySimpleStorage() {
    const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
    const ss = await SimpleStorage.deploy();
    console.log("SimpleStorage address:", ss.address);
    return ss;
}

async function deployToken() {
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy();
    console.log("Token address:", token.address);
}

async function verify(contract, args) {
    if (
        contract &&
        process.env.ETHERSCAN_API_KEY &&
        network.config.chainId != 31337
    ) {
        console.log("Verifying contract...");
        await contract.deployTransaction.wait(6);
        const contractAddress = contract.address;
        try {
            await run("verify:verify", {
                address: contractAddress,
                constructorArguments: args,
            });
        } catch (e) {
            console.log(e);
        }
    } else {
        console.log(`Contract: ${contract}`);
    }
}

async function getFavoriteNumber(contract) {
    if (contract) {
        const faveNumber = await contract.retrieve_fave_number();
        return faveNumber;
    } else {
        console.log("Contract not defined!");
    }
}

async function setFavoriteNumber(contract, a_number) {
    if (contract) {
        const result = await contract.store(a_number);
        return result;
    } else {
        console.log("Contract not defined!");
    }
}

async function addPersonMemory(contract, name, number) {
    if (contract) {
        const result = await contract.addPersonMemory({
            name: name,
            favoriteNumber: number,
        });
        await result.wait(1);
    } else {
        console.log("Contract not defined!");
    }
}

async function addPersonCalldata(contract, name, number) {
    if (contract) {
        const result = await contract.addPersonCalldata([name, number]);
        await result.wait(1);
    } else {
        console.log("Contract not defined!");
    }
}

async function getPerson(contract, index) {
    if (contract) {
        const result = await contract.people(index);
        return result;
    } else {
        console.log("Contract not defined!");
    }
}

main()
    .then(() => process.exit())
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
