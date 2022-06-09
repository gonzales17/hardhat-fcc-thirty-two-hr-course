const { ethers, run, network } = require("hardhat");
require("dotenv").config();

async function main() {
    const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
    let contract = await SimpleStorage.attach(
        "0x3D493FF1270a1EDaFBa93605481D6a7131dF5638"
    );

    if (network.name === "rinkeby") {
        await readOnlyInteraction(contract);
    } else {
        contract = await SimpleStorage.deploy();

        let fave = await getFavoriteNumber(contract);
        console.log("Favorite number is", fave);

        let randomNum = getRandomNumber();
        console.log("Updating favorite number to", randomNum);
        let result = await setFavoriteNumber(contract, randomNum);
        fave = await getFavoriteNumber(contract);
        console.log("Favorite number is", fave);

        console.log("Adding 'Frankenstein'/711");
        result = await addPersonMemory(contract, "Frankenstein", 711);
        result = await getPerson(contract, 0);
        console.log(`Person at 0 is ${result}`);
    }
}

async function readOnlyInteraction(contract) {
    let result = await getPerson(contract, 0);
    console.log(`Person at 0 is ${result}`);
}

function getRandomNumber() {
    return Math.floor((Math.random() + 0.001) * 700);
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

async function getPerson(contract, index) {
    if (contract) {
        const result = await contract.people(index);
        return result;
    } else {
        console.log("Contract not defined!");
    }
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
