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

  // ทำก่อนทุกเทส: deploy contract ใหม่ + เตรียมกระเป๋า (owner ตัวแรก, ที่เหลือเป็นผู้ประมูล)
  beforeEach(async function () {
    console.log("Deploying MyAuction contract...");
    myAuction = await ethers.deployContract("MyAuction", [Product.Brand, Product.SerialNumber,
    Product.Duration]);
    [owner, ...bidders] = await ethers.getSigners();
  });

  // เทส 1: ตรวจว่าข้อมูลสินค้า (แบรนด์/ซีเรียล) ที่ deploy ไปตรงกับที่ตั้งไว้
  it("should return product information", async function () {
    const [_brand, _serialNumber] = await myAuction.getProductInfo();
    expect(_brand).to.equal(Product.Brand);
    expect(_serialNumber).to.equal(Product.SerialNumber);
  });

  // เทส 2: ให้ผู้ประมูลทยอย bid ทีละคน (1 -> 3 ETH) แล้วเช็คว่า tx สำเร็จ
  // ยอดของแต่ละคน และ highestBid อัปเดตถูกต้องทุกรอบ
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
  // ฟังก์ชันช่วยหน่วงเวลา (รอให้ถึงเวลาจบการประมูลตาม Duration ที่ตั้งไว้)
  const delayInSeconds = (s: number) => new Promise((resolve) => setTimeout(resolve, s * 1000));

  // เทส 3: รอจนหมดเวลาประมูล -> owner เรียก endAuction -> สถานะต้องเปลี่ยนเป็น ENDED
  it("should end the auction", async function () {
    const ct = myAuction.connect(owner); // connect owner's wallet to the contract
    await delayInSeconds(Product.Duration + 3); // Wait for the auction duration to end
    const tx = await ct.endAuction();
    const receipt = await tx.wait();
    expect(receipt.status).to.equal(1);
    const auctionState = await ct.STATE();
    expect(auctionState).to.equal(AUCTION_STATES.ENDED);
  });

  // เทส 4: owner เรียก cancelAuction กลางวง -> สถานะต้องเปลี่ยนเป็น CANCELLED
  it("should cancel the auction", async function () {
    const ct = myAuction.connect(owner); // connect owner's wallet to the contract
    const tx = await ct.cancelAuction();
    const receipt = await tx.wait();
    expect(receipt.status).to.equal(1);
    const auctionState = await ct.STATE();
    expect(auctionState).to.equal(AUCTION_STATES.CANCELLED); // คาดหวังว่า A กับ B เท่ากันยังไง
  });

  // เทส 5: จบการประมูลแบบครบวงจร -> ทุกคน bid -> รอหมดเวลา -> endAuction
  // ผู้แพ้ทุกคนถอนเงินคืนได้ครบตามยอดที่ bid และ owner ถอนได้ = ราคาสูงสุด (3 ETH)
  it("should make a withdrawal after auction ends", async function () {
    let ct, tx, receipt , i;
    for (i = 0; i < sampleBidAmountInWei.length; i++) {
      ct = await myAuction.connect(bidders[i]); // connect bidder's wallet to the contract
      tx = await ct.bid({ value: sampleBidAmountInWei[i] });
      receipt = await tx.wait();
    } // setup การประมูล
    await delayInSeconds(Product.Duration + 3); // Wait for the auction duration to end
    ct = myAuction.connect(owner); // connect owner's wallet to the contract
    tx = await ct.endAuction();
    receipt = await tx.wait();
    for (i = 0; i < sampleBidAmountInWei.length - 1; i++) { 
      ct = await myAuction.connect(bidders[i]); // connect bidder's wallet to the contract
      await expect(ct.withdraw()).to.changeEtherBalance(ethers, bidders[i], sampleBidAmountInWei[i]); // คาดหวังว่า function นี้ทำให้เกิดการเปลี่ยนแปลง bidders i 
    }
    ct = myAuction.connect(owner); // connect owner's wallet to the contract , ถอนเงินผู้ชนะออกมา
    await expect(ct.withdraw()).to.changeEtherBalance(ethers, owner,
      sampleBidAmountInWei[sampleBidAmountInWei.length - 1]);
  });

  // เทส 6: ยกเลิกการประมูล -> ทุกคน (รวมถึงผู้นำ) ต้องถอนเงินคืนได้ครบ
  // และ owner ห้ามถอน (revert) เพราะประมูลถูกยกเลิกไม่ใช่จบปกติ
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
    await expect(ct.withdraw()).to.be.revertedWith("Owner can only withdraw after auction ended"); // ** Owner should not be able to withdraw any funds after cancellation
  });
});