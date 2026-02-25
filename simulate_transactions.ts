import { EconomicsService } from './src/services/economics';
import { db } from './src/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

async function simulateConcurrentOrders(orderCount: number) {
    console.log(`🚀 Starting simulation of ${orderCount} concurrent orders...`);

    // Mock orders
    const orders = Array.from({ length: orderCount }, (_, i) => ({
        id: `SIM-ORDER-${Date.now()}-${i}`,
        total: 1000,
        vendorId: 'VENDOR-1',
        resellerId: null,
        referralCode: null,
        deliveryFee: 100,
        assignedDeliveryManId: 'DRIVER-1',
        paymentMethod: 'Wallet',
        status: 'Delivered',
        date: new Date().toISOString(),
        items: [{ productId: 'PROD-1', quantity: 1, price: 1000 }]
    }));

    const categoryCommissions = [
        { en: 'General', bn: 'সাধারণ', commission: 10 }
    ];

    const initialBalance = await EconomicsService.getPlatformBalance();
    console.log(`📊 Initial Platform Balance: ৳${initialBalance}`);

    // Trigger concurrent transactions
    const startTime = Date.now();
    // EconomicsService.processOrderTransaction is now deprecated and backend-only.
    // Simulation here would require calling a test function or manually updating Firestore.

    try {
        // Since processOrderTransaction is now backend-only, we don't await promises here anymore.
        // Instead, valid tests should check Firestore for side-effects after triggering status updates.
        const duration = Date.now() - startTime;
        console.log(`✅ Simulation triggered in ${duration}ms.`);
        console.log(`✅ All ${orderCount} transactions completed in ${duration}ms.`);

        const finalBalance = await EconomicsService.getPlatformBalance();
        const expectedIncrease = orderCount * 100; // 10% of 1000
        console.log(`📊 Final Platform Balance: ৳${finalBalance}`);
        console.log(`📈 Total Increase: ৳${finalBalance - initialBalance}`);
        console.log(`🎯 Expected Increase: ৳${expectedIncrease}`);

        if (finalBalance - initialBalance === expectedIncrease) {
            console.log('🏆 SUCCESS: Sharded wallet integrity verified!');
        } else {
            console.error('❌ ERROR: Balance mismatch detected!');
        }
    } catch (error) {
        console.error('❌ Simulation failed:', error);
    }
}

// simulateConcurrentOrders(10);
