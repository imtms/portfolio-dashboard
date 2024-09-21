import Head from "next/head";
import { useState, useEffect, useRef, useMemo } from "react";
import { Navbar, Nav, Container, Row, Col } from "react-bootstrap";
import * as echarts from "echarts";

import "bootstrap/dist/css/bootstrap.min.css";

export default function Home() {
  const [stockHoldings, setStockHoldings] = useState([]);
  const [currencyHoldings, setCurrencyHoldings] = useState([]);
  const [chart, setChart] = useState([]);
  const [activeTab, setActiveTab] = useState("performance");
  const [isLoading, setIsLoading] = useState(true);

  const performanceChartRef = useRef(null);
  const stockPieChartRef = useRef(null);
  const currencyPieChartRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/data");
        const data = await res.json();
        setStockHoldings(data.stockHoldings);
        setCurrencyHoldings(data.currencyHoldings);
        setChart(data.chart);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderChart = (chartRef, chartId, option) => {
    const chartDom = document.getElementById(chartId);
    if (chartDom) {
      const myChart = echarts.init(chartDom);
      myChart.setOption(option);
      chartRef.current = myChart;
    }
  };

  const performanceChartOption = useMemo(
    () => ({
      tooltip: { trigger: "axis", formatter: "{b} : {c} %" },
      xAxis: {
        type: "category",
        data: chart.map((item) => item.date),
        axisLabel: { rotate: 45, interval: "auto" },
      },
      yAxis: {
        type: "value",
        axisLabel: { formatter: "{value} %" },
      },
      series: [
        {
          data: chart.map((item) => item.netPerformanceInPercentage.toFixed(2)),
          type: "line",
          smooth: false,
          lineStyle: { color: "#1a73e8", width: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(26, 115, 232, 0.5)" },
              { offset: 1, color: "rgba(26, 115, 232, 0.1)" },
            ]),
          },
        },
      ],
    }),
    [chart],
  );

  const stockPieChartOption = useMemo(
    () => ({
      tooltip: {
        trigger: "item",
        formatter: "{a} <br/>{b} : {c}% ({d}%)",
      },
      series: [
        {
          name: "Stock Allocation",
          type: "pie",
          radius: "70%",
          data: stockHoldings.map((holding) => ({
            value: parseFloat(
              (holding.allocationInPercentage * 100).toFixed(2),
            ),
            name: holding.symbol,
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
    }),
    [stockHoldings],
  );

  const currencyPieChartOption = useMemo(
    () => ({
      tooltip: {
        trigger: "item",
        formatter: "{a} <br/>{b} : {c}% ({d}%)",
      },
      series: [
        {
          name: "Currency Allocation",
          type: "pie",
          radius: "70%",
          data: currencyHoldings.map((holding) => ({
            value: parseFloat(holding.percentage.toFixed(2)),
            name: holding.currency,
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
        },
      ],
    }),
    [currencyHoldings],
  );

  useEffect(() => {
    if (chart.length > 0 && activeTab === "performance") {
      renderChart(
        performanceChartRef,
        "performanceChart",
        performanceChartOption,
      );
    }
  }, [chart, activeTab, performanceChartOption]);

  useEffect(() => {
    if (stockHoldings.length > 0 && activeTab === "stockHoldings") {
      renderChart(stockPieChartRef, "stockPieChart", stockPieChartOption);
    }
  }, [stockHoldings, activeTab, stockPieChartOption]);

  useEffect(() => {
    if (currencyHoldings.length > 0 && activeTab === "currencyHoldings") {
      renderChart(
        currencyPieChartRef,
        "currencyPieChart",
        currencyPieChartOption,
      );
    }
  }, [currencyHoldings, activeTab, currencyPieChartOption]);

  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Portfolio Dashboard</title>
        <style>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f0f2f5;
            color: #333;
          }
          .navbar {
            background-color: #000000;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .navbar-brand {
            font-weight: 600;
            color: #ffffff;
            display: flex;
            align-items: center;
          }
          .navbar-brand img {
            height: 30px;
            margin-right: 10px;
          }
          .nav-tabs {
            border-bottom: none;
            padding-top: 0.5rem;
            background-color: #ffffff;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
          }
          .nav-tabs .nav-link {
            color: #5f6368;
            border: none;
            border-bottom: 2px solid transparent;
            transition: all 0.3s ease;
            padding: 0.75rem 1rem;
            font-weight: 500;
          }
          .nav-tabs .nav-link.active,
          .nav-tabs .nav-link:hover {
            color: #1a73e8;
            border-bottom: 2px solid #1a73e8;
            background-color: transparent;
          }
          .main-content {
            background-color: #ffffff;
            border-radius: 0 0 8px 8px;
            box-shadow: 0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15);
            padding: 1.5rem;
          }
          .table {
            font-size: 0.9rem;
            border-collapse: separate;
            border-spacing: 0;
          }
          .table th {
            font-weight: 600;
            color: #333;
            background-color: #f8f9fa;
            border-bottom: 2px solid #dee2e6;
          }
          .table td, .table th {
            padding: 0.75rem;
            vertical-align: middle;
            border-top: 1px solid #dee2e6;
          }
          .table-striped tbody tr:nth-of-type(odd) {
            background-color: rgba(0, 0, 0, 0.05);
          }
          .chart-container {
            height: 400px;
            margin-bottom: 1.5rem;
          }
          .loading-spinner {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 200px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .custom-spinner {
            width: 50px;
            height: 50px;
            border: 5px solid #f3f3f3;
            border-top: 5px solid #1a73e8;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
        `}</style>
      </Head>
      <Navbar expand="lg">
        <Container>
          <Navbar.Brand href="#home" style={{ color: "#ffffff" }}>
            Portfolio Dashboard
          </Navbar.Brand>
        </Container>
      </Navbar>
      <Container className="mt-4">
        <div className="dashboard-wrapper">
          <Nav variant="tabs">
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
          <div className="main-content">
            {isLoading ? (
              <div className="loading-spinner">
                <div className="custom-spinner"></div>
              </div>
            ) : (
              <>
                {activeTab === "performance" && (
                  <div className="chart-container" id="performanceChart"></div>
                )}
                {activeTab === "stockHoldings" && (
                  <Row>
                    <Col md={6}>
                      <div className="chart-container" id="stockPieChart"></div>
                    </Col>
                    <Col md={6}>
                      <div className="table-responsive">
                        <table className="table table-striped">
                          <thead>
                            <tr>
                              <th>Symbol</th>
                              <th>Name</th>
                              <th>Performance</th>
                              <th>Allocation</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stockHoldings.map((holding, index) => (
                              <tr key={index}>
                                <td className="font-weight-medium">
                                  {holding.symbol}
                                </td>
                                <td>{holding.name}</td>
                                <td
                                  className={
                                    holding.netPerformancePercent >= 0
                                      ? "text-success"
                                      : "text-danger"
                                  }
                                >
                                  {(
                                    holding.netPerformancePercent * 100
                                  ).toFixed(2)}
                                  %
                                </td>
                                <td>
                                  {(
                                    holding.allocationInPercentage * 100
                                  ).toFixed(2)}
                                  %
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Col>
                  </Row>
                )}
                {activeTab === "currencyHoldings" && (
                  <Row>
                    <Col md={6}>
                      <div
                        className="chart-container"
                        id="currencyPieChart"
                      ></div>
                    </Col>
                    <Col md={6}>
                      <div className="table-responsive">
                        <table className="table table-striped">
                          <thead>
                            <tr>
                              <th>Currency</th>
                              <th>Percentage</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currencyHoldings.map((holding, index) => (
                              <tr key={index}>
                                <td className="font-weight-medium">
                                  {holding.currency}
                                </td>
                                <td>{holding.percentage.toFixed(2)}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Col>
                  </Row>
                )}
              </>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}
