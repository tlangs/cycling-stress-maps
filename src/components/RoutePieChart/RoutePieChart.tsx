import "./RoutePieChart.css";
import { type ReactElement } from "react";
import { PieChart } from "react-minimal-pie-chart";
import haversine from "haversine-distance";

type RoutePieChartProps = {
  title: string;
  routes: GeoJSON.FeatureCollection[];
  colorMap: { [key: number]: string };
};

function RoutePieChart({
  title,
  routes,
  colorMap,
}: RoutePieChartProps): ReactElement {
  routes.forEach((r) => {
    r.features.forEach((f: GeoJSON.Feature) => {
      let last = (f.geometry as GeoJSON.LineString).coordinates[0];
      if (f.properties) {
        f.properties["lengthInMeters"] = 0;
      }
      (f.geometry as GeoJSON.LineString).coordinates.forEach((coord) => {
        if (f.properties) {
          f.properties["lengthInMeters"] += haversine(
            { lat: last[1], lon: last[0] },
            { lat: coord[1], lon: coord[0] },
          );
        }
        last = coord;
      });
    });
  });

  const byWayId = routes
    .flatMap((r) => r.features)
    .reduce((acc: Map<string | number, GeoJSON.Feature>, curr) => {
      if (curr.id && acc.has(curr.id)) {
        const stored = acc.get(curr.id);
        const storedLength = stored?.properties!["lengthInMeters"] as number;
        const currLength = curr.properties!["lengthInMeters"] as number;
        if (currLength > storedLength) {
          acc.set(curr.id, curr);
        }
      } else if (curr.id && !acc.has(curr.id)) {
        acc.set(curr.id, curr);
      }
      return acc;
    }, new Map());

  const groups = Object.groupBy(byWayId.values(), (f: GeoJSON.Feature) => {
    if (f.properties) {
      return f.properties["lts"];
    } else {
      return undefined;
    }
  });

  const lts1Length =
    groups[1]?.reduce(
      (acc, curr) => acc + curr.properties!["lengthInMeters"],
      0,
    ) ?? 0;
  const lts2Length =
    groups[2]?.reduce(
      (acc, curr) => acc + curr.properties!["lengthInMeters"],
      0,
    ) ?? 0;
  const lts3Length =
    groups[3]?.reduce(
      (acc, curr) => acc + curr.properties!["lengthInMeters"],
      0,
    ) ?? 0;
  const lts4Length =
    groups[4]?.reduce(
      (acc, curr) => acc + curr.properties!["lengthInMeters"],
      0,
    ) ?? 0;

  const pieChartData = [
    { title: "Level 1", value: lts1Length, color: colorMap[1] as string },
    { title: "Level 2", value: lts2Length, color: colorMap[2] as string },
    { title: "Level 3", value: lts3Length, color: colorMap[3] as string },
    { title: "Level 4", value: lts4Length, color: colorMap[4] as string },
  ];

  const lineWidth = 60;
  return (
    <div className="pie-chart">
      <h3>{title}</h3>
      <PieChart
        className="chart"
        data={pieChartData}
        animate={true}
        label={({ dataEntry }) => Math.round(dataEntry.percentage) + "%"}
        labelPosition={100 - lineWidth / 2}
        lineWidth={lineWidth}
        labelStyle={{
          fill: "#fff",
          opacity: 0.75,
          pointerEvents: "none",
          fontSize: "8pt",
        }}
        style={{
          fontFamily:
            '"Nunito Sans", -apple-system, Helvetica, Arial, sans-serif',
          fontSize: "8px",
        }}
      />
    </div>
  );
}

export default RoutePieChart;
