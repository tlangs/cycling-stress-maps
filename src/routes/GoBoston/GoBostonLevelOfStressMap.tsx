import "./GoBostonLevelOfStressMap.css";
import {
  type ReactElement,
  useState,
  Fragment,
  useEffect,
  type RefObject,
  useRef,
} from "react";

import mapboxgl, { type ExpressionSpecification } from "mapbox-gl";
import goBoston from "../../assets/GoBoston/go-boston-annotated-geojson.json";
import LevelOfStressLegend from "../../components/LevelOfStressLegend/LevelOfStressLegend";
import GoBostonLegend from "../../components/GoBoston/GoBostonLegend/GoBostonLegend";
import goBostonProjectLinks from "../../assets/GoBoston/project-websites.json";

const routes = [goBoston.featureCollection] as GeoJSON.FeatureCollection[];

const routeNames = ["goBoston"];

const lastMapCenterKey = "lastMapCenter";
const lastZoomLevelKey = "lastZoomLevel";

const stressLevelFourHex = "#d31f11";
const stressLevelThreeHex = "#f47a00";
const stressLevelTwoHex = "#62c8d3";
const stressLevelOneHex = "#007191";
const stressLevelUnknownHex = "grey";
const footpathHex = "#62c8d3";

const lts4Expr = ["==", ["get", "lts"], 4];
const lts3Expr = ["==", ["get", "lts"], 3];
const lts2Expr = ["==", ["get", "lts"], 2];
const lts1Expr = ["==", ["get", "lts"], 1];
const footpathExpr = ["==", ["get", "highway"], "footway"];

function GoBostonLevelOfSressMap(): ReactElement {
  const [showLevelOfStress, setShowLevelOfStress] = useState(false);
  const showExistingInfrastructure = false;

  const filteredRoutes = routes.map((r) => {
    if (!showExistingInfrastructure) {
      return {
        ...r,
        features: r.features.filter((f) =>
          ["future", "priority"].includes(f.properties?.["goBoston"]),
        ),
      };
    }
    return r;
  });

  const ltsPaint = {
    "line-color": [
      "case",
      lts4Expr,
      stressLevelFourHex,
      lts3Expr,
      stressLevelThreeHex,
      lts2Expr,
      stressLevelTwoHex,
      lts1Expr,
      stressLevelOneHex,
      footpathExpr,
      footpathHex,
      stressLevelUnknownHex,
    ] as ExpressionSpecification,
    "line-opacity": 1,
    "line-width": 2,
  };

  const goBostonExisting = ["==", ["get", "goBoston"], "existing"];
  const goBostonFuture = ["==", ["get", "goBoston"], "future"];
  const goBostonPriority = ["==", ["get", "goBoston"], "priority"];

  // const goBostonExistingHex = '#B5C1B8'
  const goBostonExistingHex = "#a0a0a0";
  const goBostonFutureHex = "#71AA88";
  const goBostonPriorityHex = "#03694B";
  const goBostonDefaultHex = "#202020";

  const goBostonPriorityPaint = {
    "line-color": [
      "case",
      goBostonExisting,
      goBostonExistingHex,
      goBostonFuture,
      goBostonFutureHex,
      goBostonPriority,
      goBostonPriorityHex,
      goBostonDefaultHex,
    ] as ExpressionSpecification,
    "line-width": showLevelOfStress ? 10 : 6,
    "line-opacity": showLevelOfStress ? 0.7 : 1,
  };

  const mapRef: RefObject<mapboxgl.Map> = useRef(
    null as unknown as mapboxgl.Map,
  );
  const mapContainerRef: RefObject<HTMLDivElement> = useRef(
    null as unknown as HTMLDivElement,
  );

  useEffect(() => {
    mapboxgl.accessToken =
      "pk.eyJ1IjoidGxhbmdzZm9yZCIsImEiOiJjbWM4MTkzMGYxaGJxMmxwdGdweTVqb3RhIn0.S0CyG6BWDXPKNyG-mjJQOQ";
    const localStorageLastCenter =
      window.localStorage.getItem(lastMapCenterKey);
    const initialCenter = localStorageLastCenter
      ? JSON.parse(localStorageLastCenter)
      : { lng: -71.09679412683583, lat: 42.33081574894257 };
    const localStorageLastZoom = window.localStorage.getItem(lastZoomLevelKey);
    const initialZoom = localStorageLastZoom
      ? parseFloat(localStorageLastZoom)
      : 12.0;
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      center: initialCenter,
      zoom: initialZoom,
      style: "mapbox://styles/tlangsford/cmc9o4u7902f401s278a2da92",
      maxBounds: [
        [-71.39417, 42.13907],
        [-70.9029, 42.45938],
      ],
    });

    for (let i = 0; i < filteredRoutes.length; i++) {
      const route = filteredRoutes[i];
      const routeName = routeNames[i];
      mapRef.current.on("load", () => {
        mapRef.current.addSource(`${routeName}Source`, {
          type: "geojson",
          data: route as GeoJSON.FeatureCollection,
        });
      });
    }

    for (const routeName of routeNames) {
      mapRef.current.on("load", () => {
        mapRef.current.addLayer({
          id: routeName + ":priority",
          type: "line",
          source: `${routeName}Source`,
          slot: "middle",
          layout: {
            "line-join": "bevel",
            "line-cap": "round",
          },
          paint: goBostonPriorityPaint,
        });

        mapRef.current.addLayer({
          id: routeName + ":clickable",
          type: "line",
          source: `${routeName}Source`,
          layout: {
            "line-join": "bevel",
            "line-cap": "round",
          },
          paint: {
            "line-color": "white",
            "line-width": 20,
            "line-opacity": 0,
          },
        });

        if (showLevelOfStress) {
          mapRef.current.addLayer({
            id: routeName,
            type: "line",
            source: `${routeName}Source`,
            layout: {
              "line-join": "bevel",
              "line-cap": "round",
            },
            paint: ltsPaint,
          });
        }
      });
    }

    mapRef.current.on(
      "mouseenter",
      routeNames.map((r) => r + ":clickable"),
      () => {
        mapRef.current.getCanvas().style.cursor = "pointer";
      },
    );
    mapRef.current.on(
      "mouseleave",
      routeNames.map((r) => r + ":clickable"),
      () => {
        mapRef.current.getCanvas().style.cursor = "";
      },
    );

    mapRef.current.on(
      "click",
      routeNames.map((r) => r + ":clickable"),
      (e) => {
        if (e.features && e.features[0] && e.features[0].properties) {
          const props = e.features[0].properties;

          var html = LevelOfTrafficStressPopupHTML(props);

          new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(html)
            .addTo(mapRef.current);
        }
      },
    );

    mapRef.current.on("moveend", (e) => {
      window.localStorage.setItem(
        lastMapCenterKey,
        JSON.stringify(e.target.getCenter()),
      );
    });

    mapRef.current.on("zoomend", (e) => {
      window.localStorage.setItem(lastZoomLevelKey, String(e.target.getZoom()));
    });

    return () => {
      mapRef.current.remove();
    };
  });

  return (
    <Fragment>
      <div id="root">
        {showLevelOfStress && (
          <LevelOfStressLegend
            colorScale={[
              stressLevelOneHex,
              stressLevelTwoHex,
              stressLevelThreeHex,
              stressLevelFourHex,
            ]}
          />
        )}
        <GoBostonLegend
          colorScale={[goBostonFutureHex, goBostonPriorityHex]}
          showLevelOfStress={showLevelOfStress}
          setShowLevelOfStress={setShowLevelOfStress}
        />
        {/* { showLevelOfStress && <RoutePieChart routes={routes} colorMap={{1: stressLevelOneHex, 2: stressLevelTwoHex, 3: stressLevelThreeHex, 4: stressLevelFourHex}}/> } */}
        <div id="map-container" ref={mapContainerRef} />
      </div>
    </Fragment>
  );
}

