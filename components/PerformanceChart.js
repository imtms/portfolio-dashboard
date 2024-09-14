// components/PerformanceChart.js
import { useEffect, useRef } from "react";
import * as echarts from "echarts";

export default function PerformanceChart({ chart }) {
  const lineChartRef = useRef(null);

  useEffect(() => {
    if (chart.length > 0) {
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
  }, [chart]);

  return (
    <>
      <h2 className="my-4">盈亏百分比变化</h2>
      <div
        id="chart"
        style={{ width: "100%", height: "300px" }}
        className="my-4"
      ></div>
    </>
  );
}
