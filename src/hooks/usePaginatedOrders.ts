import { useState, useEffect, useCallback } from 'react';
import { Order } from '../../types';
import { OrderService } from '../services/orderService';

export const usePaginatedOrders = (status: string, pageSize: number = 10) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);

    const fetchOrders = useCallback(async (isNext: boolean = false) => {
        setLoading(true);
        try {
            const result = await OrderService.fetchPaginatedOrders(
                status,
                isNext ? lastDoc : null,
                pageSize
            );

            if (isNext) {
                setOrders(prev => [...prev, ...result.orders]);
            } else {
                setOrders(result.orders);
            }

            setLastDoc(result.lastDoc);
            setHasMore(result.orders.length === pageSize);
        } catch (error) {
            console.error("Error fetching paginated orders:", error);
        } finally {
            setLoading(false);
        }
    }, [status, lastDoc, pageSize]);

    useEffect(() => {
        setLastDoc(null);
        fetchOrders(false);
    }, [status]);

    return { orders, loading, hasMore, loadMore: () => fetchOrders(true) };
};
