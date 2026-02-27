/* ======================================================
   SpotSkill — Location Utilities
   Geolocation API + Haversine distance calculation
   ====================================================== */

/**
 * Get user's current location via browser Geolocation API.
 * Returns { latitude, longitude } or throws an error.
 */
export function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser.'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (err) => {
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        reject(new Error('Location permission denied. Please allow location access or enter manually.'));
                        break;
                    case err.POSITION_UNAVAILABLE:
                        reject(new Error('Location unavailable. Please enter your location manually.'));
                        break;
                    case err.TIMEOUT:
                        reject(new Error('Location request timed out. Please try again.'));
                        break;
                    default:
                        reject(new Error('Unable to detect location.'));
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000,
            }
        );
    });
}

/**
 * Calculate distance between two lat/lng points using the Haversine formula.
 * Returns distance in kilometers.
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const toRad = (deg) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Format a distance in km to a human-readable string.
 */
export function formatDistance(km) {
    if (km == null || isNaN(km)) return 'Unknown';
    if (km < 0.1) return '< 100m';
    if (km < 1) return `${Math.round(km * 1000)}m`;
    if (km < 10) return `${km.toFixed(1)} km`;
    return `${Math.round(km)} km`;
}
