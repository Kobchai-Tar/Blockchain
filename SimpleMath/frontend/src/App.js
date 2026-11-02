import React, { useState, useEffect } from "react";
import { Button, Table, Form, Container, Card } from "react-bootstrap";
import { ethers } from "ethers";
// import SimpleMathContract from "";
const contractAddress = "";
const WEB3_URL = "http://127.0.0.1:8545/";

function App() {
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    let providerInstance;
    if (window.ethereum) { // Check if MetaMask/Wallet is installed
      providerInstance = new ethers.providers.Web3Provider(window.ethereum);
    } else {
      providerInstance = new ethers.providers.JsonRpcProvider(WEB3_URL); // local provider for testing
    }
    setProvider(providerInstance);
    console.log("Provider set:", providerInstance);
  }, []);

  const connectWallet = async () => {
    try {
    } catch (e) {
      console.error(e);
    }
  };

  const handleCalculation = async operator => {
    try {
  
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Container fluid style={{ width: "80%", marginTop: "20px" }}>
      <Button
        className="m-3"
      >
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
              /> 
            </td>
            <td colSpan={"2"}>
              <Form.Control
                type="number"
                name="secondOperand"
              />
            </td>
          </tr>
          <tr>
            <td className="text-center">Operator</td>
            <td>
              <Button
                variant="success"
                className="w-100"
              >
                Add
              </Button>
            </td>
            <td>
              <Button
                variant="danger"
                className="w-100"
              >
                Subtract
              </Button>
            </td>
            <td>
              <Button
                variant="warning"
                className="w-100"
              >
                Multiply
              </Button>
            </td>
            <td>
              <Button
                variant="info"
                className="w-100"
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
          <Card.Title>Calculation Result:</Card.Title>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default App;