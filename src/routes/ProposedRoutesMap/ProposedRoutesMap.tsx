import './ProposedRoutesMap.css'
import { useRef, useEffect, type RefObject, type ReactElement } from 'react'
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import GeoJson from '../../assets/proposed-routes-geojson.json';

function getRandomColor(): string {
  const letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function routes(): number[] {
  const set = new Set<number>();
  GeoJson.features.forEach((feature) => {
    set.add(feature.properties.routeId)
  })
  return Array.from(set)
}

const routeIdToColor: Map<number, string> = new Map(routes().map(routeId => [routeId, getRandomColor()]))

function Mapbox(): ReactElement {

  const mapRef: RefObject<mapboxgl.Map> = useRef(null as unknown as mapboxgl.Map);
  const mapContainerRef: RefObject<HTMLDivElement> = useRef(null as unknown as HTMLDivElement);

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoidGxhbmdzZm9yZCIsImEiOiJjbWM4MTkzMGYxaGJxMmxwdGdweTVqb3RhIn0.S0CyG6BWDXPKNyG-mjJQOQ'
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      center: [-71.09549, 42.30450],
      zoom: 10.12,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      maxBounds: [
        [-71.39417, 42.13907],
        [-70.90290, 42.45938]
    ]
    });

    mapRef.current.on('load', () => {
      mapRef.current.addSource('boston-landway', {
        type: 'geojson',
        data: GeoJson as GeoJSON.FeatureCollection,
      });

      routes().forEach((routeId) => {
        mapRef.current.addLayer({
          id: 'lowlevel' + routeId,
          type: 'line',
          source: 'boston-landway',
          layout: {
            'line-join': 'round',
            "line-cap": 'round'
          },
          paint: {
            'line-color': routeIdToColor.get(routeId),
            'line-opacity': 1,
            'line-width': 3,
            'line-dasharray': [.5, 2]
          },
          filter: ['all', ['==', 'routeId', routeId], ['<', 'protectionLevel', 3]]
        });
        mapRef.current.addLayer({
          id: 'midlevel' + routeId,
          type: 'line',
          source: 'boston-landway',
          layout: {
            'line-join': 'round',
            "line-cap": 'round'
          },
          paint: {
            'line-color': routeIdToColor.get(routeId),
            'line-opacity': 1,
            'line-width': 3,
          },
          filter: ['all', ['==', 'routeId', routeId], ['>=', 'protectionLevel', 3], ['<', 'protectionLevel', 6]]
        });
        mapRef.current.addLayer({
          id: 'highlevel' + routeId,
          type: 'line',
          source: 'boston-landway',
          layout: {
            'line-join': 'round',
            "line-cap": 'round'
          },
          paint: {
            'line-color': routeIdToColor.get(routeId),
            'line-opacity': 1,
            'line-width': 3,
            'line-gap-width': .6
          },
          filter: ['all', ['==', 'routeId', routeId], ['>=', 'protectionLevel', 6]]
        });
      })

    })

    return () => {
      mapRef.current.remove()
    }
  }, [])

  return (
    <div id="root">
      <div id='map-container' ref={mapContainerRef} />
    </div>
  )
}

export default Mapbox;