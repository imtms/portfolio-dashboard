import { useRef, useEffect, useMemo, useState } from "react";
import * as echarts from "echarts";
import { Row, Col } from "react-bootstrap";
import styles from "../../styles/Dashboard.module.css";

export default function CurrencyHoldings({ holdings }) {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const [sortBy, setSortBy] = useState("percentage");
    const [sortOrder, setSortOrder] = useState("desc");

    const option = useMemo(
        () => ({
            tooltip: {
                trigger: "item",
                formatter: "{a} <br/>{b} : {c}% ({d}%)",
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                textStyle: { color: '#333' }
            },
            legend: {
                orient: 'vertical',
                left: 'left',
                textStyle: { color: '#999' }
            },
            series: [
                {
                    name: "Currency Allocation",
                    type: "pie",
                    radius: ["40%", "70%"],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 2,
                        borderColor: '#fff',
                        borderWidth: 2
                    },
                    label: { show: false, position: "center" },
                    emphasis: {
                        label: {
                            show: true,
                            fontSize: '20',
                            fontWeight: 'bold'
                        }
                    },
                    labelLine: { show: false },
                    data: holdings.map((holding) => ({
                        value: parseFloat(holding.percentage.toFixed(2)),
                        name: holding.currency,
                    })),
                },
            ],
        }),
        [holdings]
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

    const handleSort = (col) => {
        if (sortBy === col) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(col);
            setSortOrder("desc");
        }
    };

    const sortedHoldings = useMemo(() => {
        return [...holdings].sort((a, b) => {
            let valA = a[sortBy];
            let valB = b[sortBy];
            if (typeof valA === "string") valA = valA.toUpperCase();
            if (typeof valB === "string") valB = valB.toUpperCase();
            if (valA < valB) return sortOrder === "asc" ? -1 : 1;
            if (valA > valB) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });
    }, [holdings, sortBy, sortOrder]);

    const renderSortArrow = (col) => {
        if (sortBy !== col) return null;
        return sortOrder === "asc" ? " ▲" : " ▼";
    };

    return (
        <Row>
            <Col md={6}>
                <div ref={chartRef} className={styles.chartContainer}></div>
            </Col>
            <Col md={6}>
                <div className={styles.tableContainer}>
                    <table className={styles.customTable}>
                        <thead>
                            <tr>
                                <th onClick={() => handleSort("currency")}>
                                    Currency {renderSortArrow("currency")}
                                </th>
                                <th onClick={() => handleSort("percentage")}>
                                    Percentage {renderSortArrow("percentage")}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedHoldings.map((holding, index) => (
                                <tr key={index}>
                                    <td style={{ fontWeight: 500 }}>{holding.currency}</td>
                                    <td>{holding.percentage.toFixed(2)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Col>
        </Row>
    );
}
