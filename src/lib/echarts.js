import * as echarts from "echarts/core";
import { LineChart, PieChart } from "echarts/charts";
import { GridComponent, MarkLineComponent, MarkPointComponent, TitleComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  LineChart,
  PieChart,
  GridComponent,
  MarkLineComponent,
  MarkPointComponent,
  TitleComponent,
  TooltipComponent,
  CanvasRenderer,
]);

export { echarts };
