import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import product from "./product.json" with { type: "json" };
const { Brand: productBrand, SerielNumber: productSerielNumber, Duration: productDuration } = product;
// Brand , SerielNumber , Duration จะถูกนำเข้าจากไฟล์ product.json ทันที คือการ destructuring object ของ JSON ที่นำเข้ามา

export default buildModule("MyAuctionModule", (m) => {

  const Brand = m.getParameter("_brand", productBrand); // กำหนดค่า Brand จากไฟล์ product.json
  const SerielNumber = m.getParameter("_serielNumber", productSerielNumber); // กำหนดค่า SerielNumber จากไฟล์ product.json
  const Duration = m.getParameter("_duration", productDuration); // กำหนดค่า Duration จากไฟล์ product.json 

  const MyAuction = m.contract("MyAuction", [Brand, SerielNumber, Duration]); // สร้างสัญญา MyAuction และส่งค่า Brand, SerielNumber, Duration เป็นอาร์กิวเมนต์
  return { MyAuction };
});
