import { useEffect, useState } from 'react';
import { Order } from '../../types';

export const useRideSimulation = (initialOrders: Order[]) => {
    const [orders, setOrders] = useState<Order[]>(initialOrders);

    useEffect(() => {
        // Sync with initial orders if they change structurally, 
        // but we want to maintain local simulation state if possible.
        // For simplicity, we just set them. In a real app, we'd merge.
        setOrders(initialOrders);
    }, [initialOrders]);

    useEffect(() => {
        const interval = setInterval(() => {
            setOrders(prevOrders => prevOrders.map(order => {
                if (order.status === 'Ride Accepted' || order.status === 'Ride Started') {
                    const baseLat = 24.3396;
                    const baseLng = 90.1760;

                    const destLat = baseLat + 0.01;
                    const destLng = baseLng + 0.01;

                    let currentLat = order.driverLocation?.lat || baseLat - 0.01;
                    let currentLng = order.driverLocation?.lng || baseLng - 0.01;

                    const step = 0.0001;

                    if (currentLat < destLat) currentLat += step;
                    if (currentLng < destLng) currentLng += step;

                    return {
                        ...order,
                        driverLocation: {
                            lat: currentLat,
                            lng: currentLng,
                            heading: 45
                        }
                    };
                }
                return order;
            }));
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return { simulatedOrders: orders, setOrders };
};
