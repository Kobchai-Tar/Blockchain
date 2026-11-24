import { expect } from "chai";
import { network } from "hardhat";
// const Product = require("../ignition/modules/product.json");
const Product = {
  "Brand": "Iphone 99 Pro Max",
  "SerialNumber": "IP99PM2024",
  "Duration": 2
};

const { ethers } = await network.create();

describe(" MyAuction", function () {
  let myAuction: any; // Contract Instance
  let owner: any; // Owner of the contract
  let bidders: any; // Bidders participating in the auction
  let sampleBidAmount: any = [1, 1.2, 1.5, 2, 2.5, 3]; // Sample bid amounts in ether
  let sampleBidAmountInWei: any = sampleBidAmount.map((amount: any) =>
    ethers.parseEther(amount.toString())); // Convert bid amounts to wei

  beforeEach(async function () {
    console.log("Deploying MyAuction contract...");
    myAuction = await ethers.deployContract("MyAuction", [Product.Brand, Product.SerialNumber,
    Product.Duration]);
    [owner, ...bidders] = await ethers.getSigners();
  });

  it("should return product information", async function () {
    const [_brand, _serialNumber] = await myAuction.getProductInfo();
    expect(_brand).to.equal(Product.Brand);
    expect(_serialNumber).to.equal(Product.SerialNumber);
  });

  it("should allow bidders to place bids", async function () {
    for (let i = 0; i < sampleBidAmountInWei.length; i++) {
      const ct = myAuction.connect(bidders[i]); // connect bidder's wallet to the contract
      const tx = await ct.bid({ value: sampleBidAmountInWei[i] });
      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1); // Check if the transaction was successful
      const highestBid = await myAuction.highestBid();

      const bidAmount = await myAuction.getMyBid(bidders[i].address);
      expect(bidAmount).to.equal(sampleBidAmountInWei[i]);
      expect(highestBid).to.equal(sampleBidAmountInWei[i]);
    }
  });

  const AUCTION_STATES = { "STARTED": 0, "ENDED": 1, "CANCELLED": 2 };
  const delayInSeconds = (s: number) => new Promise((resolve) => setTimeout(resolve, s * 1000));
  it("should end the auction", async function () {
    const ct = myAuction.connect(owner); // connect owner's wallet to the contract
    await delayInSeconds(Product.Duration + 3); // Wait for the auction duration to end
    const tx = await ct.endAuction();
    const receipt = await tx.wait();
    expect(receipt.status).to.equal(1);
    const auctionState = await ct.STATE();
    expect(auctionState).to.equal(AUCTION_STATES.ENDED);
  });

  it("should cancel the auction", async function () {
    const ct = myAuction.connect(owner); // connect owner's wallet to the contract
    const tx = await ct.cancelAuction();
    const receipt = await tx.wait();
    expect(receipt.status).to.equal(1);
    const auctionState = await ct.STATE();
    expect(auctionState).to.equal(AUCTION_STATES.CANCELLED);
  });

  it("should make a withdrawal after auction ends", async function () {
    let ct, tx, receipt;
    for (let i = 0; i < sampleBidAmountInWei.length; i++) {
      ct = await myAuction.connect(bidders[i]); // connect bidder's wallet to the contract
      tx = await ct.bid({ value: sampleBidAmountInWei[i] });
      receipt = await tx.wait();
    }
    await delayInSeconds(Product.Duration + 3); // Wait for the auction duration to end
    ct = myAuction.connect(owner); // connect owner's wallet to the contract
    tx = await ct.endAuction();
    receipt = await tx.wait();
    let i;
    for (i = 0; i < sampleBidAmountInWei.length - 1; i++) {
      ct = await myAuction.connect(bidders[i]); // connect bidder's wallet to the contract
      await expect(ct.withdraw()).to.changeEtherBalance(ethers, bidders[i], sampleBidAmountInWei[i]);
    }
    ct = myAuction.connect(owner); // connect owner's wallet to the contract
    await expect(ct.withdraw()).to.changeEtherBalance(ethers, owner,
      sampleBidAmountInWei[sampleBidAmountInWei.length - 1]);
  });

  it("should make a withdrawal after auction is cancelled", async function () {
    let ct, tx, receipt;
    for (let i = 0; i < sampleBidAmountInWei.length; i++) {
      ct = myAuction.connect(bidders[i]); // connect bidder's wallet to the contract
      tx = await ct.bid({ value: sampleBidAmountInWei[i] });
      receipt = await tx.wait();
    }
    ct = myAuction.connect(owner); // connect owner's wallet to the contract
    tx = await ct.cancelAuction();
    receipt = await tx.wait();
    let i;
    for (i = 0; i < sampleBidAmountInWei.length; i++) {
      ct = myAuction.connect(bidders[i]); // connect bidder's wallet to the contract
      await expect(ct.withdraw()).to.changeEtherBalance(ethers, bidders[i], sampleBidAmountInWei[i]);
    }
    ct = await myAuction.connect(owner); // connect owner's wallet to the contract
    await expect(ct.withdraw()).to.be.revertedWith("Owner can only withdraw after auction ended"); // Owner should not be able to withdraw any funds after cancellation
  });
});