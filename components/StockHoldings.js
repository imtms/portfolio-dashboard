// components/StockHoldings.js
import { useEffect, useRef } from "react";
import * as echarts from "echarts";

export default function StockHoldings({ stockHoldings }) {
  const pieChartRef = useRef(null);

  useEffect(() => {
    if (stockHoldings.length > 0) {
      const pieDom = document.getElementById("pieChart");
      if (pieDom) {
        if (pieChartRef.current) {
          pieChartRef.current.dispose();
        }
        pieChartRef.current = echarts.init(pieDom);

        const pieData = stockHoldings.map((holding) => ({
          value: parseFloat((holding.allocationInPercentage * 100).toFixed(2)),
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
  }, [stockHoldings]);

  return (
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
          <div id="pieChart" style={{ width: "100%", height: "300px" }}></div>
        </div>
      </div>
    </>
  );
}
