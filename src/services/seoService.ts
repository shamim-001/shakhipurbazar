import { Product, FlightBooking, Vendor } from '../types';

export const SEOService = {
    generateProductSchema: (product: Product, language: 'en' | 'bn' = 'en') => {
        const baseSchema: any = {
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.name[language],
            "image": product.images,
            "description": product.description[language],
            "sku": product.id,
            "offers": {
                "@type": "Offer",
                "url": `https://sakhipur-bazar.web.app/product/${product.slug || product.id}`,
                "priceCurrency": "BDT",
                "price": product.price,
                "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
            }
        };

        // Specialized Schema based on Product Type
        if (product.productType === 'flight' && product.flightDetails) {
            return {
                ...baseSchema,
                "@type": "Flight",
                "flightNumber": product.flightDetails.flightNumber,
                "provider": { "@type": "Airline", "name": product.flightDetails.airline },
                "departureAirport": { "@type": "Airport", "name": product.flightDetails.originCode, "iataCode": product.flightDetails.originCode },
                "arrivalAirport": { "@type": "Airport", "name": product.flightDetails.destinationCode, "iataCode": product.flightDetails.destinationCode }
            };
        }

        if (product.productType === 'resell') {
            const condition = product.condition === 'Like New' ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition";
            return {
                ...baseSchema,
                "itemCondition": condition,
                "offers": { ...baseSchema.offers, "itemCondition": condition }
            };
        }

        if (product.productType === 'rental' && product.vehicleDetails) {
            const isAmbulance = product.vehicleDetails.type === 'Ambulance';
            return {
                ...baseSchema,
                "@type": isAmbulance ? "EmergencyService" : "RentalCarReservation",
                "reservationNumber": product.id,
                "provider": {
                    "@type": "LocalBusiness",
                    "name": isAmbulance ? "Sakhipur Emergency Ambulance" : "Sakhipur Bazar Rent-A-Car"
                },
                "description": isAmbulance
                    ? `Emergency Ambulance Service. 24/7 Availability.${product.vehicleDetails.ac ? ' AC' : ' Non-AC'}.`
                    : `Vehicle: ${product.vehicleDetails.type}, ${product.vehicleDetails.seats} seats.${product.vehicleDetails.ac ? ' AC' : ' Non-AC'}.`
            };
        }

        return baseSchema;
    },

    generateVendorSchema: (vendor: Vendor, reviewCount = 10) => ({
        "@context": "https://schema.org/",
        "@type": "LocalBusiness",
        "name": (vendor.name as any)?.en || vendor.name,
        "image": vendor.logo,
        "address": {
            "@type": "PostalAddress",
            "streetAddress": vendor.location,
            "addressLocality": "Sakhipur",
            "addressCountry": "BD"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": vendor.rating || 5,
            "reviewCount": reviewCount
        }
    })
};
