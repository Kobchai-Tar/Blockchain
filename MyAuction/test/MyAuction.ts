import { expect } from "chai";
import { network } from "hardhat";
import Product from "../ignition/modules/product.json" with { type: "json" };

const { ethers } = await network.create();


describe("MyAuction", function () {
    let MyAuction: any;
    let myAuction: any;
    let owner: any;
    let bilders: any;
    let sampleBidAmount: any = [1,1.2,1.5,2,2.5,3];
    let sampleBidAmountInWei: any = sampleBidAmount.map((amount: number) => ethers.parseEther(amount.toString()));

    beforeEach(async function () {
        console.log("Deploying MyAuction contract...");
        [owner] = await ethers.getSigners();
        MyAuction = await ethers.getContractFactory("MyAuction");
        myAuction = await MyAuction.deploy(Product.Brand, Product.SerielNumber, Product.Duration);
        await myAuction.waitForDeployment();
    });

    it("should deploy the contract with correct product details", async function () {
        expect(await myAuction.productBrand()).to.equal(Product.Brand);
        expect(await myAuction.productSerialNumber()).to.equal(Product.SerielNumber);
        expect(await myAuction.auctionDuration()).to.equal(Product.Duration);
    });

    // Add more tests as needed
    describe(" MyAuction ", function () {
        it("should allow users to place bids", async function () {
            for (let i = 0; i < sampleBidAmountInWei.length; i++) {
                const ct = await myAuction.connect(bilders[i]);
                const tx = await ct.bid({ value: sampleBidAmountInWei[i] });
                const receipt = await tx.wait();
                expect(receipt.status).to.equal(1); // Transaction successful
                const highestBid = await myAuction.highestBid();

                const bidAmount = await myAuction.getBidAmount(bilders[i].address); // Get the bid amount for the current builder
                expect(bidAmount).to.equal(sampleBidAmountInWei[i]);
                expect(highestBid).to.equal(sampleBidAmountInWei[i]);
            }
        });
    });

    it("should end the auction", async function () {
        expect(false).to.be.true;
    });

    it("should cancel the auction", async function () {
        expect(false).to.be.true;
    });

    it("should make a withdrawal", async function () {
        expect(false).to.be.true;
    });

});