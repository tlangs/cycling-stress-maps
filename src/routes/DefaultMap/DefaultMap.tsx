import "./DefaultMap.css";
import {
  useRef,
  useEffect,
  type RefObject,
  type ReactElement,
  useState,
} from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import lanes from "../../assets/default-annotated-geojson.json";

const lastMapCenterKey = "lastMapCenter";
const lastZoomLevelKey = "lastZoomLevel";

const menuStyle = {
  // background: "#fff",
  position: "absolute" as const,
  zIndex: 1,
  top: 10,
  right: 10,
  borderRadius: 3,
  width: "120px",
  border: "1px solid rgba(0, 0, 0, 0.4)",
  fontFamily: "'Open Sans', sans-serif",
};

const menuItemStyle = {
  fontSize: "13px",
  color: "#404040",
  display: "block",
  margin: "0",
  padding: "10px",
  textDecoration: "none",
  border: "none",
  textAlign: "center" as const,
  cursor: "pointer",
  width: "100%",
};

const activeMenuItemStyle = {
  backgroundColor: "#3887be",
  color: "#ffffff",
};

const milesPerMeter = 0.0006213712;

function Mapbox(): ReactElement {
  const mapRef: RefObject<mapboxgl.Map> = useRef(
    null as unknown as mapboxgl.Map,
  );
  const mapContainerRef: RefObject<HTMLDivElement> = useRef(
    null as unknown as HTMLDivElement,
  );

  const allLayerIds = ["dcr-path", "protected", "unprotected"];

  const [activeLayerIds, setActiveLayerIds] = useState(allLayerIds);
  const [miles, setMiles] = useState(0);
  const [mapLoaded, setMapLoaded] = useState(false);

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
      setMapLoaded(true);
      mapRef.current.addSource("infrastructure", {
        type: "geojson",
        data: lanes.featureCollection as GeoJSON.FeatureCollection,
      });

      mapRef.current.addLayer({
        id: "dcr-path",
        type: "line",
        source: "infrastructure",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#409D9B",
          "line-opacity": 1,
          "line-width": 3,
        },
        filter: ["all", ["==", "category", "dcr-path"]],
      });

      mapRef.current.addLayer({
        id: "protected",
        type: "line",
        source: "infrastructure",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#409D9B",
          "line-opacity": 1,
          "line-width": 3,
        },
        filter: ["all", ["==", "category", "protected"]],
      });

      mapRef.current.addLayer({
        id: "unprotected",
        type: "line",
        source: "infrastructure",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#409D9B",
          "line-opacity": 1,
          "line-width": 3,
        },
        filter: ["all", ["==", "category", "unprotected"]],
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

  useEffect(() => {
    if (!mapLoaded) return;

    // for each layerId, check whether it is included in activeLayerIds,
    // show and hide accordingly by setting layer visibility
    allLayerIds.forEach((layerId) => {
      if (activeLayerIds.includes(layerId)) {
        mapRef.current.setLayoutProperty(layerId, "visibility", "visible");
      } else {
        mapRef.current.setLayoutProperty(layerId, "visibility", "none");
      }
    });
  }, [activeLayerIds]);

  const handleClick = (e: any) => {
    const layerId = e.target.id;

    if (activeLayerIds.includes(layerId)) {
      setActiveLayerIds(activeLayerIds.filter((d) => d !== layerId));
    } else {
      setActiveLayerIds([...activeLayerIds, layerId]);
    }
  };

  useEffect(() => {
    const lengthInMiles =
      lanes.featureCollection.features
        .filter((feature) =>
          activeLayerIds.includes(feature.properties["category"]),
        )
        .reduce((acc, feature) => {
          return feature.properties?.length + acc;
        }, 0) * milesPerMeter;
    const rounded = Math.round(lengthInMiles * 100) / 100;
    setMiles(rounded);
  }, [activeLayerIds]);

  return (
    <>
      <nav id="menu" style={menuStyle}>
        <button
          id="miles"
          style={{
            ...menuItemStyle,
            ...activeMenuItemStyle,
            marginBottom: "1em",
            cursor: "default",
          }}
        >
          Miles: {miles}
        </button>

        <button
          id="dcr-path"
          style={{
            ...menuItemStyle,
            ...(activeLayerIds.includes("dcr-path") && activeMenuItemStyle),
            borderBottom: "1px solid rgba(0, 0, 0, 0.25)",
          }}
          onClick={handleClick}
        >
          DCR Bike Path
        </button>
        <button
          id="protected"
          style={{
            ...menuItemStyle,
            ...(activeLayerIds.includes("protected") && activeMenuItemStyle),
            borderBottom: "1px solid rgba(0, 0, 0, 0.25)",
          }}
          onClick={handleClick}
        >
          Protected Infrastructure
        </button>
        <button
          id="unprotected"
          style={{
            ...menuItemStyle,
            ...(activeLayerIds.includes("unprotected") && activeMenuItemStyle),
          }}
          onClick={handleClick}
        >
          Unprotected Infrastructure
        </button>
      </nav>
      <div id="map" ref={mapContainerRef} style={{ height: "100%" }} />
    </>
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
