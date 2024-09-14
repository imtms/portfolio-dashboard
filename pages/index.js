// pages/index.js
import Head from "next/head";
import { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import * as echarts from "echarts"; // 导入 echarts
import { Navbar, Nav, Container } from "react-bootstrap";

export default function Home() {
  const [stockHoldings, setStockHoldings] = useState([]);
  const [currencyHoldings, setCurrencyHoldings] = useState([]);
  const [chart, setChart] = useState([]);
  const [activeTab, setActiveTab] = useState("performance");
  const lineChartRef = useRef(null);
  const pieChartRef = useRef(null);

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

  useEffect(() => {
    if (stockHoldings.length > 0 && chart.length > 0) {
      // Initialize performance chart
      if (activeTab === "performance") {
        const chartDom = document.getElementById("chart");
        if (chartDom) {
          if (lineChartRef.current) {
            lineChartRef.current.dispose();
          }
          lineChartRef.current = echarts.init(chartDom);

          const dateList = chart.map((item) => item.date);
          const netPerformanceList = chart.map((item) =>
            item.netPerformanceInPercentage.toFixed(2),
          );

          const option = {
            title: { text: "Net Performance Percentage" },
            tooltip: { trigger: "axis", formatter: "{b} : {c} %" },
            xAxis: { type: "category", data: dateList },
            yAxis: {
              type: "value",
              axisLabel: { formatter: "{value} %" },
            },
            series: [{ data: netPerformanceList, type: "line" }],
          };

          lineChartRef.current.setOption(option);
          window.addEventListener("resize", lineChartRef.current.resize);
        }
      }
      // Initialize stock holdings pie chart
      if (activeTab === "stockHoldings") {
        const pieDom = document.getElementById("pieChart");
        if (pieDom) {
          if (pieChartRef.current) {
            pieChartRef.current.dispose();
          }
          pieChartRef.current = echarts.init(pieDom);

          const pieData = stockHoldings.map((holding) => ({
            value: parseFloat(
              (holding.allocationInPercentage * 100).toFixed(2),
            ),
            name: holding.symbol,
          }));

          const pieOption = {
            title: { text: "股票持仓分布", left: "center" },
            tooltip: {
              trigger: "item",
              formatter: "{a} <br/>{b} : {c}% ({d}%)",
            },
            series: [
              {
                name: "Allocation",
                type: "pie",
                radius: "55%",
                data: pieData,
                emphasis: {
                  itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: "rgba(0, 0, 0, 0.5)",
                  },
                },
              },
            ],
          };

          pieChartRef.current.setOption(pieOption);
          window.addEventListener("resize", pieChartRef.current.resize);
        }
      }

      // Initialize currency holdings pie chart
      if (activeTab === "currencyHoldings") {
        const pieDom = document.getElementById("currencyPieChart");
        if (pieDom) {
          if (pieChartRef.current) {
            pieChartRef.current.dispose();
          }
          pieChartRef.current = echarts.init(pieDom);

          const pieData = currencyHoldings.map((holding) => ({
            value: parseFloat(holding.percentage.toFixed(2)),
            name: holding.currency,
          }));

          const pieOption = {
            title: { text: "货币持仓分布", left: "center" },
            tooltip: {
              trigger: "item",
              formatter: "{a} <br/>{b} : {c}% ({d}%)",
            },
            series: [
              {
                name: "Allocation",
                type: "pie",
                radius: "55%",
                data: pieData,
                emphasis: {
                  itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: "rgba(0, 0, 0, 0.5)",
                  },
                },
              },
            ],
          };

          pieChartRef.current.setOption(pieOption);
          window.addEventListener("resize", pieChartRef.current.resize);
        }
      }
    }
  }, [stockHoldings, currencyHoldings, chart, activeTab]);

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
        {activeTab === "performance" && (
          <>
            <h2 className="my-4">盈亏百分比变化</h2>
            <div
              id="chart"
              style={{ width: "100%", height: "300px" }}
              className="my-4"
            ></div>
          </>
        )}

        {activeTab === "stockHoldings" && (
          <>
            <h2 className="my-4">股票持仓情况</h2>
            <div className="row">
              <div className="col-lg-8 col-md-12 mb-4">
                <div className="table-responsive">
                  <table className="table table-hover table-bordered">
                    <thead className="table-dark">
                      <tr>
                        <th scope="col">Symbol</th>
                        <th scope="col">Name</th>
                        <th scope="col">Performance</th>
                        <th scope="col">Allocation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockHoldings.map((holding, index) => (
                        <tr key={index}>
                          <td className="font-weight-bold">{holding.symbol}</td>
                          <td>{holding.name}</td>
                          <td
                            className={
                              holding.netPerformancePercent >= 0
                                ? "text-success"
                                : "text-danger"
                            }
                          >
                            {(holding.netPerformancePercent * 100).toFixed(2)}%
                          </td>
                          <td>
                            {(holding.allocationInPercentage * 100).toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="col-lg-4 col-md-12">
                <div
                  id="pieChart"
                  style={{ width: "100%", height: "300px" }}
                ></div>
              </div>
            </div>
          </>
        )}

        {activeTab === "currencyHoldings" && (
          <>
            <h2 className="my-4">货币持仓情况</h2>
            <div className="row">
              <div className="col-lg-8 col-md-12 mb-4">
                <div className="table-responsive">
                  <table className="table table-hover table-bordered">
                    <thead className="table-dark">
                      <tr>
                        <th scope="col">Currency</th>
                        <th scope="col">Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currencyHoldings.map((holding, index) => (
                        <tr key={index}>
                          <td className="font-weight-bold">
                            {holding.currency}
                          </td>
                          <td>{holding.percentage.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="col-lg-4 col-md-12">
                <div
                  id="currencyPieChart"
                  style={{ width: "100%", height: "300px" }}
                ></div>
              </div>
            </div>
          </>
        )}
      </Container>
    </>
  );
}
