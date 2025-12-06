import { useMemo } from 'react';
import { Stop } from '../lib/supabase';

// --- Helper Functions ---

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

// Distance from point C to line segment AB with Ellipse Logic
function crossTrackDistance(cA: { lat: number, lng: number }, cB: { lat: number, lng: number }, cC: { lat: number, lng: number }) {
    const distAB = getDistanceFromLatLonInKm(cA.lat, cA.lng, cB.lat, cB.lng);
    const distAC = getDistanceFromLatLonInKm(cA.lat, cA.lng, cC.lat, cC.lng);
    const distCB = getDistanceFromLatLonInKm(cC.lat, cC.lng, cB.lat, cB.lng);

    // Detour Factor: (AC + CB) / AB
    // A straight line is 1.0. An ellipse around the line will be > 1.0.
    // 2.0 allows for significant curvature (sine waves, big detours).
    const detourFactor = (distAC + distCB) / distAB;

    return {
        // Allow up to 3x deviation if the distance is short, or 2x if long. 
        // For robustness, we'll use a high default since we want "nearby" things.
        isOnSegment: detourFactor < 3.0,
        distanceFromStart: distAC
    };
}

export function useSmartSuggestions(
    allStops: Stop[],
    startStop: Stop | undefined,
    endStop: Stop | undefined,
    intermediateStops: Stop[]
) {
    return useMemo(() => {
        if (!startStop || !endStop) return [];

        const startPt = { lat: startStop.latitude, lng: startStop.longitude };
        const endPt = { lat: endStop.latitude, lng: endStop.longitude };

        // 1. Calculate candidates
        const candidates = allStops.map(stop => {
            // Exclude already selected (By ID)
            if (stop.id === startStop.id || stop.id === endStop.id) return null;
            // Exclude already selected (By Name - handles duplicate entries/bad data)
            if (stop.name === startStop.name || stop.name === endStop.name) return null;

            // Exclude intermediate stops
            if (intermediateStops.some(s => s.id === stop.id)) return null;

            const stopPt = { lat: stop.latitude, lng: stop.longitude };
            const { isOnSegment, distanceFromStart } = crossTrackDistance(startPt, endPt, stopPt);

            if (!isOnSegment) return null;

            return {
                ...stop,
                distanceFromStart
            };
        }).filter(Boolean) as (Stop & { distanceFromStart: number })[];

        // 2. Sort by distance from Start (Progression)
        return candidates.sort((a, b) => a.distanceFromStart - b.distanceFromStart);

    }, [allStops, startStop, endStop, intermediateStops]);
}
