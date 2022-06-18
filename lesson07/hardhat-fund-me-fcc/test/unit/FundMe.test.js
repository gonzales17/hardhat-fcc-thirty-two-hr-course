const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts, network } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

// run this script only on local networks
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe;
          let deployer, signer1, signer2;
          let mockV3Aggregator;
          let provider;

          beforeEach(async function () {
              // you can also get accounts via await ethers.getSigners(), which will give you
              // the accounts specified in hardhat.config under "networks".<test_network>."accounts",
              // or the list of 10 "fake" accounts if you're using hardhat network
              let namedAccounts = await getNamedAccounts();
              deployer = namedAccounts.deployer;
              let signers = await ethers.getSigners();
              signer1 = signers[0]; // same as deployer
              signer2 = signers[1];
              await deployments.fixture(["all"]);
              // get contract and also connect acct deployer to it
              fundMe = await ethers.getContract("FundMe", deployer);
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              );
          });

          describe("constructor", function () {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.priceFeed();
                  assert.equal(response, mockV3Aggregator.address);
              });

              it("sets the owner to the deployer", async function () {
                  const response = await fundMe.getOwner();
                  assert.equal(response, deployer);
              });
          });

          /* TODO: write tests for receive and fallback */
          describe("fallback and receive", function () {
              it("calls receive", async function () {
                  const initBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const result = await signer1.sendTransaction({
                      to: fundMe.address,
                      value: "5000000000000000000",
                  });
                  await result.wait(1);
                  const finalBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  assert.equal(
                      "5000000000000000000",
                      (finalBalance - initBalance).toString()
                  );
              });

              it("calls fallback", async function () {
                  await expect(
                      signer1.sendTransaction({
                          to: fundMe.address,
                          value: "5000000000000000000",
                          data: "0x01",
                      })
                  ).to.be.revertedWith("You called fallback");
              });
          });

          describe("fund", function () {
              it("Fails if you don't send enough ETH", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "Must send at least $50 in ETH"
                  );
              });
              it("Updates amount funded data structure", async function () {
                  await fundMe.fund({ value: ethers.utils.parseEther("1") });
                  const response = await fundMe.getAddressToDonations(deployer);
                  assert.equal(
                      response.toString(),
                      ethers.utils.parseEther("1"),
                      "Amounts not equal!"
                  );
              });
              it("Adds funder to array", async function () {
                  await fundMe.fund({ value: ethers.utils.parseEther("1") });
                  const response = await fundMe.funders(0);
                  assert.equal(
                      response.toString(),
                      deployer.toString(),
                      "Address of funder doesn't match"
                  );
              });
          });

          describe("withdraw", function () {
              let signer2FundMe;

              beforeEach(async function () {
                  await fundMe.fund({ value: ethers.utils.parseEther("1") });
                  signer2FundMe = await fundMe.connect(signer2);
                  await signer2FundMe.fund({
                      value: ethers.utils.parseEther("10"),
                  });
              });

              it("Verifies contract's addressToDonations before withdrawal", async function () {
                  let amount = await fundMe.getAddressToDonations(deployer);
                  assert.equal(amount, 1e18);
                  amount = await fundMe.getAddressToDonations(signer2.address);
                  assert.equal(amount, 10e18);
              });

              it("Verifies contract's funders before withdrawal", async function () {
                  let response = await fundMe.funders(0);
                  assert.equal(deployer, response);
                  response = await fundMe.funders(1);
                  assert.equal(signer2.address, response);
              });

              it("Updates account's balance after withdrawal", async function () {
                  const initialDeployerBalance =
                      await fundMe.provider.getBalance(deployer);
                  const initialContractBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const response = await fundMe.withdraw();
                  const receipt = await response.wait(1);
                  const { gasUsed, effectiveGasPrice } = receipt;
                  const finalDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  );
                  const gasSpent = gasUsed.mul(effectiveGasPrice);
                  const amountReceivedByDeployer = finalDeployerBalance
                      .add(gasSpent)
                      .sub(initialDeployerBalance);
                  assert.isTrue(
                      amountReceivedByDeployer.eq(initialContractBalance)
                  );
              });

              it("Updates contract's addressToDonations after withdrawal", async function () {
                  await fundMe.withdraw();

                  // after withdrawal, contract's addressToDonations amounts should be reset to 0
                  let amount = await fundMe.getAddressToDonations(deployer);
                  assert.equal(0, amount);
                  amount = await fundMe.getAddressToDonations(signer2.address);
                  assert.equal(0, amount);
              });

              it("Updates contract's list of funders after withdrawal", async function () {
                  await fundMe.withdraw();
                  // after withdrawal, no funders should exist
                  await expect(fundMe.funders(0)).to.be.reverted;
                  await expect(fundMe.funders(1)).to.be.reverted;
              });

              it("Only allows owner to withdraw", async function () {
                  await expect(signer2FundMe.withdraw()).to.be.revertedWith(
                      "FundMe__Unauthorized"
                  );
              });

              // ##############################################################################
              it("Updates account's balance after cheaper withdrawal", async function () {
                  const initialDeployerBalance =
                      await fundMe.provider.getBalance(deployer);
                  const initialContractBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const response = await fundMe.cheaperWithdraw();
                  const receipt = await response.wait(1);
                  const { gasUsed, effectiveGasPrice } = receipt;
                  const finalDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  );
                  const gasSpent = gasUsed.mul(effectiveGasPrice);
                  const amountReceivedByDeployer = finalDeployerBalance
                      .add(gasSpent)
                      .sub(initialDeployerBalance);
                  assert.isTrue(
                      amountReceivedByDeployer.eq(initialContractBalance)
                  );
              });

              it("Updates contract's addressToDonations after cheaper withdrawal", async function () {
                  await fundMe.cheaperWithdraw();

                  // after withdrawal, contract's addressToDonations amounts should be reset to 0
                  let amount = await fundMe.getAddressToDonations(deployer);
                  assert.equal(0, amount);
                  amount = await fundMe.getAddressToDonations(signer2.address);
                  assert.equal(0, amount);
              });

              it("Updates contract's list of funders after cheaper withdrawal", async function () {
                  await fundMe.cheaperWithdraw();
                  // after withdrawal, no funders should exist
                  await expect(fundMe.funders(0)).to.be.reverted;
                  await expect(fundMe.funders(1)).to.be.reverted;
              });

              it("Only allows owner to cheaper withdraw", async function () {
                  await expect(
                      signer2FundMe.cheaperWithdraw()
                  ).to.be.revertedWith("FundMe__Unauthorized");
              });
          });
      });
