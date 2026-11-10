import { expect } from "chai";
import { network } from "hardhat";
const Product = require("../ignition/modules/product.json");

const { ethers } = await network.create();


describe("MyAuction", function () {
    let MyAuction: any;
    let myAuction: any;
    let owner: any;
    let bilders: any;
    let sampleBidAmount: any = [1,1.2,1.5,2,2.5,3];
    let sampleBidAmountInWei: any = sampleBidAmount.map((amount: number) => ethers.parseEther(amount.toString()));

    beforeEach(async function () {
        [owner] = await ethers.getSigners();
        MyAuction = await ethers.getContractFactory("MyAuction");
        myAuction = await MyAuction.deploy(Product.Brand, Product.SerielNumber, Product.Duration);
        await myAuction.deployed();
    });

    it("should deploy the contract with correct product details", async function () {
        expect(await myAuction.productBrand()).to.equal(Product.Brand);
        expect(await myAuction.productSerialNumber()).to.equal(Product.SerielNumber);
        expect(await myAuction.auctionDuration()).to.equal(Product.Duration);
    });

    // Add more tests as needed
});
