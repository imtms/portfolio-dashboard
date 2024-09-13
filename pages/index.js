// pages/index.js
import Head from 'next/head';
import { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as echarts from 'echarts';  // 导入 echarts

export default function Home() {
    const [holdings, setHoldings] = useState([]);
    const [chart, setChart] = useState([]);

    useEffect(() => {
        // 在前端发起 API 请求
        const fetchData = async () => {
            const res = await fetch('/api/data');
            const data = await res.json();
            setHoldings(data.holdings);
            setChart(data.chart);
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (holdings.length > 0 && chart.length > 0) {
            // 初始化盈亏图表
            const chartDom = document.getElementById('chart');
            const myChart = echarts.init(chartDom);

            const dateList = chart.map(item => item.date);
            const netPerformanceList = chart.map(item => item.netPerformanceInPercentage.toFixed(2));

            const option = {
                title: { text: 'Net Performance Percentage' },
                tooltip: { trigger: 'axis', formatter: '{b} : {c} %' },
                xAxis: { type: 'category', data: dateList },
                yAxis: {
                    type: 'value',
                    axisLabel: { formatter: '{value} %' },
                },
                series: [{ data: netPerformanceList, type: 'line' }],
            };

            myChart.setOption(option);

            // 初始化饼图
            const pieDom = document.getElementById('pieChart');
            const pieChart = echarts.init(pieDom);

            const pieData = holdings.map(holding => ({
                value: (holding.allocationInPercentage * 100).toFixed(2),
                name: holding.symbol,
            }));

            const pieOption = {
                title: { text: '持仓分布', left: 'center' },
                tooltip: {
                    trigger: 'item',
                    formatter: '{a} <br/>{b} : {c}% ({d}%)',
                },
                series: [
                    {
                        name: 'Allocation',
                        type: 'pie',
                        radius: '55%',
                        data: pieData,
                        emphasis: {
                            itemStyle: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: 'rgba(0, 0, 0, 0.5)',
                            },
                        },
                    },
                ],
            };

            pieChart.setOption(pieOption);
        }
    }, [holdings, chart]);

    return (
        <>
            <Head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Portfolio Dashboard</title>
            </Head>
            <div className="container">
                <h2 className="my-4">盈亏百分比变化</h2>
                <div id="chart" style={{ width: '100%', height: '400px' }} className="my-4"></div>

                <h2 className="my-4">持仓情况</h2>
                <div className="row">
                    <div className="col-lg-8">
                        <table className="table table-bordered table-striped">
                            <thead className="thead-dark">
                                <tr>
                                    <th>Symbol</th>
                                    <th>Name</th>
                                    <th>Net Performance (%)</th>
                                    <th>Allocation (%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {holdings.map((holding, index) => (
                                    <tr key={index}>
                                        <td>{holding.symbol}</td>
                                        <td>{holding.name}</td>
                                        <td>{(holding.netPerformancePercent * 100).toFixed(2)}%</td>
                                        <td>{(holding.allocationInPercentage * 100).toFixed(2)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="col-lg-4">
                        <div id="pieChart" style={{ width: '100%', height: '400px' }}></div>
                    </div>
                </div>
            </div>
        </>
    );
}