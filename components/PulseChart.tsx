import { Chart, Axis, Line, Tooltip } from 'evilcharts';

const PulseChart = ({ data }: { data: any[] }) => {
  return (
    <Chart data={data}>
      <Axis type="x" />
      <Axis type="y" />
      <Line field="pulse" color="#FF2D55" />
      <Tooltip />
    </Chart>
  )
}

export default PulseChart