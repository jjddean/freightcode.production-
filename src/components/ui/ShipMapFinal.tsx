
import React, { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Ship, Package, Navigation } from 'lucide-react';
import { createRoot } from 'react-dom/client';

interface ShipmentMapProps {
    className?: string;
    minimal?: boolean;
    shipments?: any[];
    focusedId?: string | null;
    height?: number;
}

const CITY_COORDS: Record<string, [number, number]> = {
    'London': [-0.1278, 51.5074],
    'Hamburg': [9.9937, 53.5511],
    'Shanghai': [121.4737, 31.2304],
    'Felixstowe': [1.3515, 51.9642],
    'Rotterdam': [4.4777, 51.9244],
    'Singapore': [103.8198, 1.3521],
    'Miami': [-80.1918, 25.7617],
    'Southampton': [-1.4044, 50.9097],
    'New York': [-74.0060, 40.7128],
    'Tokyo': [139.6503, 35.6762],
    'Dubai': [55.2708, 25.2048],
    'Long Beach': [-118.1937, 33.7701],
};

export function ShipmentMap({
    className = '',
    minimal = false,
    shipments,
    focusedId,
    height
}: ShipmentMapProps) {
    const liveShipmentsQuery = useQuery(api.shipments.listShipments, { onlyMine: true });
    const liveShipments = shipments || liveShipmentsQuery;

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const [isMapReady, setIsMapReady] = useState(false);

    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

    // 1. Initialize Map
    useEffect(() => {
        if (!MAPBOX_TOKEN || !mapContainerRef.current || mapRef.current) return;

        // check for webgl support
        if (!mapboxgl.supported()) {
            mapContainerRef.current.innerHTML = '<div style="display:flex;align-items:center;justify-center;height:100%;color:gray;">Map not supported</div>';
            return;
        }

        // Clear container to avoid Mapbox warnings
        mapContainerRef.current.innerHTML = '';

        mapboxgl.accessToken = MAPBOX_TOKEN;

        try {
            const map = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: 'mapbox://styles/mapbox/satellite-streets-v12',
                center: [0, 20],
                zoom: 1.5,
                attributionControl: false
            });

            map.on('error', (e) => {
                console.error('Mapbox error:', e);
                // Handle context loss or other runtime errors
                if (e.error?.message === 'Failed to initialize WebGL') {
                    setIsMapReady(false);
                    if (mapContainerRef.current) {
                        mapContainerRef.current.innerHTML = '<div class="p-4 text-center text-sm text-gray-500 bg-gray-100 h-full flex items-center justify-center">Map 3D Context Failed</div>';
                    }
                }
            });

            map.on('load', () => {
                mapRef.current = map;
                setIsMapReady(true);
                // Initial resize to ensure canvas fills container
                map.resize();
                setTimeout(() => map.resize(), 100);
            });
        } catch (error) {
            console.error("Map initialization failed:", error);
            if (mapContainerRef.current) {
                mapContainerRef.current.innerHTML = '<div class="p-4 text-center text-sm text-gray-500 bg-gray-100 h-full flex items-center justify-center">Map Could Not Load</div>';
            }
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [MAPBOX_TOKEN]);

    // 2. Manage Markers
    useEffect(() => {
        if (!isMapReady || !mapRef.current || !liveShipments) return;

        // Clear existing markers
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        const shipmentLocations = liveShipments
            .filter((s: any) => s.shipmentDetails?.origin && s.shipmentDetails?.destination)
            .map((s: any) => {
                const originCity = s.shipmentDetails.origin.split(',')[0].trim();
                const destCity = s.shipmentDetails.destination.split(',')[0].trim();
                const coords = CITY_COORDS[destCity] || CITY_COORDS[originCity] || [0, 0];

                return {
                    id: s.shipmentId,
                    lng: coords[0],
                    lat: coords[1],
                    label: destCity || originCity || 'Unknown',
                    status: s.status,
                    origin: s.shipmentDetails.origin,
                    destination: s.shipmentDetails.destination
                };
            });

        const displayData = shipmentLocations.length > 0 ? shipmentLocations : [
            { id: '1', lat: 51.5074, lng: -0.1278, label: 'London', status: 'In Transit', origin: 'London, UK', destination: 'Hamburg, DE' },
            { id: '2', lat: 40.7128, lng: -74.0060, label: 'New York', status: 'Delivered', origin: 'Shanghai, CN', destination: 'New York, US' },
            { id: '3', lat: 35.6762, lng: 139.6503, label: 'Tokyo', status: 'In Transit', origin: 'Singapore, SG', destination: 'Tokyo, JP' },
            { id: '4', lat: 1.3521, lng: 103.8198, label: 'Singapore', status: 'Loading', origin: 'Dubai, AE', destination: 'Singapore, SG' },
        ];

        displayData.forEach(shipment => {
            const el = document.createElement('div');
            el.className = 'marker-root';

            // Marker UI remains React for the status-colored icons
            const root = createRoot(el);
            root.render(
                <div className="group cursor-pointer relative">
                    {shipment.status === 'In Transit' && (
                        <div className="absolute -inset-2 bg-blue-500 rounded-full opacity-30 animate-ping"></div>
                    )}
                    <div className={`p-2 rounded-full shadow-lg transition-transform transform group-hover:scale-110 ${shipment.status === 'Delivered' ? 'bg-green-500 text-white' :
                        shipment.status === 'In Transit' ? 'bg-blue-500 text-white' :
                            'bg-orange-500 text-white'
                        }`}>
                        <Ship size={16} />
                    </div>
                </div>
            );

            const statusColor = shipment.status === 'Delivered' ? 'text-green-600 bg-green-50' :
                shipment.status === 'In Transit' ? 'text-blue-600 bg-blue-50' :
                    'text-orange-600 bg-orange-50';

            const popup = new mapboxgl.Popup({ offset: 25, closeButton: true, className: 'custom-mapbox-popup' })
                .setHTML(`
                    <div style="padding: 10px; min-width: 220px; color: #1a1a1a;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="font-weight: 700; font-size: 13px;">${shipment.id}</span>
                            <span style="font-size: 11px; padding: 2px 8px; border-radius: 99px; font-weight: 500; ${shipment.status === 'Delivered' ? 'background: #f0fdf4; color: #166534;' :
                        shipment.status === 'In Transit' ? 'background: #eff6ff; color: #1e40af;' :
                            'background: #fff7ed; color: #9a3412;'
                    }">${shipment.status}</span>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <div style="display: flex; align-items: start; gap: 8px;">
                                <div style="color: #94a3b8; font-size: 10px; text-transform: uppercase;">Origin</div>
                                <div style="font-size: 12px; color: #475569;">${shipment.origin}</div>
                            </div>
                            <div style="display: flex; align-items: start; gap: 8px;">
                                <div style="color: #94a3b8; font-size: 10px; text-transform: uppercase;">Destination</div>
                                <div style="font-size: 12px; color: #475569;">${shipment.destination}</div>
                            </div>
                        </div>
                    </div>
                `);

            const marker = new mapboxgl.Marker(el)
                .setLngLat([shipment.lng, shipment.lat])
                .setPopup(popup)
                .addTo(mapRef.current!);

            markersRef.current.push(marker);
        });
    }, [isMapReady, liveShipments]);

    // 3. Robust Resize Logic for Animations
    useEffect(() => {
        if (!isMapReady || !mapRef.current) return;

        let raf = 0;
        const start = performance.now();
        const duration = 1000; // Run longer than the 500ms CSS transition to be safe

        const tick = (t: number) => {
            if (mapRef.current) {
                mapRef.current.resize();
            }
            if (t - start < duration) {
                raf = requestAnimationFrame(tick);
            }
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [isMapReady, minimal]);

    // Remove ResizeObserver as it can conflict with the high-frequency RAF pump during animations
    // useEffect(() => {
    //     const el = mapContainerRef.current;
    //     if (!el) return;

    //     const ro = new ResizeObserver(() => {
    //         mapRef.current?.resize();
    //     });

    //     ro.observe(el);

    //     return () => ro.disconnect();
    // }, []);

    if (!MAPBOX_TOKEN) {
        return (
            <div className={"p-8 bg-slate-900 text-white rounded-lg flex items-center justify-center " + className}>
                <p>Mapbox Token Missing</p>
            </div>
        );
    }

    return (
        <div
            ref={mapContainerRef}
            className={"relative overflow-hidden w-full h-full " + className}
            style={height ? { height: height + "px" } : {}}
        >
            <style>{`
                ${minimal ? `
                    .mapboxgl-control-container, .mapboxgl-ctrl-logo, .mapboxgl-ctrl-attrib { display: none !important; }
                ` : ''}
            `}</style>
        </div>
    );
}
