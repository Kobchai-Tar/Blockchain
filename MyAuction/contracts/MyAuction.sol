// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0 <0.9.0;

import "./Auction.sol";

// ============================================================
// contract MyAuction คือ "ตัวประมูลของจริง" ที่สืบทอด (is) มาจาก
// abstract contract Auction (แบบแปลน/พิมพ์เขียว) แล้วเขียน logic เองทั้งหมด
// ============================================================
contract MyAuction is Auction {
    // ================== BOX 1 : ตัวแปรเก็บสถานะ (State Variables) ==================
    // ตัวแปรพวกนี้เขียนลงบน blockchain ถาวร เรียกดูได้จากภายนอกเพราะเป็น public

    Product public product;        // ข้อมูลสินค้า (struct { Brand, SerialNumber } จาก Auction.sol)
    AuctionState public STATE;     // สถานะประมูลตอนนี้: STARTED=0, ENDED=1, CANCELLED=2 (enum จาก Auction.sol)
    uint256 public endTime;        // เวลาที่ประมูลจะหมด (unix timestamp เป็นวินาที)
    uint256 public highestBid;     // ยอดประมูลสูงสุดปัจจุบัน (หน่วย wei)
    address public highestBidder;  // ที่อยู่ของผู้ประมูลสูงสุด (ผู้ชนะชั่วคราว)
    address[] public bidders;      // รายชื่อที่อยู่ของทุกคนที่เคย bid (array เก็บลำดับการเข้าร่วม)

    // mapping = ตารางค้นหา key -> value
    // bids[ที่อยู่] = ยอดเงินรวมที่คนนั้นสะสมไว้ใน contract
    mapping(address => uint256) public bids;

    // ================== BOX 2 : Event (เหตุการณ์ที่ปล่อยออกไป) ==================
    // event คือ "log" ที่บันทึกลง blockchain เพื่อให้ frontend/dapp ฟัง (listen)
    // แจ้งเตือนแบบเรียลไทม์ได้ว่าเกิดอะไรขึ้น (นอกเหตุการณ์ที่ inherit มาจาก Auction.sol)
    event EndedEvent(string message, uint256 timestamp);      // แจ้งว่าประมูลจบแล้ว
    event CancelledEvent(string message, uint256 timestamp);  // แจ้งว่าประมูลถูกยกเลิก

    // ================== BOX 3 : Modifier (ตัวตรวจเงื่อนไขก่อนเข้า function) ==================
    // modifier เหมือน "ยามตรวจบัตร" — รันเช็คเงื่อนไขก่อน ผ่านแล้วถึงได้รันโค้ดจริงใน function
    // ตัว `_` คือจุดที่โค้ดใน function หลักจะถูกแทรกลงมา

    // ยามข้อ 1: ต้องเป็นเจ้าของเท่านั้นถึงเรียกได้
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    // ยามข้อ 2: ห้ามเป็นเจ้าของ (ใช้กับ bid เพราะเจ้าของห้ามประมูลสินค้าตัวเอง)
    modifier notAnOwner() {
        require(msg.sender != owner, "Owner cannot call this function");
        _;
    }

    // ยามข้อ 3: ประมูลต้องกำลังดำเนินอยู่ (STATE == STARTED) ถ้าจบ/ยกเลิกไปแล้วจะเรียกไม่ได้
    modifier onGoingAuction() {
        require(STATE == AuctionState.STARTED, "Auction is stopped");
        _;
    }

    // ================== BOX 4 : Constructor (รันครั้งเดียวตอน deploy) ==================
    // รับค่าจากผู้ deploy ผ่าน ignition module (product.json): แบรนด์, ซีเรียลนัมเบอร์, ระยะเวลา
    constructor(
        string memory _brand,
        string memory _serialNumber,
        uint256 _duration
    ) {
        owner = payable(msg.sender);              // คนที่ deploy คือเจ้าของการประมูล
        product = Product(_brand, _serialNumber); // บันทึกข้อมูลสินค้าลง struct
        STATE = AuctionState.STARTED;             // เริ่มต้นสถานะเป็น "กำลังประมูล"
        // endTime = block.timestamp + _duration * 1 minutes;
        endTime = block.timestamp + _duration * 1 seconds; // เวลาจบ = เวลาปัจจุบัน + duration (วินาที)
    }

    // ================== BOX 5 : bid() ยื่นประมูล ==================
    // external = เรียกจากภายนอกเท่านั้น (ประหยัด gas) | payable = รับเงิน ETH มาพร้อมกับการเรียก
    // ลำดับยาม: ห้ามเจ้าของประมูล -> ประมูลต้องกำลังดำเนินอยู่
    function bid() external payable override notAnOwner onGoingAuction {
        // เช็คว่า "ยอดสะสมเดิม + เงินที่ส่งมาครั้งนี้" ต้องมากกว่าราคาสูงสุดปัจจุบัน
        // (ใช้ยอดสะสมเพราะคนเดิม bid เพิ่มทีหลังได้)
        require(
            msg.value + bids[msg.sender] > highestBid,
            "Bid must be higher than current highest bid"
        );
        // คนที่เป็นผู้นำอยู่แล้วไม่ต้อง bid ซ้ำ
        require(
            msg.sender != highestBidder,
            "You are already the highest bidder"
        );
        highestBidder = msg.sender;          // ขึ้นเป็นผู้นำใหม่
        if (bids[msg.sender] == 0) {         // ถ้าเป็นคนใหม่ที่ยังไม่เคย bid
            bidders.push(msg.sender);        // เพิ่มชื่อเข้ารายการผู้เข้าร่วม
        }
        bids[msg.sender] += msg.value;       // สะสมเงินเข้ากระเป๋าของตัวเองใน contract
        highestBid = bids[msg.sender];       // อัปเดตราคาสูงสุด = ยอดสะสมของผู้นำ
        emit BidEvent(msg.sender, bids[msg.sender], block.timestamp); // ปล่อย log แจ้งว่ามีคน bid
    }
    // ================== BOX 6 : getMyBid() ดูยอดเงินที่ประมูล ==================
    // view = อ่านค่าอย่างเดียว ไม่แก้ไขอะไรบน blockchain จึงไม่เสีย gas ตอนเรียกดู
    // ดูยอดเงินที่ประมูลของตัวเองและผู้อื่น (ส่ง address ของใครมาก็ได้ยอดของคนนั้น)
    function getMyBid(address bidder) external view override returns (uint256) {
        return bids[bidder]; // ค้นจาก mapping: ที่อยู่ -> ยอดเงินสะสม
    }

    // ================== BOX 7 : endAuction() จบการประมูล ==================
    // เฉพาะเจ้าของ -> และประมูลต้องกำลังดำเนินอยู่
    function endAuction() external override onlyOwner onGoingAuction {
        STATE = AuctionState.ENDED;                                  // เปลี่ยนสถานะเป็น "จบแล้ว"
        emit EndedEvent("Auction has ended", block.timestamp);       // ปล่อย log แจ้งจบการประมูล
        // หมายเหตุ: เงินยังอยู่ใน contract ทั้งหมด รอให้เจ้าของ/ผู้แพ้เข้าไป withdraw เอง (BOX 9)
    }

    // ================== BOX 8 : cancelAuction() ยกเลิกการประมูล ==================
    // เฉพาะเจ้าของ -> และประมูลต้องกำลังดำเนินอยู่
    function cancelAuction() external override onlyOwner onGoingAuction {
        STATE = AuctionState.CANCELED;                               // เปลี่ยนสถานะเป็น "ยกเลิก"
        emit CancelledEvent("Auction has been cancelled", block.timestamp); // ปล่อย log แจ้งยกเลิก
        // หมายเหตุ: เมื่อยกเลิก ทุกคน (รวมถึงผู้นำ) ถอนเงินคืนได้ทั้งหมด (BOX 9)
    }
    // ================== BOX 9 : withdraw() ถอนเงินออกจาก contract ==================
    // กติกาแบ่งเป็น 2 กรณีตามคนถอน:
    function withdraw() external override {
        uint256 amount = 0;                              // จำนวนเงินที่จะถอน (คำนวณทีหลัง)
        address payable withdrawer = payable(msg.sender); // คนที่กำลังเรียก withdraw
        // ประมูลต้องจบหรือถูกยกเลิกไปแล้วเท่านั้น ยังประมูลอยู่ห้ามถอน
        require(STATE != AuctionState.STARTED, "Auction is still ongoing");

        if(withdrawer == owner) { // Owner can withdraw the highest bid
            // กรณีที่ 1: เจ้าของถอน -> รับเงินราคาประมูลสูงสุด ได้เฉพาะเมื่อ "จบประมูล" (ไม่ใช่ยกเลิก)
            require(STATE == AuctionState.ENDED, "Owner can only withdraw after auction ended");
            require(bids[highestBidder] > 0, "No funds to withdraw for highest bidder");
            amount = highestBid;            // เงินที่เจ้าของได้ = ราคาประมูลสูงสุด
            bids[highestBidder] = 0;        // Reset the highest bidder's bid (ล้างบัญชีผู้ชนะแล้ว กันถอนซ้ำ)
        } else { // Other bidders can withdraw their bids
            // กรณีที่ 2: คนอื่น (ผู้แพ้) ถอนเงินคืน
            // เงื่อนไข: (จบประมูลและไม่ใช่ผู้ชนะ) หรือ (ประมูลถูกยกเลิก) และต้องมีเงินคงเหลือ
            bool allowed = ((STATE == AuctionState.ENDED && withdrawer != highestBidder) ||
                (STATE == AuctionState.CANCELED)) &&
                bids[withdrawer] > 0;
            require(allowed, "You are not allowed to withdraw");
            amount = bids[withdrawer];      // ได้คืนเต็มจำนวนที่ตัวเองเคย bid สะสมไว้
            bids[withdrawer] = 0;           // ล้างยอดของตัวเอง กันถอนซ้ำ (double withdraw)
        }
        // โอนเงินจริงออกจาก contract ด้วย call (วิธีที่ปลอดภัยกว่า transfer/send)
        (bool sent, ) = payable(withdrawer).call{value: amount}("");
        require(sent, "Failed to send Ether");
        emit WithdrawEvent(withdrawer, amount, block.timestamp); // ปล่อย log แจ้งการถอน
    }

    // ================== BOX 10 : getProductInfo() ดูรายละเอียดสินค้า ==================
    // คืนค่า 2 ตัวพร้อมกัน: แบรนด์ และ ซีเรียลนัมเบอร์ ของสินค้าที่ประมูลอยู่
    function getProductInfo()
        external
        view
        override
        returns (string memory, string memory)
    {
        return (product.Brand, product.SerialNumber);
    }
}