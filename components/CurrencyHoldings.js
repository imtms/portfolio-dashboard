// components/CurrencyHoldings.js
import { useEffect, useRef } from "react";
import * as echarts from "echarts";

export default function CurrencyHoldings({ currencyHoldings }) {
  const pieChartRef = useRef(null);

  useEffect(() => {
    if (currencyHoldings.length > 0) {
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
  }, [currencyHoldings]);

  return (
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
                    <td className="font-weight-bold">{holding.currency}</td>
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
  );
}
