import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet Default Icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface ShipmentMapProps {
    shipments: any[];
    className?: string;
    onMarkerClick?: (shipmentId: string) => void;
    selectedShipmentId?: string | null;
    isExpanded?: boolean;
}

const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_KEY;

// Component to handle map resizing and flying to selected marker
const MapController = ({ selectedShipment, shipments, isExpanded }: { selectedShipment: any, shipments: any[], isExpanded?: boolean }) => {
    const map = useMap();

    // Force map resize when expanded state changes
    useEffect(() => {
        map.invalidateSize();
    }, [isExpanded, map]);

    useEffect(() => {
        if (selectedShipment?.tracking?.currentLocation?.coordinates) {
            const { lat, lng } = selectedShipment.tracking.currentLocation.coordinates;
            map.flyTo([lat, lng], 10, { duration: 1.5 });
        } else if (shipments.length > 0) {
            // Fit bounds to all shipments
            const bounds = L.latLngBounds(shipments.map(s => {
                const coords = s.tracking?.currentLocation?.coordinates;
                return coords ? [coords.lat, coords.lng] : null;
            }).filter(c => c !== null) as L.LatLngExpression[]);

            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    }, [selectedShipment, shipments, map]);

    return null;
};

export const ShipmentMap: React.FC<ShipmentMapProps> = ({
    shipments,
    className,
    onMarkerClick,
    selectedShipmentId,
    isExpanded = false
}) => {
    const validShipments = shipments?.filter(s => s.tracking?.currentLocation?.coordinates) || [];
    const selectedShipment = validShipments.find(s => s._id === selectedShipmentId);

    // Initial center (Atlantic Ocean view)
    const center: [number, number] = [30, -40];

    return (
        <div className={`relative w-full h-full rounded-lg overflow-hidden transition-all duration-300 ${className}`}>
            <MapContainer
                center={center}
                zoom={3}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={isExpanded} // Only scroll when expanded
                zoomControl={isExpanded}     // Only show zoom controls when expanded
                attributionControl={isExpanded} // Hide attribution in preview mode
                dragging={true}
                doubleClickZoom={isExpanded}
            >
                {/* Geoapify OSM Bright Style (Premium Quality) */}
                <TileLayer
                    attribution='Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap</a> contributors'
                    url={`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_KEY}`}
                />

                {validShipments.map((shipment) => (
                    <Marker
                        key={shipment._id}
                        position={[
                            shipment.tracking.currentLocation.coordinates.lat,
                            shipment.tracking.currentLocation.coordinates.lng
                        ]}
                        eventHandlers={{
                            click: () => onMarkerClick?.(shipment._id),
                        }}
                    >
                        {isExpanded && (
                            <Popup className="custom-popup">
                                <div className="p-2">
                                    <h3 className="font-bold text-sm">{shipment.tracking.trackingNumber}</h3>
                                    <p className="text-xs text-gray-600">{shipment.shipmentDetails?.origin} → {shipment.shipmentDetails?.destination}</p>
                                    <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] rounded-full uppercase font-bold 
                                    ${shipment.tracking.status === 'In Transit' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                        {shipment.tracking.status}
                                    </span>
                                </div>
                            </Popup>
                        )}
                    </Marker>
                ))}

                <MapController selectedShipment={selectedShipment} shipments={validShipments} isExpanded={isExpanded} />
            </MapContainer>

            {/* Legend/Info Overlay - Only show when expanded */}
            {isExpanded && (
                <div className="absolute bottom-4 left-4 z-[500] bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200 text-xs text-black animate-in fade-in slide-in-from-bottom-2">
                    <div className="font-bold mb-1">Live Tracking</div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span> Active
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> Delivered
                    </div>
                </div>
            )}
        </div>
    );
};
