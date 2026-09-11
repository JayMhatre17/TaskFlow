"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TaskChartData = {
  status: string;
  value: number;
};

type TaskChartProps = {
  data: TaskChartData[];
};

const TaskChart = ({ data }: TaskChartProps) => {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="status" tickLine={false} axisLine={false} />

          <YAxis allowDecimals={false} tickLine={false} axisLine={false} />

          <Tooltip />

          <Bar dataKey="value" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TaskChart;
