
export const DeliveryGeoService = {
    /**
     * Calculate distance between two points (Haversine formula)
     */
    calculateDistance: async (lat1: number, lng1: number, lat2: number, lng2: number): Promise<number> => {
        const R = 6371; // Earth's radius in km
        const dLat = DeliveryGeoService.toRad(lat2 - lat1);
        const dLng = DeliveryGeoService.toRad(lng2 - lng1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(DeliveryGeoService.toRad(lat1)) * Math.cos(DeliveryGeoService.toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return Math.round(distance * 10) / 10; // Round to 1 decimal
    },

    toRad: (degrees: number): number => {
        return degrees * (Math.PI / 180);
    },

    /**
     * Calculate delivery fee based on distance
     */
    calculateDeliveryFee: (distance: number): number => {
        // Base fee: ৳20
        // Per km: ৳5
        // Minimum: ৳20
        // Maximum: ৳200

        const baseFee = 20;
        const perKmFee = 5;
        let fee = baseFee + (distance * perKmFee);

        // Cap at minimum and maximum
        fee = Math.max(baseFee, fee);
        fee = Math.min(200, fee);

        return Math.round(fee);
    },

    /**
     * Estimate delivery time based on distance
     */
    estimateDeliveryTime: (distance: number): number => {
        // Assume average speed: 20 km/h in city
        // Add 10 minutes buffer
        const avgSpeed = 20;
        const timeInHours = distance / avgSpeed;
        const timeInMinutes = timeInHours * 60;
        const buffer = 10;

        return Math.round(timeInMinutes + buffer);
    }
};
