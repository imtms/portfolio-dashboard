import { useRef, useEffect, useMemo } from "react";
import * as echarts from "echarts";
import styles from "../../styles/Dashboard.module.css";

export default function PerformanceChart({ data }) {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    const option = useMemo(
        () => ({
            tooltip: {
                trigger: "axis",
                formatter: "{b} : {c} %",
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderColor: '#ccc',
                textStyle: {
                    color: '#333'
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: "category",
                data: data.map((item) => item.date),
                axisLabel: {
                    rotate: 45,
                    interval: "auto",
                    color: '#888'
                },
                axisLine: {
                    lineStyle: {
                        color: '#eee'
                    }
                }
            },
            yAxis: {
                type: "value",
                axisLabel: {
                    formatter: "{value} %",
                    color: '#888'
                },
                splitLine: {
                    lineStyle: {
                        color: '#eee',
                        type: 'dashed'
                    }
                }
            },
            series: [
                {
                    data: data.map((item) => item.netPerformanceInPercentage.toFixed(2)),
                    type: "line",
                    smooth: true,
                    showSymbol: false,
                    lineStyle: { color: "#1a73e8", width: 3 },
                    itemStyle: { color: "#1a73e8" },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: "rgba(26, 115, 232, 0.4)" },
                            { offset: 1, color: "rgba(26, 115, 232, 0.05)" },
                        ]),
                    },
                },
            ],
        }),
        [data]
    );

    useEffect(() => {
        if (chartRef.current) {
            if (!chartInstance.current) {
                chartInstance.current = echarts.init(chartRef.current);
            }
            chartInstance.current.setOption(option);

            const handleResize = () => chartInstance.current.resize();
            window.addEventListener("resize", handleResize);

            return () => {
                window.removeEventListener("resize", handleResize);
                chartInstance.current.dispose();
                chartInstance.current = null;
            };
        }
    }, [option]);

    return <div ref={chartRef} className={styles.chartContainer}></div>;
}
