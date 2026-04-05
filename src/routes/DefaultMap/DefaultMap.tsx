import "./DefaultMap.css";
import { useRef, useEffect, type RefObject, type ReactElement } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import protectedLanes from "../../assets/default-annotated-geojson.json";

const lastMapCenterKey = "lastMapCenter";
const lastZoomLevelKey = "lastZoomLevel";

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
      style: "mapbox://styles/tlangsford/cmc9o4u7902f401s278a2da92",
      maxBounds: [
        [-71.39417, 42.13907],
        [-70.9029, 42.45938],
      ],
    });

    mapRef.current.on("load", () => {
      mapRef.current.addSource("protected-bike-lanes", {
        type: "geojson",
        data: protectedLanes.featureCollection as GeoJSON.FeatureCollection,
      });

      mapRef.current.addLayer({
        id: "route",
        type: "line",
        source: "protected-bike-lanes",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "blue",
          "line-opacity": 1,
          "line-width": 3,
        },
      });

      mapRef.current.addLayer({
        id: "protected-bike-lanes:clickable",
        type: "line",
        source: "protected-bike-lanes",
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
    });

    mapRef.current.on("mouseenter", "protected-bike-lanes:clickable", () => {
      mapRef.current.getCanvas().style.cursor = "pointer";
    });
    mapRef.current.on("mouseleave", "protected-bike-lanes:clickable", () => {
      mapRef.current.getCanvas().style.cursor = "";
    });

    mapRef.current.on("click", "protected-bike-lanes:clickable", (e) => {
      if (e.features && e.features[0] && e.features[0].properties) {
        const props = e.features[0].properties;

        const html = PopupHTML(props);

        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(html)
          .addTo(mapRef.current);
      }
    });

    return () => {
      mapRef.current.remove();
    };
  }, []);

  return (
    <div id="root">
      <div id="map-container" ref={mapContainerRef} />
    </div>
  );
}

function PopupHTML(properties: { [name: string]: any }) {
  const cycling = `<tr><td>Cycling facilities:</td><td>
  ${
    properties["cycleway"]
      ? Object.entries(JSON.parse(properties["cycleway"]))
          .filter(([key, _]) => key != "wayOsmId")
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