function LevelOfTrafficStressPopupHTML(properties: { [name: string]: any }) {
  const cycling = `<tr><td>Cycling facilities:</td><td>
  ${
    properties["cycleway"]
      ? Object.entries(JSON.parse(properties["cycleway"]))
          .filter(([key, _]) => key != "wayOsmId")
          .map(([key, value]) => `${key}: ${value}`)
          .join("<br/>")
      : "None"
  }</td></tr>`;

  const projectName: string | undefined = properties["project"];
  const projectLink = projectName
    ? (goBostonProjectLinks as Record<string, string | null>)[projectName]
    : undefined;

  let project;

  if (projectName && !projectLink) {
    project = `<tr><td>Project:</td><td>${projectName}</td></tr>`;
  } else if (projectName && projectLink) {
    project = `<tr><td>Project:</td><td><a href="${projectLink}" target="_blank">${projectName}</a></td></tr>`;
  } else {
    project = "";
  }

  let html = "<table>";
  html += "<tr>";
  html += `<td><img src="https://raw.githubusercontent.com/BostonCyclistsUnion/Website/refs/heads/main/public/Icon_LTS${properties["lts"]}.svg" width="100px"/></td>`;
  html += `<td><img src="https://raw.githubusercontent.com/BostonCyclistsUnion/Website/refs/heads/main/public/Text_LTS${properties["lts"]}.svg"/></td>`;
  html += "</tr>";
  html += `<tr><td>Name:</td><td>${properties["name"]}</td></tr>`;
  html += project;
  html += `<tr><td>Type of road:</td><td>${properties["highway"]}</td></tr>`;
  html += `<tr><td>Speed:</td><td>${properties["speed"]}mph</td></tr>`;
  html += `<tr><td>Lanes:</td><td>${properties["lanes"]}</td></tr>`;
  html += `<tr><td>Condition:</td><td>${properties["condition"]}</td></tr>`;
  html += cycling;
  html += `<tr><td>OSM ID:</td><td><a href="https://www.openstreetmap.org/way/${properties["osmId"]}">${properties["osmId"]}</a></td></tr>`;
  html += "</table>";
  return html;
}

export default GoBostonLevelOfSressMap;
