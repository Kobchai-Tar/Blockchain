import React, { useState, useEffect } from "react";
import { Button, Table, Form, Container, Card } from "react-bootstrap";
import { ethers } from "ethers";
import SimpleMathContract from "./contracts/SimpleMath.sol/SimpleMath.json";

const contractAddress = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";
const WEB3_URL = "http://127.0.0.1:8545/";

function App() {
  const [provider, setProvider] = useState(null);
  const [connected, setConnected] = useState(false);
  const [firstOperand, setFirstOperand] = useState("");
  const [secondOperand, setSecondOperand] = useState("");
  const [contract, setContract] = useState(null);
  const [result, setResult] = useState("");

  useEffect(() => {
    let providerInstance;
    if (window.ethereum) { // Check if MetaMask/Wallet is installed
      providerInstance = new ethers.providers.Web3Provider(window.ethereum);
    } else {
      providerInstance = new ethers.providers.JsonRpcProvider(WEB3_URL); // local provider for testing
    }
    setProvider(providerInstance);
    // ฟังก์ชันใน contract เป็น pure ใช้แค่ provider (read-only) ก็เรียกได้เลย ไม่ต้องมี wallet/signer
    const sm = new ethers.Contract(contractAddress, SimpleMathContract.abi, providerInstance);
    setContract(sm);
    setConnected(true);
    console.log("Provider set:", providerInstance);
  }, []);


  const connectWallet = async () => {
    try {
      const signerInstance = await provider.getSigner(); // คนที่ลงลายมือ (ผู้ทำธุรกรรม) จะเป็น signer
      console.log("Owner address", await signerInstance.getAddress());
      console.log("contract address", contractAddress); 
      console.log("abi", SimpleMathContract.abi);
      const sm = new ethers.Contract(contractAddress, SimpleMathContract.abi, signerInstance); 
      console.log("contract", sm);
      setConnected(true);
      setContract(sm);
    } catch (e) {
      console.error(e);
    }
  };

  
  const handleCalculation = async operator => { // function ที่ใช้คำนวณผลลัพธ์จาก smart contract
    try {
      console.log("firstOperand", firstOperand);
      console.log("secondOperand", secondOperand);
      setFirstOperand(""); // clear input after calculation
      setSecondOperand("");
      let num1 = parseInt(firstOperand);
      let num2 = parseInt(secondOperand);
      let res;
      let sign = "";
      if(!connected || !contract) {
        setResult("Please connect your wallet first.");
        return;
      }
      if (isNaN(num1) || isNaN(num2)) {
        setResult("Please enter valid numbers.");
        return;
      }
        switch (operator) {
          case 'add': res = await contract.add(num1, num2); sign = "+"; break;
          case 'subtract': 
            res = await contract.subtract(num1, num2);
            if (res.lt(0)) {
            sign = "-"; 
            res = res.abs();
        } else {
          sign = "+";
        }
        break;
      case 'multiply': res = await contract.multiply(num1, num2); sign = "*"; break;
      case 'divide': 
        if (num2 === 0) {
          res = "Cannot divide by zero.";
        } else {
          res = await contract.divide(num1, num2);
          sign = "+";
        }
        break;
      default: res = "Invalid operator."; break;
        }
        res = (sign === "-" ? "-" : "") + res.toString();
        // = จะมีความสำคัญน้อยที่สุดและจะทำหลังสุด ถ้า sign เป็น + จะไม่แสดงเครื่องหมาย แต่ถ้าเป็น - จะใส่เครื่องหมาย - ข้างหน้า และแปลง res เป็น string
      setResult(res);
      } catch (e) {
      console.error(e);
    }
  };

  return (
    <Container fluid style={{ width: "80%", marginTop: "20px" }}>
      <Button
        variant={connected ? "primary" : "secondary"}
        className="m-3"
        onClick={connectWallet}
      >
        {connected ? "Connected" : "Connect"}
      </Button>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th className="text-center">#</th>
            <th className="text-center" colSpan={"2"}>
              First Operand
            </th>
            <th className="text-center" colSpan={"2"}>
              Second Operand
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="text-center">Input</td>
            <td colSpan={"2"}>
              <Form.Control
                type="number"
                name="firstOperand"
                value={firstOperand}  // เอาค่าที่เราใส่ใน input element มาเก็บไว้ใน state ของ firstOperand 
                onChange={e => setFirstOperand(e.target.value)} // target คือ input element ที่เรากำลังแก้ไขอยู่
              /> 
            </td>
            <td colSpan={"2"}>
              <Form.Control
                type="number"
                name="secondOperand"
                value={secondOperand} // เอาค่าที่เราใส่ใน input element มาเก็บไว้ใน state ของ secondOperand
                onChange={e => setSecondOperand(e.target.value)}
              />
            </td>
          </tr>
          <tr>
            <td className="text-center">Operator</td>
            <td>
              <Button
                variant="success"
                className="w-100"
                onClick={() => handleCalculation("add")}
              >
                Add
              </Button>
            </td>
            <td>
              <Button
                variant="danger"
                className="w-100"
                onClick={() => handleCalculation("subtract")}
              >
                Subtract
              </Button>
            </td>
            <td>
              <Button
                variant="warning"
                className="w-100"
                onClick={() => handleCalculation("multiply")}
              >
                Multiply
              </Button>
            </td>
            <td>
              <Button
                variant="info"
                className="w-100"
                onClick={() => handleCalculation("divide")}
              >
                Divide
              </Button>
            </td>
          </tr>
        </tbody>
      </Table>

      {/* Result Card */}
      <Card className="mt-4">
        <Card.Body>
          <Card.Title>Calculation Result:{result}</Card.Title>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default App;