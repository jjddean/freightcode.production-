
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface HomeBackgroundMapProps {
    focusedLocation?: [number, number] | null; // [lng, lat]
}

export function HomeBackgroundMap({ focusedLocation }: HomeBackgroundMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const requestRef = useRef<number | undefined>(undefined);

    // Config
    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
    const INITIAL_CENTER: [number, number] = [0, 20];
    const INITIAL_ZOOM = 1.5;

    // 1. Initialize Map
    useEffect(() => {
        if (!MAPBOX_TOKEN || !mapContainerRef.current || mapRef.current) return;

        mapboxgl.accessToken = MAPBOX_TOKEN;

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/dark-v11', // Dark theme for background
            center: INITIAL_CENTER,
            zoom: INITIAL_ZOOM,
            interactive: false, // Disable user interaction
            attributionControl: false
        });

        map.on('load', () => {
            mapRef.current = map;
            setIsMapReady(true);

            // Start rotation immediately
            startRotation();
        });

        return () => {
            stopRotation();
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    const startRotation = () => {
        if (!mapRef.current) return;

        const rotate = () => {
            if (!mapRef.current) return;
            const currentBearing = mapRef.current.getBearing();
            mapRef.current.easeTo({
                bearing: currentBearing + 0.1,
                duration: 0,
                easing: x => x
            });
            requestRef.current = requestAnimationFrame(rotate);
        };

        if (!requestRef.current) {
            rotate();
        }
    };

    const stopRotation = () => {
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
            requestRef.current = undefined;
        }
    };

    // 3. Handle Focus Location Changes
    useEffect(() => {
        if (!isMapReady || !mapRef.current || !focusedLocation) return;

        stopRotation();

        // Fly to the new location
        mapRef.current.flyTo({
            center: focusedLocation,
            zoom: 13, // Closer zoom for city
            pitch: 60, // Angled view
            speed: 1.2, // Moderate speed
            curve: 1.5,
            essential: true
        });

        // Resume rotation after flight completes
        mapRef.current.once('moveend', () => {
            startRotation();
        });

    }, [focusedLocation, isMapReady]);

    if (!MAPBOX_TOKEN) {
        return <div className="w-full h-full bg-[#0B1026]" />;
    }

    return (
        <div ref={mapContainerRef} className="w-full h-full absolute inset-0" />
    );
}
