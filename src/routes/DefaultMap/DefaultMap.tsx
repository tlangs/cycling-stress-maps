import "./DefaultMap.css";
import {
  useRef,
  useEffect,
  type RefObject,
  type ReactElement,
  useState,
  useMemo,
} from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import lanes from "../../assets/default-annotated-geojson.json";
import neighborhoodsCollection from "../../assets/neighborhoods.json";
import haversine from "haversine-distance";
import robustPointInPolygon from "robust-point-in-polygon";

const lastMapCenterKey = "lastMapCenter";
const lastZoomLevelKey = "lastZoomLevel";

const menuStyle = {
  // background: "#fff",
  position: "absolute" as const,
  zIndex: 1,
  top: 10,
  right: 10,
  borderRadius: 3,
  width: "160px",
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

const neighborhoods = neighborhoodsCollection.features.reduce(
  (acc, feature) => {
    // @ts-expect-error these actually are compatible
    acc[feature.properties.name] = feature;
    return acc;
  },
  {} as { [name: string]: GeoJSON.Feature },
);

const neighborhoodNames = Object.keys(neighborhoods).sort();
const initialNeighborhoodsSelected = neighborhoodNames.reduce(
  (acc, name) => {
    acc[name] = false;
    return acc;
  },
  {} as { [name: string]: boolean },
);

const lengthOfCoordinatesWithinNeighborhoods = (
  feature: GeoJSON.Feature,
  neighborhoodFeatures: GeoJSON.Feature[],
): number => {
  let totalDistance = 0;
  neighborhoodFeatures.forEach((neighborhood) => {
    totalDistance += lengthWithinNeighborhood(feature, neighborhood);
  });
  return totalDistance;
};

const lengthWithinNeighborhood = (
  feature: GeoJSON.Feature,
  neighborhood: GeoJSON.Feature,
): number => {
  let dist = 0;
  let last: undefined | GeoJSON.Position = undefined;
  let polygonsToCheck: GeoJSON.Position[][][] = [];
  if (neighborhood.geometry.type === "MultiPolygon") {
    polygonsToCheck = neighborhood.geometry.coordinates;
  } else {
    polygonsToCheck = [
      // @ts-expect-error coordinates actually do exist
      neighborhood.geometry.coordinates as GeoJSON.Position[][],
    ];
  }

  // @ts-expect-error coordinates actually do exist
  feature.geometry.coordinates.forEach((coord) => {
    const itsIn = polygonsToCheck.some(
      // @ts-expect-error Point from robustPointInPolygon not exported
      (polygon) => robustPointInPolygon(polygon[0], coord) <= 0,
    );
    if (itsIn && last !== undefined) {
      // @ts-expect-error haversine Coordinates and GeoJSON Positions are compatible
      dist += haversine(last, coord);
      last = coord;
    } else if (itsIn && last === undefined) {
      last = coord;
    } else {
      last = undefined;
    }
  });
  return dist;
};

function Mapbox(): ReactElement {
  const mapRef: RefObject<mapboxgl.Map> = useRef(
    null as unknown as mapboxgl.Map,
  );
  const mapContainerRef: RefObject<HTMLDivElement> = useRef(
    null as unknown as HTMLDivElement,
  );

  const allLayerIds = useMemo(
    () => ["dcr-path", "protected", "unprotected"],
    [],
  );

  const [activeLayerIds, setActiveLayerIds] = useState(allLayerIds);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [neighborhoodsSelected, setNeighborhoodsSelected] = useState(
    initialNeighborhoodsSelected,
  );
  const [showNeighborhoods, setShowNeighborhoods] = useState(false);

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
  }, [activeLayerIds, mapLoaded, allLayerIds]);

  const handleInfraClick = (e: any, layerId: string) => {
    if (activeLayerIds.includes(layerId)) {
      setActiveLayerIds(activeLayerIds.filter((d) => d !== layerId));
    } else {
      setActiveLayerIds([...activeLayerIds, layerId]);
    }
  };

  const neighborhoodsToCheck = [] as GeoJSON.Feature[];
  neighborhoodNames.map((name) => {
    if (neighborhoodsSelected[name]) {
      neighborhoodsToCheck.push(neighborhoods[name]);
    }
  });
  const allNeighborhoodsSelected =
    neighborhoodsToCheck.length === neighborhoodNames.length;
  const noNeighborhoodsSelected = neighborhoodsToCheck.length === 0;

  const lengthInMiles =
    lanes.featureCollection.features
      .filter((feature) =>
        activeLayerIds.includes(feature.properties["category"]),
      )
      .reduce((acc, feature) => {
        if (allNeighborhoodsSelected || noNeighborhoodsSelected) {
          return feature.properties?.length + acc;
        } else {
          return (
            acc +
            lengthOfCoordinatesWithinNeighborhoods(
              feature as GeoJSON.Feature,
              neighborhoodsToCheck,
            )
          );
        }
      }, 0) * milesPerMeter;
  const miles = Math.round(lengthInMiles * 100) / 100;

  const handleNeighborhoodChange = (e: any, neighborhood: string) => {
    const newSelected = {
      ...neighborhoodsSelected,
    };
    newSelected[neighborhood] = !newSelected[neighborhood];
    setNeighborhoodsSelected(newSelected);
  };

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
            background: "#3852B4",
            borderBottom: "1px solid rgba(0, 0, 0, 0.25)",
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
          onClick={(e) => handleInfraClick(e, "dcr-path")}
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
          onClick={(e) => handleInfraClick(e, "protected")}
        >
          Protected Infrastructure
        </button>
        <button
          id="unprotected"
          style={{
            ...menuItemStyle,
            ...(activeLayerIds.includes("unprotected") && activeMenuItemStyle),
            borderBottom: "1px solid rgba(0, 0, 0, 0.25)",
          }}
          onClick={(e) => handleInfraClick(e, "unprotected")}
        >
          Unprotected Infrastructure
        </button>
        <button
          id="miles"
          style={{
            ...menuItemStyle,
            ...(showNeighborhoods && activeMenuItemStyle),
            marginTop: "1em",
          }}
          onClick={(_) => setShowNeighborhoods(!showNeighborhoods)}
        >
          {showNeighborhoods ? "Hide" : "Show"} Neighborhoods
        </button>
        <div>
          <div
            style={{
              ...menuItemStyle,
              padding: "0",
              ...activeMenuItemStyle,
            }}
          ></div>
          {showNeighborhoods &&
            neighborhoodNames.map((name) => (
              <div
                style={{
                  ...menuItemStyle,
                  padding: "0",
                  ...activeMenuItemStyle,
                  textAlign: "left",
                  cursor: "default",
                }}
              >
                <input
                  type="checkbox"
                  id={`${name}-checkbox`}
                  name={`${name}-checkbox`}
                  checked={neighborhoodsSelected[name]}
                  onChange={(e: any) => handleNeighborhoodChange(e, name)}
                />
                <label htmlFor={`${name}-checkbox`}>{name}</label>
              </div>
            ))}
        </div>
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
