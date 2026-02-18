import React from 'react';
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl/mapbox';
import { Card, CardContent } from "@/components/ui/card";
import { Ship, Navigation, Wind, Waves } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
    london: { lat: 51.5074, lng: -0.1278 },
    hamburg: { lat: 53.5511, lng: 9.9937 },
    rotterdam: { lat: 51.9225, lng: 4.4792 },
    newyork: { lat: 40.7128, lng: -74.0060 },
    "new york": { lat: 40.7128, lng: -74.0060 },
    shanghai: { lat: 31.2304, lng: 121.4737 },
    singapore: { lat: 1.3521, lng: 103.8198 },
    tokyo: { lat: 35.6762, lng: 139.6503 },
    miami: { lat: 25.7617, lng: -80.1918 },
    brisbane: { lat: -27.4698, lng: 153.0251 },
    losangeles: { lat: 34.0522, lng: -118.2437 },
    "los angeles": { lat: 34.0522, lng: -118.2437 }
};

const resolveCoords = (place?: string) => {
    const raw = (place || '').toLowerCase();
    for (const [key, coords] of Object.entries(CITY_COORDS)) {
        if (raw.includes(key)) return coords;
    }
    return { lat: 51.5074, lng: -0.1278 };
};

export const LiveVesselMap = ({
    shipmentId,
    origin,
    destination,
    progress = 0
}: {
    shipmentId: string;
    origin: string;
    destination: string;
    progress?: number;
}) => {
    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
    const start = resolveCoords(origin);
    const end = resolveCoords(destination);
    const t = Math.max(0, Math.min(1, (progress || 45) / 100));
    const vessel = {
        lat: start.lat + (end.lat - start.lat) * t,
        lng: start.lng + (end.lng - start.lng) * t
    };
    const center = {
        latitude: (start.lat + end.lat) / 2,
        longitude: (start.lng + end.lng) / 2
    };

    const routeGeoJson = {
        type: 'FeatureCollection' as const,
        features: [
            {
                type: 'Feature' as const,
                geometry: {
                    type: 'LineString' as const,
                    coordinates: [
                        [start.lng, start.lat],
                        [end.lng, end.lat]
                    ]
                },
                properties: {}
            }
        ]
    };

    return (
        <Card className="w-full overflow-hidden border-slate-200 shadow-lg bg-white">
            <div className="relative h-80 w-full overflow-hidden">
                {mapboxToken ? (
                    <Map
                        mapboxAccessToken={mapboxToken}
                        initialViewState={{
                            latitude: center.latitude,
                            longitude: center.longitude,
                            zoom: 2
                        }}
                        mapStyle="mapbox://styles/mapbox/navigation-night-v1"
                        style={{ width: '100%', height: '100%' }}
                    >
                        <NavigationControl position="top-right" />

                        <Source id={`route-${shipmentId}`} type="geojson" data={routeGeoJson as any}>
                            <Layer
                                id={`route-line-${shipmentId}`}
                                type="line"
                                paint={{
                                    'line-color': '#22c55e',
                                    'line-width': 3,
                                    'line-opacity': 0.85
                                }}
                            />
                        </Source>

                        <Marker latitude={start.lat} longitude={start.lng}>
                            <div className="h-3 w-3 rounded-full bg-white border border-slate-300 shadow" />
                        </Marker>

                        <Marker latitude={end.lat} longitude={end.lng}>
                            <div className="h-3 w-3 rounded-full bg-slate-300 border border-slate-500 shadow" />
                        </Marker>

                        <Marker latitude={vessel.lat} longitude={vessel.lng}>
                            <div className="relative">
                                <div className="absolute -inset-3 rounded-full bg-emerald-400/30 animate-pulse" />
                                <div className="relative rounded-full bg-emerald-500 p-2 border border-slate-900 shadow-lg">
                                    <Ship className="w-4 h-4 text-slate-900" />
                                </div>
                            </div>
                        </Marker>
                    </Map>
                ) : (
                    <div className="h-full w-full bg-slate-900 text-slate-200 flex items-center justify-center text-sm">
                        Missing `VITE_MAPBOX_TOKEN` for map view
                    </div>
                )}
            </div>

            <CardContent className="p-4 bg-slate-50 grid grid-cols-3 divide-x divide-slate-200">
                <div className="px-4 first:pl-0 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <Navigation className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 font-medium uppercase">Distance</div>
                        <div className="text-sm font-bold text-slate-900">4,230 NM</div>
                    </div>
                </div>
                <div className="px-4 flex items-center gap-3">
                    <div className="p-2 bg-cyan-100 rounded-lg text-cyan-600">
                        <Wind className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 font-medium uppercase">Weather</div>
                        <div className="text-sm font-bold text-slate-900">Fair / 12kts</div>
                    </div>
                </div>
                <div className="px-4 flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                        <Waves className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 font-medium uppercase">Draft</div>
                        <div className="text-sm font-bold text-slate-900">14.2m</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
