const { assert, expect } = require("chai");
const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const {
    developmentChains,
    networkConfig,
} = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Lottery Unit Tests", function () {
          let lottery,
              vrfCoordinatorV2Mock,
              deployer,
              lotteryEntranceFee,
              interval;

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer;
              await deployments.fixture(["all"]); // deploy contracts
              lottery = await ethers.getContract("Lottery", deployer);
              vrfCoordinatorV2Mock = await ethers.getContract(
                  "VRFCoordinatorV2Mock",
                  deployer
              );
              lotteryEntranceFee = await lottery.getEntranceFee();
              interval = await lottery.getInterval();
          });

          describe("constructor", function () {
              it("initializes the lottery correctly", async function () {
                  const lotteryState = await lottery.getLotteryState();
                  assert.equal(lotteryState.toString(), "0");
                  const interval = await lottery.getInterval();
                  assert.equal(
                      interval.toString(),
                      networkConfig[network.config.chainId]["interval"]
                  );
              });
          });

          describe("enter lottery", function () {
              it("reverts when you don't pay enough", async function () {
                  await expect(
                      lottery.enterLottery({
                          value: ethers.utils.parseEther("0.0001"),
                      })
                  ).to.be.revertedWith("Lottery__InsufficientFundsForEntrace");
              });

              it("records players when they enter", async function () {
                  let response = await lottery.enterLottery({
                      value: lotteryEntranceFee,
                  });
                  await response.wait(1);
                  response = await lottery.getPlayer(0);
                  assert.equal(response, deployer);
                  response = await lottery.getNumberOfPlayers();
                  assert.equal(response, 1);
              });

              it("emits an event after player enters lottery", async function () {
                  await expect(
                      lottery.enterLottery({
                          value: lotteryEntranceFee,
                      })
                  ).to.emit(lottery, "LotteryEnter");
              });

              it("disallows lottery entrance when not open", async function () {
                  await lottery.enterLottery({ value: lotteryEntranceFee });
                  // simulates passage of time and mining of a block in that time
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ]);
                  await network.provider.send("evm_mine", []);
                  // pretend being a chainlink keeper
                  await lottery.performUpkeep([]);
                  await expect(
                      lottery.enterLottery({ value: lotteryEntranceFee })
                  ).to.be.revertedWith("Lottery__NotOpen");
              });
          });

          describe("checkUpkeep", function () {
              it("returns false if people haven't sent any ETH", async function () {
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ]);
                  await network.provider.send("evm_mine", []);
                  const { upkeepNeeded } = await lottery.callStatic.checkUpkeep(
                      []
                  );
                  assert(!upkeepNeeded);
              });

              it("returns false if lottery not open", async function () {
                  await lottery.enterLottery({ value: lotteryEntranceFee });
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ]);
                  await network.provider.send("evm_mine", []);
                  await lottery.performUpkeep([]);
                  const lotteryState = await lottery.getLotteryState();
                  const { upkeepNeeded } = await lottery.callStatic.checkUpkeep(
                      []
                  );
                  assert.equal(lotteryState.toString(), "1");
                  assert.equal(upkeepNeeded, false);
              });

              it("returns false if enough time hasn't passed", async function () {
                  await lottery.enterLottery({ value: lotteryEntranceFee });
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() - 5,
                  ]);
                  await network.provider.send("evm_mine", []);
                  const { upkeepNeeded } = await lottery.callStatic.checkUpkeep(
                      []
                  );
                  assert(!upkeepNeeded);
              });

              it("returns true if enough time has passed, has players and eth, and is open", async function () {
                  await lottery.enterLottery({ value: lotteryEntranceFee });
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ]);
                  await network.provider.send("evm_mine", []);
                  const { upkeepNeeded } = await lottery.callStatic.checkUpkeep(
                      []
                  );
                  assert(upkeepNeeded);
              });
          });

          describe("performUpkeep", function () {
              it("it only runs if checkUpkeep is true", async function () {
                  await lottery.enterLottery({ value: lotteryEntranceFee });
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ]);
                  await network.provider.send("evm_mine", []);
                  const tx = await lottery.performUpkeep([]);
                  assert(tx);
              });

              it("reverts when checkUpkeep is false", async function () {
                  await lottery.enterLottery({ value: lotteryEntranceFee });
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() - 5,
                  ]);
                  await network.provider.send("evm_mine", []);
                  await expect(lottery.performUpkeep([])).to.be.revertedWith(
                      "Lottery__UpkeepNotNeeded"
                  );
              });

              it("updates the lottery state, emits an event, and calls vrfCoordinator", async function () {
                  await lottery.enterLottery({ value: lotteryEntranceFee });
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ]);
                  await network.provider.send("evm_mine", []);
                  const txResponse = await lottery.performUpkeep([]);
                  const txReceipt = await txResponse.wait(1);
                  const requestId = txReceipt.events[1].args.requestId; // vrf emits its own event, then we emit ours
                  assert(requestId.toNumber() > 0);
                  const lottoState = await lottery.getLotteryState();
                  assert.equal(lottoState.toString(), "1");
              });
          });

          describe("fulfill random words", function () {
              beforeEach(async function () {
                  await lottery.enterLottery({ value: lotteryEntranceFee });
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ]);
                  await network.provider.send("evm_mine", []);
              });
              it("can only be called after performUpkeep", async function () {
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(
                          0,
                          lottery.address
                      )
                  ).to.be.revertedWith("nonexistent request");
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(
                          1,
                          lottery.address
                      )
                  ).to.be.revertedWith("nonexistent request");
              });
              it("picks a winner, resets the state, and sends money", async function () {
                  const additionalEntrants = 3;
                  const startingAccountIndex = 1;
                  const accounts = await ethers.getSigners();
                  let accountBalances = {};
                  for (
                      let i = startingAccountIndex;
                      i < additionalEntrants + startingAccountIndex;
                      i++
                  ) {
                      let acctConnectedLottery = lottery.connect(accounts[i]);
                      await acctConnectedLottery.enterLottery({
                          value: lotteryEntranceFee,
                      });
                      let balance = await lottery.provider.getBalance(
                          accounts[i].address
                      );
                      accountBalances[accounts[i].address] = balance;
                  }
                  let startingTimestamp = await lottery.getTimestamp();
                  await new Promise(async (resolve, reject) => {
                      // setup a listener for the "WinnerPicked" event and do the test verifications
                      lottery.once("WinnerPicked", async () => {
                          try {
                              const winner = await lottery.getWinner();
                              const lotteryState =
                                  await lottery.getLotteryState();
                              const endingTimestamp =
                                  await lottery.getTimestamp();
                              const numPlayers =
                                  await lottery.getNumberOfPlayers();
                              const endingBalance =
                                  await lottery.provider.getBalance(winner);
                              const startBalance = accountBalances[winner];

                              assert.equal(numPlayers, 0);
                              assert.equal(lotteryState.toString(), "0");
                              assert(endingTimestamp > startingTimestamp);
                              assert.equal(
                                  endingBalance.toString(),
                                  startBalance
                                      .add(
                                          lotteryEntranceFee
                                              .mul(additionalEntrants)
                                              .add(lotteryEntranceFee)
                                      )
                                      .toString()
                              );
                          } catch (e) {
                              reject(e);
                          }
                          resolve();
                      });

                      // trigger WinnerPicked event
                      const tx = await lottery.performUpkeep([]);
                      const txReceipt = await tx.wait(1);
                      await vrfCoordinatorV2Mock.fulfillRandomWords(
                          txReceipt.events[1].args.requestId,
                          lottery.address
                      );
                  });
              });
          });
      });
