import { useEffect, useRef } from "react";
import * as echarts from "echarts";

export default function MetricChart({ metric, values, darkMode }) {
  const ref = useRef(null);
  useEffect(() => { if (!ref.current) return; const chart=echarts.init(ref.current); const sorted=[...values].sort((a,b)=>a.date.localeCompare(b.date)); chart.setOption({grid:{left:45,right:22,top:25,bottom:32},tooltip:{trigger:"axis"},xAxis:{type:"category",data:sorted.map(v=>v.date),axisLine:{lineStyle:{color:darkMode?"#405048":"#d8dfdb"}},axisLabel:{color:darkMode?"#92a29a":"#76827c"}},yAxis:{type:"value",splitLine:{lineStyle:{color:darkMode?"rgba(255,255,255,.07)":"rgba(20,40,30,.07)"}},axisLabel:{color:darkMode?"#92a29a":"#76827c"}},series:[{type:"line",smooth:true,symbolSize:7,data:sorted.map(v=>v.value),lineStyle:{width:2,color:"#278765"},itemStyle:{color:"#278765"},areaStyle:{color:{type:"linear",x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:"rgba(39,135,101,.22)"},{offset:1,color:"rgba(39,135,101,0)"}]}},markLine:{silent:true,symbol:"none",lineStyle:{type:"dashed",color:"#c5913d"},data:[{yAxis:metric.target,label:{formatter:`目标 ${metric.target}`}}]}}]}); const resize=()=>chart.resize();window.addEventListener("resize",resize);return()=>{window.removeEventListener("resize",resize);chart.dispose()}; },[metric,values,darkMode]);
  return <div ref={ref} style={{height:260,width:"100%"}}/>;
}
