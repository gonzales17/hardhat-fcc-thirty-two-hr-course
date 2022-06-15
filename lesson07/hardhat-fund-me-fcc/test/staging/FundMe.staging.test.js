const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts, network } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

// don't run this script on local networks
developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe;
          let deployer;

          before(async function () {
              deployer = (await getNamedAccounts()).deployer;
              fundMe = await ethers.getContract("FundMe", deployer);
          });

          it("allows people to fund", async function () {
              let result = await fundMe.fund({
                  value: ethers.utils.parseEther("0.1"),
              });
              result.wait(1);
              result = await fundMe.withdraw();
              result.wait(1);
              const endingBalance = await fundMe.provider.getBalance(
                  fundMe.address
              );
              assert.isTrue(endingBalance == 0);
          });
      });
