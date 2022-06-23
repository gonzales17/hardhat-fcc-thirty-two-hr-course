const { assert, expect } = require("chai");
const { BigNumber } = require("ethers");
const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const {
    developmentChains,
    networkConfig,
} = require("../../helper-hardhat-config");

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Lottery Staging Tests", function () {
          let lottery, deployer, lotteryEntranceFee, interval;

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer;
              lottery = await ethers.getContract("Lottery", deployer);
              lotteryEntranceFee = await lottery.getEntranceFee();
              interval = await lottery.getInterval();
          });

          describe("fulfill random words", function () {
              let startBalance = BigNumber.from("0");
              it("works with live ChainLink Keepers and ChainLink VRF", async function () {
                  const startTime = await lottery.getTimestamp();

                  await new Promise(async (resolve, reject) => {
                      lottery.once("WinnerPicked", async () => {
                          console.log("Winner Picked.");
                          try {
                              const winner = await lottery.getWinner();
                              const lotteryState =
                                  await lottery.getLotteryState();
                              const balance = await lottery.provider.getBalance(
                                  winner
                              );
                              const endTimestamp = await lottery.getTimestamp();
                              await expect(lottery.getPlayer(0)).to.be.reverted;
                              assert.equal(winner, deployer);
                              assert.equal(lotteryState, "0");
                              assert(balance.gt(startBalance));
                              assert(endTimestamp > startTime);
                              resolve();
                          } catch (e) {
                              console.log(e);
                              reject(e);
                          }
                      });

                      await lottery.enterLottery({ value: lotteryEntranceFee });
                      console.log("Entered lottery");
                      startBalance = await lottery.provider.getBalance(
                          deployer
                      );
                      console.log(startBalance);
                  });
              });
          });
      });
