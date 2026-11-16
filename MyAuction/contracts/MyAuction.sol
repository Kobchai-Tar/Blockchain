// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.34;

import "./Auction.sol";

contract MyAuction is Auction {
    // สินค้าที่นำมาประมูล
    Product private _product;
    // เวลาที่จบการประมูล
    uint256 public endTime;
    // สถานะการประมูล
    AuctionState public state;
    // ผู้ชนะการประมูล (ชั่วคราว)
    address public winner;
    // ยอดประมูลสูงสุด
    uint256 public highestBid;
    // ยอดเงินที่ผู้ประมูลแต่ละคนส่งเข้ามา
    mapping(address => uint256) private _bids;

    constructor(string memory _brand, string memory _serielNumber, uint256 _duration) {
        owner = payable(msg.sender);
        _product = Product(_brand, _serielNumber);
        endTime = block.timestamp + _duration * 1 minutes;
        state = AuctionState.STARTED;
    }

    // ยื่นประมูล | ส่งเงินมาด้วย ต้องมากกว่าราคาสูงสุดปัจจุบัน
    function bid() external payable override {
        require(state == AuctionState.STARTED, "Auction is not started");
        require(block.timestamp < endTime, "Auction expired");
        require(msg.sender != owner, "Owner cannot bid");
        require(msg.value > 0, "Bid must be greater than 0");

        _bids[msg.sender] += msg.value;
        if (_bids[msg.sender] > highestBid) {
            highestBid = _bids[msg.sender];
            winner = msg.sender;
        }
        emit BidEvent(msg.sender, msg.value, block.timestamp);
    }

    // ดูยอดเงินที่ประมูลของตัวเองและผู้อื่น
    function getMyBid(address bidder) external view override returns (uint256) {
        return _bids[bidder];
    }

    // จบการประมูล (เฉพาะเจ้าของ) และส่งเงินให้เจ้าของ
    function endAuction() external override {
        require(msg.sender == owner, "Only owner can end auction");
        require(state == AuctionState.STARTED, "Auction is not started");
        require(block.timestamp >= endTime, "Auction not expired yet");

        state = AuctionState.ENDED;
        (bool success, ) = owner.call{value: highestBid}("");
        require(success, "Transfer to owner failed");
        emit EndAuctionEvent(winner, highestBid, block.timestamp);
    }

    // ยกเลิกการประมูล (เฉพาะเจ้าของ) และคืนเงินให้ผู้ชนะชั่วคราว
    function cancelAuction() external override {
        require(msg.sender == owner, "Only owner can cancel auction");
        require(state == AuctionState.STARTED, "Auction is not started");

        state = AuctionState.CANCELED;
        if (winner != address(0)) {
            (bool success, ) = payable(winner).call{value: _bids[winner]}("");
            require(success, "Refund failed");
        }
        emit CancelAuctionEvent("Auction canceled", block.timestamp);
    }

    // ถอนเงินออกจาก contract (สำหรับผู้แพ้ประมูล หรือเมื่อประมูลถูกยกเลิก)
    function withdraw() external override {
        require(msg.sender != winner, "Winner cannot withdraw");
        uint256 amount = _bids[msg.sender];
        require(amount > 0, "No balance to withdraw");

        _bids[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdraw failed");
        emit WithdrawEvent(msg.sender, amount, block.timestamp);
    }

    // ดูรายละเอียดสินค้า
    function getProduct() external view override returns (string memory, string memory) {
        return (_product.Brand, _product.SerialNumber);
    }
}
