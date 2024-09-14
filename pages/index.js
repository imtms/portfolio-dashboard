// pages/index.js
import Head from "next/head";
import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Navbar, Nav, Container } from "react-bootstrap";
import PerformanceChart from "../components/PerformanceChart";
import StockHoldings from "../components/StockHoldings";
import CurrencyHoldings from "../components/CurrencyHoldings";

export default function Home() {
  const [stockHoldings, setStockHoldings] = useState([]);
  const [currencyHoldings, setCurrencyHoldings] = useState([]);
  const [chart, setChart] = useState([]);
  const [activeTab, setActiveTab] = useState("performance");

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/data");
      const data = await res.json();
      setStockHoldings(data.stockHoldings);
      setCurrencyHoldings(data.currencyHoldings);
      setChart(data.chart);
    };

    fetchData();
  }, []);

  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Portfolio Dashboard</title>
      </Head>
      <Navbar bg="light" expand="lg">
        <Container>
          <Navbar.Brand href="#home">Portfolio Dashboard</Navbar.Brand>
        </Container>
      </Navbar>
      <Container className="mt-4">
        <Nav variant="tabs" className="mb-3">
          <Nav.Item>
            <Nav.Link
              active={activeTab === "performance"}
              onClick={() => setActiveTab("performance")}
            >
              盈亏
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              active={activeTab === "stockHoldings"}
              onClick={() => setActiveTab("stockHoldings")}
            >
              股票持仓
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              active={activeTab === "currencyHoldings"}
              onClick={() => setActiveTab("currencyHoldings")}
            >
              货币持仓
            </Nav.Link>
          </Nav.Item>
        </Nav>
        {activeTab === "performance" && <PerformanceChart chart={chart} />}

        {activeTab === "stockHoldings" && (
          <StockHoldings stockHoldings={stockHoldings} />
        )}

        {activeTab === "currencyHoldings" && (
          <CurrencyHoldings currencyHoldings={currencyHoldings} />
        )}
      </Container>
    </>
  );
}
