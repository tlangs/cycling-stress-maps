import "./WuTurnMap.css";
import { useRef, useEffect, type RefObject, type ReactElement } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import lanes from "../../assets/wuturn-annotated.json";
import neighborhoodsCollection from "../../assets/neighborhoods.json";
import neighborhoodsMask from "../../assets/neighborhoodsMask.json";
const lastMapCenterKey = "lastMapCenter";
const lastZoomLevelKey = "lastZoomLevel";

const neighborhoods = neighborhoodsCollection.features.reduce(
  (acc, feature) => {
    // @ts-expect-error these actually are compatible
    acc[feature.properties.name] = feature;
    return acc;
  },
  {} as { [name: string]: GeoJSON.Feature },
);

function Mapbox(): ReactElement {
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
      style: "mapbox://styles/mapbox/standard",
      config: {
        basemap: {
          theme: "monochrome",
        },
      },
      maxBounds: [
        [-71.39417, 42.13907],
        [-70.9029, 42.45938],
      ],
    });

    mapRef.current.on("load", () => {
      mapRef.current.addSource("infrastructure", {
        type: "geojson",
        data: lanes.featureCollection as GeoJSON.FeatureCollection,
      });
      mapRef.current.addSource("neighborhoods", {
        type: "geojson",
        data: neighborhoodsCollection as GeoJSON.FeatureCollection,
      });
      mapRef.current.addSource("neighborhoods-mask", {
        type: "geojson",
        data: neighborhoodsMask as GeoJSON.Feature,
      });

      mapRef.current.addLayer({
        id: "state-path",
        type: "line",
        source: "infrastructure",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#9d4040",
          "line-opacity": 1,
          "line-width": 3,
        },
      });

      mapRef.current.addLayer({
        id: "clickable",
        type: "line",
        source: "infrastructure",
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

      // mapRef.current.addLayer({
      //   id: "neighborhoods-mask",
      //   type: "fill",
      //   source: "neighborhoods-mask",
      //   paint: {
      //     "fill-color": "black",
      //     "fill-opacity": 0.5,
      //   },
      // });

      // mapRef.current.addLayer({
      //   id: "neighborhoods",
      //   type: "fill",
      //   source: "neighborhoods",
      //   paint: {
      //     "fill-color": "grey",
      //     "fill-opacity": 0.75,
      //   },
      // });
    });

    mapRef.current.on("mouseenter", "clickable", () => {
      mapRef.current.getCanvas().style.cursor = "pointer";
    });
    mapRef.current.on("mouseleave", "clickable", () => {
      mapRef.current.getCanvas().style.cursor = "";
    });

    mapRef.current.on("click", "clickable", (e) => {
      if (e.features && e.features[0] && e.features[0].properties) {
        const props = e.features[0].properties;

        const html = PopupHTML(props);

        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(html)
          .addTo(mapRef.current);
      }
    });

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
  }, []);

  return (
    <>
      <div id="map" ref={mapContainerRef} style={{ height: "100%" }} />
    </>
  );
}

function PopupHTML(properties: GeoJSON.GeoJsonProperties): string {
  if (properties === null) {
    return "";
  }
  const cycling = `<tr><td>Cycling facilities:</td><td>
  ${
    properties["cycleway"]
      ? Object.entries(JSON.parse(properties["cycleway"]))
          .filter(([key]) => key != "wayOsmId")
          .map(([key, value]) => `${key}: ${value}`)
          .join("<br/>")
      : "None"
  }</td></tr>`;

  let html = "<table>";
  html += `<tr><td>Name:</td><td>${properties["name"]}</td></tr>`;
  html += `<tr><td>Type of road:</td><td>${properties["highway"]}</td></tr>`;
  html += `<tr><td>Speed:</td><td>${properties["speed"]}mph</td></tr>`;
  html += `<tr><td>Lanes:</td><td>${properties["lanes"]}</td></tr>`;
  html += `<tr><td>Condition:</td><td>${properties["condition"]}</td></tr>`;
  html += `<tr><td>Surface:</td><td>${properties["surface"]}</td></tr>`;
  html += cycling;
  html += `<tr><td>OSM ID:</td><td><a href="https://www.openstreetmap.org/way/${properties["osmId"]}">${properties["osmId"]}</a></td></tr>`;
  html += "</table>";
  return html;
}

export default Mapbox;
