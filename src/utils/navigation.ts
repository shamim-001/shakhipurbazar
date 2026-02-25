import { Page } from '../types/common';

export const getPagePath = (page: Page): string => {
    switch (page.name) {
        case 'home':
        case 'initial':
            return '/';
        case 'category':
            return `/category/${page.category}`;
        case 'product':
            return `/product/${page.productId}`;
        case 'vendor':
            return `/vendor/${page.vendorId}`;
        case 'cart':
            return '/cart';
        case 'shops':
            return '/shops';
        case 'wholesale':
            return '/wholesale';
        case 'resell':
            return '/resell';
        case 'rentacar':
            return '/rentacar';
        case 'flights':
            return '/flights';
        case 'vendorRegister':
            return '/vendor/register';
        case 'riderRegister':
            return '/rider/register';
        case 'agencyRegister':
            return '/agency/register';
        case 'deliveryManRegister':
            return '/delivery/register';
        case 'riderDashboard':
            return '/rider-dashboard';
        case 'deliveryManDashboard':
            return '/delivery-dashboard';
        case 'agencyDashboard':
            return '/agency-dashboard';
        case 'register':
            return '/register';
        case 'userProfile':
            return page.tab ? `/profile?tab=${page.tab}` : '/profile';
        case 'inbox':
            return '/inbox';
        case 'chat':
            return `/chat/${page.threadId}`;
        case 'searchResults':
            return `/search?q=${encodeURIComponent(page.query)}`;
        case 'login':
            return '/login';
        case 'adminDashboard':
            return '/admin';
        case 'vendorDashboard':
            return '/vendor-dashboard';
        case 'resellerDashboard':
            return '/reseller-dashboard';
        case 'addProductPage':
            return page.productType ? `/add-product?type=${page.productType}` : '/add-product';
        case 'editProductPage':
            return `/edit-product/${page.productId}`;
        case 'orderSuccess':
            return `/order-success?orderIds=${page.orderIds.join(',')}`;
        default:
            return '/';
    }
};
