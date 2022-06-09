const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleStorage", function () {
    let SimpleStorageFactory, contract;

    before(async function () {
        SimpleStorageFactory = await ethers.getContractFactory("SimpleStorage");
        contract = await SimpleStorageFactory.deploy();
        expect(contract).to.not.be.undefined;
    });

    it("Should start with favorite number of 0", async function () {
        const result = await contract.retrieve_fave_number();
        expect(result).to.equal(0);
    });

    it("Should update favorite number", async function () {
        const result = await contract.store(777);
        await result.wait(1);
        const readValue = await contract.retrieve_fave_number();
        expect(readValue).to.equal(777);
    });

    it("Should start with 0 people", async function () {
        expect(contract.people(0)).to.be.revertedWith("call revert exception");
    });

    it("Should start with favoriteNumber of 0 for specific person", async function () {
        const result = await contract.nameToFavoriteNumber("Felix");
        expect(result).to.equal(0);
    });

    it("Should add a person via memory", async function () {
        let result = await contract.addPersonMemory(["Felix", 1099]);
        result.wait(1);
        result = await contract.nameToFavoriteNumber("Felix");
        expect(result).to.equal(1099);
        let [name, num] = await contract.people(0);
        expect(name).to.equal("Felix");
        expect(num).to.equal(1099);
    });

    it("Should add a person via calldata", async function () {
        let result = await contract.addPersonCalldata(["Alexa", 3377]);
        result.wait(1);
        result = await contract.nameToFavoriteNumber("Alexa");
        expect(result).to.equal(3377);
        let [name, num] = await contract.people(1);
        expect(name).to.equal("Alexa");
        expect(num).to.equal(3377);
    });
});
