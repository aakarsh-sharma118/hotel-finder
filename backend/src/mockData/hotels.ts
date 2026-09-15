/**
 * @fileoverview Mock hotel database containing realistic Indian hotel data.
 * Provides hotel records across 16 major Indian destinations including Meerut.
 * Supports filtering by city, price range, pagination, and in-memory CRUD operations.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 *
 * @module mockData/hotels
 */

// Data interface representing a single hotel item in the catalog
export interface MockHotel {
  // Unique hotel identifier
  hotelId: string;
  // Full commercial hotel name
  name: string;
  // Destination city name
  city: string;
  // Star quality rating from 1 to 5
  stars: number;
  // Physical address or landmark location
  location: string;
  // Room rate offered by Supplier A in INR
  rateA: number;
  // Room rate offered by Supplier B in INR
  rateB: number;
  // Identifies which supplier provides the lower rate
  cheaperSupplier: 'Supplier A' | 'Supplier B';
  // Final lowest room rate per night
  price: number;
  // Amount saved by booking with the cheaper supplier
  savings: number;
  // Verified photo URL from Unsplash
  image: string;
  // List of guest amenities included with booking
  amenities: string[];
  // Room category or title
  roomType: string;
  // Guest satisfaction rating out of 5
  rating: number;
  // Total number of verified guest reviews
  reviewsCount: number;
}

// Collection of high resolution hotel imagery from Unsplash
const HOTEL_IMAGES = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1549294413-26f195200c16?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80',
];

// Helper to construct a hotel item with computed price, savings, and cheaper supplier
function createHotel(
  id: string,
  name: string,
  city: string,
  stars: number,
  location: string,
  rateA: number,
  rateB: number,
  imageIdx: number,
  amenities: string[],
  roomType: string = 'Deluxe Suite',
  rating: number = 4.5,
  reviewsCount: number = 320,
  hasFreeCancellation?: boolean
): MockHotel {
  // Determine which supplier offers the cheaper room rate
  const cheaperSupplier = rateA <= rateB ? 'Supplier A' : 'Supplier B';
  // Lowest price between both suppliers
  const price = Math.min(rateA, rateB);
  // Absolute difference saved by booking with the cheaper supplier
  const savings = Math.abs(rateA - rateB);
  // Pick image URL using modular index
  const image = HOTEL_IMAGES[imageIdx % HOTEL_IMAGES.length];

  // Assign Free Cancellation policy to approximately 60% of hotels across destinations
  // Provides realistic distribution with both free cancellation deals and standard reservations
  const lastDigit = parseInt(id.slice(-1), 10);
  const qualifiesForFreeCancellation =
    hasFreeCancellation !== undefined
      ? hasFreeCancellation
      : !isNaN(lastDigit)
        ? [0, 2, 3, 5, 7, 8].includes(lastDigit)
        : imageIdx % 2 === 0;

  // Prepend Free Cancellation to amenities list so it appears first and is prominent
  const enrichedAmenities =
    qualifiesForFreeCancellation && !amenities.includes('Free Cancellation')
      ? ['Free Cancellation', ...amenities]
      : amenities;

  return {
    hotelId: id,
    name,
    city,
    stars,
    location,
    rateA,
    rateB,
    cheaperSupplier,
    price,
    savings,
    image,
    amenities: enrichedAmenities,
    roomType,
    rating,
    reviewsCount,
  };
}

// ── In-Memory Realistic Hotel Database ─────────────────────────────────────
// Seeded with authentic hotels across Indian cities including Meerut
export const INITIAL_HOTELS: MockHotel[] = [
  // ── Meerut Hotels (10 properties) ──
  createHotel('htl-meerut-001', 'Hotel Bravura Gold Resort Meerut', 'Meerut', 4, 'Delhi-Roorkee Bypass Road, Meerut', 2850, 2600, 0, ['Swimming Pool', 'Free High-Speed WiFi', 'Free Breakfast', 'Free Parking', 'Spa'], 'Executive Suite', 4.4, 480),
  createHotel('htl-meerut-002', 'The Broadway Inn Meerut', 'Meerut', 3, 'Near Central Market, Civil Lines, Meerut', 1950, 2100, 1, ['Free High-Speed WiFi', 'Restaurant', 'Free Breakfast', 'Room Service'], 'Deluxe Room', 4.1, 310),
  createHotel('htl-meerut-003', 'Hotel Samrat Heavens Meerut', 'Meerut', 3, 'Garh Road, Meerut', 2200, 1990, 2, ['Free High-Speed WiFi', 'Banquet Hall', 'Free Parking', 'Restaurant'], 'Premier King Room', 4.0, 260),
  createHotel('htl-meerut-004', 'Hyphen Premier Hotel Meerut', 'Meerut', 4, 'Major Dhyan Chand Nagar, Delhi Road, Meerut', 3200, 2950, 3, ['Fitness Center', 'Free Breakfast', 'Free WiFi', 'Bar Lounge'], 'Business Executive Room', 4.5, 540),
  createHotel('htl-meerut-005', 'Hotel Godwin Meerut', 'Meerut', 4, 'Baghpat Road Crossing, Bypass, Meerut', 3400, 3650, 4, ['Swimming Pool', 'Multi-Cuisine Restaurant', 'Free Parking', 'Spa'], 'Luxury Pool View Suite', 4.3, 420),
  createHotel('htl-meerut-006', 'Grand 5 Resort Meerut', 'Meerut', 4, 'NH-58 Bypass, Kankerkhera, Meerut', 2900, 2750, 5, ['Lush Green Gardens', 'Free Breakfast', 'Free WiFi', 'Valet Parking'], 'Garden Villa Suite', 4.4, 380),
  createHotel('htl-meerut-007', 'Hotel Rajmahal Meerut', 'Meerut', 3, 'Begum Bridge Road, Meerut Cantonment', 1700, 1850, 6, ['Free High-Speed WiFi', 'City View', '24h Front Desk'], 'Standard Queen Room', 3.9, 190),
  createHotel('htl-meerut-008', 'Country Inn & Suites by Radisson Meerut', 'Meerut', 5, 'Shopprix Mall, Delhi Road, Meerut', 4400, 4150, 7, ['Rooftop Swimming Pool', 'Gym', 'Free Gourmet Breakfast', 'Airport Transfer'], 'Club King Suite', 4.7, 780),
  createHotel('htl-meerut-009', 'The Mars Resort Meerut', 'Meerut', 4, 'Roorkee Road, Meerut', 2700, 2850, 8, ['Outdoor Pool', 'Lawn Area', 'Free WiFi', 'Restaurant'], 'Resort Cottage', 4.2, 230),
  createHotel('htl-meerut-010', 'Hotel Harmony Inn Meerut', 'Meerut', 3, 'Garh Road, Opposite Medical College, Meerut', 2100, 1950, 9, ['Free High-Speed WiFi', 'Conference Hall', 'Free Parking'], 'Superior Double Room', 4.1, 280),

  // ── Goa Hotels (12 properties) ──
  createHotel('htl-goa-001', 'The Leela Goa Resort & Spa', 'Goa', 5, 'Mobor Beach, Cavelossim, South Goa', 8500, 7900, 0, ['Private Beach Access', 'Golf Course', 'Ayurvedic Spa', 'Free Breakfast'], 'Lagoon Suite', 4.9, 1420),
  createHotel('htl-goa-002', 'Taj Exotica Resort & Spa Goa', 'Goa', 5, 'Benaulim Beach, South Goa', 9200, 9600, 1, ['Private Beach Access', 'Infinity Pool', 'Fine Dining', 'Tennis Court'], 'Sea View Villa', 4.9, 1680),
  createHotel('htl-goa-004', 'W Goa Luxury Resort', 'Goa', 5, 'Vagator Beach, North Goa', 7800, 8200, 3, ['Rock Pool', 'Direct Beach Access', 'Nightclub', 'Free WiFi'], 'Spectacular Ocean Room', 4.8, 1150),
  createHotel('htl-goa-005', 'ITC Grand Goa Resort & Spa', 'Goa', 5, 'Arossim Beach, Cansaulim, South Goa', 6900, 6400, 4, ['Multi-Level Swimming Pool', 'Village Square Dining', 'Spa', 'Beach Access'], 'Garden View Suite', 4.8, 1290),
  createHotel('htl-goa-003', 'Alila Diwa Goa by Hyatt', 'Goa', 5, 'Majorda Beach Road, South Goa', 5400, 4950, 2, ['Paddy Field View', 'Infinity Pool', 'Spa & Wellness', 'Free Breakfast'], 'Diwa Club Room', 4.7, 980),
  createHotel('htl-goa-006', 'Caravela Beach Resort Goa', 'Goa', 5, 'Varca Beach, Salcete, South Goa', 4900, 5200, 5, ['Beachfront Access', 'Golf Course', 'Swimming Pool', 'Free Breakfast'], 'Ocean View Deluxe', 4.6, 890),
  createHotel('htl-goa-007', 'Cidade de Goa - IHCL SeleQtions', 'Goa', 5, 'Vainguinim Beach, Dona Paula, Panaji', 5100, 4750, 6, ['Portuguese Architecture', 'Private Beach', 'Water Sports', 'Spa'], 'Heritage Sea View Room', 4.6, 940),
  createHotel('htl-goa-008', 'Grand Hyatt Goa', 'Goa', 5, 'Bambolim Bay, North Goa', 6500, 6900, 7, ['Indoor & Outdoor Pools', 'Bambolim Beach Access', 'Spa', 'Kids Club'], 'Grand Suite Bay View', 4.7, 1340),
  createHotel('htl-goa-009', 'Novotel Goa Candolim', 'Goa', 4, 'Pinto Waddo, Candolim, North Goa', 3600, 3300, 8, ['Swimming Pool', 'Free Shuttle to Beach', 'Gym', 'Free WiFi'], 'Superior King Room', 4.3, 760),
  createHotel('htl-goa-010', 'Hard Rock Hotel Goa', 'Goa', 4, 'Calangute Beach Road, North Goa', 3900, 4200, 9, ['Guitar Amenities', 'Courtyard Pool', 'Rock Spa', 'Free Breakfast'], 'Rock Royalty Room', 4.4, 820),
  createHotel('htl-goa-011', 'Santana Beach Resort', 'Goa', 3, 'Dando, Candolim, North Goa', 2400, 2200, 10, ['Direct Beach Walkway', 'Two Outdoor Pools', 'Beach Shack Dining'], 'Standard AC Room', 4.2, 530),
  createHotel('htl-goa-012', 'Whispering Palms Beach Resort', 'Goa', 4, 'Sinquerim Beach, Candolim, North Goa', 3200, 3450, 11, ['Poolside Bar', 'Fitness Center', 'Free Breakfast', 'Free WiFi'], 'Deluxe Garden Room', 4.3, 610),

  // ── Mumbai Hotels (12 properties) ──
  createHotel('htl-mum-001', 'The Taj Mahal Palace Mumbai', 'Mumbai', 5, 'Apollo Bunder, Colaba, Gateway of India', 12500, 11800, 0, ['Harbor Sea View', 'Heritage Butler Service', 'Jiva Spa', 'Pool'], 'Palace Wing Luxury Room', 5.0, 3100),
  createHotel('htl-mum-002', 'The St. Regis Mumbai', 'Mumbai', 5, 'High Street Phoenix, Lower Parel, Mumbai', 9800, 10400, 1, ['City Skyline View', 'St. Regis Butler', 'Rooftop Pool', 'Luxury Spa'], 'Premier Skyline King', 4.9, 2100),
  createHotel('htl-mum-003', 'Trident Hotel Nariman Point', 'Mumbai', 5, 'Marine Drive, Nariman Point, South Mumbai', 7800, 7300, 2, ['Queens Necklace View', 'Outdoor Pool', '24h Fitness Center', 'Fine Dining'], 'Sea View Premier Room', 4.8, 1950),
  createHotel('htl-mum-004', 'JW Marriott Mumbai Juhu', 'Mumbai', 5, 'Juhu Tara Road, Juhu Beach, Mumbai', 8900, 9300, 3, ['Direct Beach Access', 'Saltwater Pool', 'Quan Spa', 'Free Breakfast'], 'Ocean View Executive Suite', 4.8, 2200),
  createHotel('htl-mum-005', 'The Oberoi Mumbai', 'Mumbai', 5, 'Marine Drive, Nariman Point, Mumbai', 11000, 10500, 4, ['Arabian Sea View', 'Outdoor Heated Pool', 'Fine Italian Dining', 'Spa'], 'Luxury Bay View Room', 4.9, 1820),
  createHotel('htl-mum-006', 'ITC Grand Central Mumbai', 'Mumbai', 5, 'Dr. Babasaheb Ambedkar Road, Parel, Mumbai', 6400, 6800, 5, ['Heritage Design', 'Kaya Kalp Spa', 'Indoor Pool', 'Free Breakfast'], 'ITC One Executive Room', 4.7, 1250),
  createHotel('htl-mum-007', 'Four Seasons Hotel Mumbai', 'Mumbai', 5, 'Dr. E Moses Road, Worli, Mumbai', 8200, 7800, 6, ['Rooftop Aer Lounge', 'Outdoor Pool', 'Ayurvedic Spa', 'Valet Parking'], 'Deluxe Sea View Room', 4.7, 1420),
  createHotel('htl-mum-008', 'The Westin Mumbai Garden City', 'Mumbai', 5, 'International Business Park, Goregaon East', 5900, 6200, 7, ['Heavenly Bed', 'Outdoor Pool', 'Spa', 'Free High-Speed WiFi'], 'Club Executive Room', 4.6, 980),
  createHotel('htl-mum-009', 'Taj Santacruz Mumbai', 'Mumbai', 5, 'Chhatrapati Shivaji Maharaj Airport, Domestic Terminal', 6800, 6300, 8, ['Runway View', 'Jiva Spa', 'Swimming Pool', 'Express Airport Shuttle'], 'Luxury Runway View Suite', 4.7, 1540),
  createHotel('htl-mum-010', 'Citizen Hotel Juhu', 'Mumbai', 3, 'Juhu Beach, Mumbai', 3200, 3500, 9, ['Beachfront View', 'Restaurant', 'Free WiFi', 'Room Service'], 'Executive Sea Facing Room', 4.1, 620),
  createHotel('htl-mum-011', 'Residency Hotel Fort', 'Mumbai', 3, 'Corner of D.N. Road, Fort, South Mumbai', 3600, 3350, 10, ['Heritage Neighborhood', 'Free Breakfast', 'Free WiFi', 'Concierge'], 'Deluxe Double Room', 4.3, 710),
  createHotel('htl-mum-012', 'The Orchid Hotel Mumbai Vile Parle', 'Mumbai', 4, 'Nehru Road, Vile Parle East, Domestic Airport', 4200, 4500, 11, ['Ecotel Certified', 'Rooftop Pool', 'Free Breakfast', 'Airport Transfer'], 'Deluxe King Room', 4.3, 1100),

  // ── Delhi / New Delhi Hotels (12 properties) ──
  createHotel('htl-del-001', 'The Imperial New Delhi', 'Delhi', 5, 'Janpath, Connaught Place, New Delhi', 10500, 9900, 0, ['Heritage Art Gallery', 'Swimming Pool', 'Imperial Spa', 'Free Breakfast'], 'Heritage Royal Suite', 4.9, 2400),
  createHotel('htl-del-002', 'The Leela Palace New Delhi', 'Delhi', 5, 'Diplomatic Enclave, Chanakyapuri, New Delhi', 11500, 12200, 1, ['Rooftop Temperature Pool', 'Butler Service', 'Spa', 'Fine Dining'], 'Royal Premier Room', 5.0, 2600),
  createHotel('htl-del-003', 'Taj Mahal Hotel New Delhi', 'Delhi', 5, 'Number One Mansingh Road, New Delhi', 8900, 8400, 2, ['Lutyens Delhi View', 'Varq Restaurant', 'Outdoor Pool', 'Spa'], 'Deluxe Luxury Room', 4.8, 1850),
  createHotel('htl-del-004', 'ITC Maurya Luxury Collection New Delhi', 'Delhi', 5, 'Sardar Patel Marg, Diplomatic Enclave, New Delhi', 9200, 9700, 3, ['Bukhara Restaurant', 'Kaya Kalp Spa', 'Swimming Pool', 'Gym'], 'ITC One Executive Room', 4.9, 2100),
  createHotel('htl-del-005', 'The Lodhi New Delhi', 'Delhi', 5, 'Lodhi Road, Near Humayuns Tomb, New Delhi', 11200, 10600, 4, ['Private Plunge Pool', 'Tennis Courts', 'Spa & Salon', 'Free Breakfast'], 'Lodhi Room with Plunge Pool', 4.9, 1420),
  createHotel('htl-del-006', 'The Oberoi New Delhi', 'Delhi', 5, 'Dr. Zakir Hussain Marg, Delhi Golf Course Area', 12800, 13400, 5, ['Clean Air Technology', 'Golf Course View', 'Indoor & Outdoor Pools'], 'Premier Golf View Room', 5.0, 1980),
  createHotel('htl-del-007', 'Shangri-La Eros New Delhi', 'Delhi', 5, '19 Ashoka Road, Connaught Place, New Delhi', 6900, 6500, 6, ['Chi The Spa', 'Swimming Pool', 'Club Lounge', 'Free Breakfast'], 'Horizon Club King', 4.7, 1680),
  createHotel('htl-del-008', 'JW Marriott Hotel New Delhi Aerocity', 'Delhi', 5, 'Asset Area 4, Hospitality District, Aerocity', 7200, 7600, 7, ['Heated Pool', 'Quan Spa', 'Airport Shuttle', 'Free High-Speed WiFi'], 'Deluxe Executive King', 4.8, 2300),
  createHotel('htl-del-009', 'The Claridges New Delhi', 'Delhi', 5, '12 Aurangzeb Road, Dr APJ Abdul Kalam Road', 6200, 5800, 8, ['Historic Garden Pool', 'Dhaba Restaurant', 'Free WiFi', 'Spa'], 'Heritage Claridges Room', 4.6, 1150),
  createHotel('htl-del-010', 'Radisson Blu Plaza Delhi Airport', 'Delhi', 4, 'National Highway 8, Mahipalpur, New Delhi', 4100, 4400, 9, ['Outdoor Pool', 'The Great Kabab Factory', 'Spa', 'Free Breakfast'], 'Deluxe Room', 4.4, 1340),
  createHotel('htl-del-011', 'The Suryaa New Delhi', 'Delhi', 4, 'New Friends Colony, South Delhi', 3800, 3550, 10, ['Rooftop Dining', 'Health Club', 'Swimming Pool', 'Free WiFi'], 'Club Executive Room', 4.2, 890),
  createHotel('htl-del-012', 'Bloomrooms @ Janpath', 'Delhi', 3, '1 Janpath Lane, Connaught Place, New Delhi', 2600, 2800, 11, ['Modern Minimalist Design', 'Cloud Beds', 'Free Breakfast', 'Free WiFi'], 'Standard Queen Room', 4.3, 980),

  // ── Bengaluru / Bangalore Hotels (12 properties) ──
  createHotel('htl-blr-001', 'The Oberoi Bengaluru', 'Bengaluru', 5, '37-39 Mahatma Gandhi Road, Bangalore', 8900, 8300, 0, ['Centuries Old Banyan Tree', 'Outdoor Pool', 'Spa', 'Fine Dining'], 'Deluxe Garden View Room', 4.9, 1720),
  createHotel('htl-blr-002', 'The Ritz-Carlton Bangalore', 'Bengaluru', 5, '99 Residency Road, Bangalore', 9600, 10200, 1, ['Rooftop Bang Lounge', 'Ritz-Carlton Spa', 'Outdoor Pool', 'Butler'], 'Premier Executive King', 4.9, 1850),
  createHotel('htl-blr-003', 'ITC Gardenia Bengaluru', 'Bengaluru', 5, '1 Residency Road, Bangalore', 7800, 7400, 2, ['LEED Platinum Certified', 'Helipad', 'Kaya Kalp Spa', 'Swimming Pool'], 'Towers Room', 4.8, 1460),
  createHotel('htl-blr-004', 'The Leela Palace Bengaluru', 'Bengaluru', 5, '23 HAL Airport Road, Kodihalli, Bangalore', 10400, 10900, 3, ['Mysore Palace Architecture', 'Lagoon Pool', 'Spa', 'Fine Dining'], 'Royal Premier Suite', 5.0, 2200),
  createHotel('htl-blr-005', 'JW Marriott Hotel Bengaluru', 'Bengaluru', 5, '24/1 Vittal Mallya Road, UB City, Bangalore', 8200, 7800, 4, ['Cubbon Park View', 'Infinity Pool', 'Spa', 'UB City Walkway'], 'Executive Park View King', 4.8, 1690),
  createHotel('htl-blr-006', 'Taj West End Bengaluru', 'Bengaluru', 5, 'Race Course Road, Bangalore', 8700, 9100, 5, ['20 Acres Heritage Flora', 'Heritage Walk', 'Two Pools', 'Fine Dining'], 'Heritage Luxury Room', 4.8, 1540),
  createHotel('htl-blr-007', 'Sheraton Grand Bangalore Hotel at Brigade Gateway', 'Bengaluru', 5, '26/1 Dr. Rajkumar Road, Malleswaram-Rajajinagar', 6200, 5850, 6, ['Direct Skywalk to Orion Mall', 'Infinity Pool', 'Shine Spa', 'Gym'], 'Club King Room', 4.6, 1280),
  createHotel('htl-blr-008', 'Hilton Bangalore Embassy GolfLinks', 'Bengaluru', 5, 'Embassy GolfLinks Business Park, Domlur', 6400, 6750, 7, ['Golf Course Views', 'Outdoor Pool', 'Kitchenette Suites', 'Gym'], 'Studio Suite with Balcony', 4.6, 1150),
  createHotel('htl-blr-009', 'The Chancery Pavilion Bangalore', 'Bengaluru', 4, '135 Residency Road, Bangalore', 3700, 3450, 8, ['Swimming Pool', 'Sigma Central Location', 'Free WiFi', 'Breakfast'], 'Executive Club Room', 4.2, 790),
  createHotel('htl-blr-010', 'St. Marks Hotel Bangalore', 'Bengaluru', 4, '4/1 St. Marks Road, Bangalore', 3900, 4150, 9, ['Rooftop Restaurant', 'Fitness Center', 'Free Breakfast', 'Free WiFi'], 'Deluxe Room', 4.3, 670),
  createHotel('htl-blr-011', 'Fortune Select JP Cosmos Bengaluru', 'Bengaluru', 4, 'Cunningham Crescent Road, Bangalore', 3400, 3200, 10, ['Swimming Pool', 'Gym', 'Free High-Speed WiFi', 'Coffee Shop'], 'Club Superior Room', 4.1, 560),
  createHotel('htl-blr-012', 'Bloomrooms @ Indiranagar', 'Bengaluru', 3, '100 Feet Road, Indiranagar, Bangalore', 2500, 2700, 11, ['Lively Neighborhood', 'Free Breakfast', 'Cloud Beds', 'Free WiFi'], 'Standard Queen Room', 4.2, 810),

  // ── Jaipur Hotels (10 properties) ──
  createHotel('htl-jai-001', 'Rambagh Palace Jaipur', 'Jaipur', 5, 'Bhawani Singh Road, Jaipur', 14500, 13800, 0, ['Former Royal Maharaja Palace', 'Peacock Gardens', 'Jiva Spa', 'Pool'], 'Palace Room', 5.0, 2800),
  createHotel('htl-jai-002', 'The Oberoi Rajvilas Jaipur', 'Jaipur', 5, 'Goner Road, Jaipur', 13200, 13900, 1, ['Luxury Tents & Villas', 'Private Pool Options', 'Ancient Shiva Temple'], 'Premier Room with Semi-Private Pool', 5.0, 2450),
  createHotel('htl-jai-003', 'Jai Mahal Palace Jaipur', 'Jaipur', 5, 'Jacob Road, Civil Lines, Jaipur', 8900, 8400, 2, ['18 Acres Mughal Gardens', 'Outdoor Pool', 'Spa', 'Free Breakfast'], 'Luxury Heritage Room', 4.8, 1680),
  createHotel('htl-jai-004', 'Fairmont Jaipur', 'Jaipur', 5, '2 Riico Kukas, Amber Area, Jaipur', 7800, 8250, 3, ['Aravalli Hills Backdrop', 'Outdoor Pool', 'Spa', 'Traditional Dining'], 'Fairmont King Room', 4.7, 1920),
  createHotel('htl-jai-005', 'ITC Rajputana Jaipur', 'Jaipur', 5, 'Palace Road, Near Railway Station, Jaipur', 6400, 6100, 4, ['Traditional Haveli Courtyards', 'Swimming Pool', 'Kaya Kalp Spa'], 'Rajputana Royal Club Room', 4.7, 1350),
  createHotel('htl-jai-006', 'Samode Haveli Jaipur', 'Jaipur', 4, 'Near Jorawar Singh Gate, Gangapole, Jaipur', 5400, 5800, 5, ['175-Year-Old Historic Haveli', 'Frescoed Dining Hall', 'Pool', 'Spa'], 'Haveli Deluxe Suite', 4.6, 920),
  createHotel('htl-jai-007', 'Alsisar Haveli Jaipur', 'Jaipur', 3, 'Sansar Chandra Road, Jaipur', 3600, 3350, 6, ['Heritage Courtyard', 'Outdoor Pool', 'Traditional Rajput Decor'], 'Heritage Standard Room', 4.4, 760),
  createHotel('htl-jai-008', 'Shahpura House Jaipur', 'Jaipur', 4, 'Devi Marg, Bani Park, Jaipur', 4200, 4500, 7, ['Shekhawati Frescoes', 'Rooftop Restaurant', 'Pool', 'Free WiFi'], 'Shahpura Suite', 4.5, 840),
  createHotel('htl-jai-009', 'Hilton Jaipur', 'Jaipur', 5, 'Mangalam Geejgarh House, Hawa Sadak, Jaipur', 4900, 4650, 8, ['Aravalli Hills Views', 'Outdoor Pool', 'Spa', 'Free Breakfast'], 'Deluxe King Room', 4.5, 1120),
  createHotel('htl-jai-010', 'Umaid Bhawan Heritage House Jaipur', 'Jaipur', 3, 'D1-2A Behari Marg, Bani Park, Jaipur', 2300, 2500, 9, ['Ornate Carved Balconies', 'Swimming Pool', 'Puppet Shows', 'Free WiFi'], 'Royal Classic Room', 4.3, 650),

  // ── Udaipur Hotels (10 properties) ──
  createHotel('htl-udr-001', 'The Oberoi Udaivilas Udaipur', 'Udaipur', 5, 'Haridas Ji Ki Magri, Lake Pichola, Udaipur', 15800, 15100, 0, ['Direct Lake Pichola View', 'Private Boat Arrival', 'Peacock Sanctuaries'], 'Premier Room with Semi-Private Pool', 5.0, 3400),
  createHotel('htl-udr-002', 'Taj Lake Palace Udaipur', 'Udaipur', 5, 'Pichola Island, Lake Pichola, Udaipur', 16500, 17200, 1, ['Marble Palace on the Lake', 'Royal Butler Service', 'Jiva Boat Spa'], 'Luxury Lake View Room', 5.0, 3600),
  createHotel('htl-udr-003', 'The Leela Palace Udaipur', 'Udaipur', 5, 'Lake Pichola, Udaipur', 14200, 13600, 2, ['Lake Pichola Shoreline', 'Outdoor Heated Pool', 'Spa', 'Fine Dining'], 'Grand Heritage Lake View', 4.9, 2900),
  createHotel('htl-udr-004', 'Trident Udaipur', 'Udaipur', 5, 'Haridas Ji Ki Magri, Mulla Talai, Udaipur', 6800, 7200, 3, ['43 Acres Landscaped Grounds', 'Swimming Pool', 'Kids Club', 'Spa'], 'Deluxe Garden View Room', 4.7, 1480),
  createHotel('htl-udr-005', 'Fateh Prakash Palace - Grand Heritage', 'Udaipur', 5, 'City Palace Complex, Lake Pichola, Udaipur', 8900, 8450, 4, ['Inside Royal City Palace', 'Crystal Gallery Access', 'Lake View Pool'], 'Palace Suite Lake View', 4.8, 1720),
  createHotel('htl-udr-006', 'RAAS Devigarh', 'Udaipur', 5, 'NH8, Near Eklingji Temple, Delwara, Udaipur', 9400, 9900, 5, ['18th Century Fortress Palace', 'Heated Lap Pool', 'Luxury Spa'], 'Aravalli Suite', 4.8, 1180),
  createHotel('htl-udr-007', 'Chunda Palace Udaipur', 'Udaipur', 4, '1 Haridas Ji Ki Magri, Main Road, Udaipur', 5200, 4900, 6, ['Hand-Painted Ceilings', 'Indoor & Outdoor Pools', 'Lake View Rooftop'], 'Palace Traditional Room', 4.5, 960),
  createHotel('htl-udr-008', 'Jagmandir Island Palace Udaipur', 'Udaipur', 5, 'Lake Pichola, Udaipur', 11500, 12100, 7, ['Historic Island Garden Palace', 'Boat Transfers', 'Royal Spa Treatment'], 'Island Heritage Suite', 4.8, 1340),
  createHotel('htl-udr-009', 'Amet Haveli Udaipur', 'Udaipur', 3, 'Outside Chandpole, Lake Pichola Shore', 3800, 3550, 8, ['Ambrai Restaurant on Waterfront', 'Lake View Rooms', 'Free WiFi'], 'Heritage Deluxe Lake Facing', 4.5, 870),
  createHotel('htl-udr-010', 'Hotel Lakend Udaipur', 'Udaipur', 4, 'Alkapuri, Fatehsagar Lake Shore, Udaipur', 4600, 4900, 9, ['Fatehsagar Lakefront', 'Infinity Pool', 'Spa', 'Free Breakfast'], 'Lake Facing Executive Suite', 4.4, 790),

  // ── Agra Hotels (8 properties) ──
  createHotel('htl-agr-001', 'The Oberoi Amarvilas Agra', 'Agra', 5, 'Taj East Gate Road, 600m to Taj Mahal', 16000, 15200, 0, ['Unobstructed Taj Mahal View', 'Private Golf Cart Transfer', 'Spa'], 'Premier Room with Taj Mahal View', 5.0, 3100),
  createHotel('htl-agr-002', 'ITC Mughal A Luxury Collection Hotel Agra', 'Agra', 5, 'Fatehabad Road, Taj Ganj, Agra', 6800, 7200, 1, ['Aga Khan Architecture Award', 'Kaya Kalp Spa', 'Two Pools', 'Gardens'], 'Mughal Room King', 4.7, 1850),
  createHotel('htl-agr-003', 'Taj Hotel & Convention Centre Agra', 'Agra', 5, 'Near Taj East Gate, Fatehabad Road, Agra', 5400, 5100, 2, ['Rooftop Infinity Pool with Taj View', 'Spa', 'Fine Dining', 'Free WiFi'], 'Superior Room with Taj View', 4.7, 1620),
  createHotel('htl-agr-004', 'Trident Agra', 'Agra', 5, 'Fatehabad Road, Near Taj Mahal, Agra', 4900, 5200, 3, ['Landscaped Mughal Gardens', 'Outdoor Pool', 'Kids Club', 'Free Breakfast'], 'Deluxe Garden View Room', 4.6, 1290),
  createHotel('htl-agr-005', 'Courtyard by Marriott Agra', 'Agra', 4, 'Fatehabad Road, Agra', 3800, 3550, 4, ['Outdoor Pool', 'Spa', 'Gym', 'Free High-Speed WiFi'], 'Deluxe King Room', 4.4, 1100),
  createHotel('htl-agr-006', 'DoubleTree by Hilton Hotel Agra', 'Agra', 4, 'B/H - 1&2, Taj Nagri Phase II, Fatehabad Road', 3600, 3900, 5, ['Warm Chocolate Cookie on Arrival', 'Rooftop Pool Taj View', 'Spa'], 'Guest King Room', 4.4, 1180),
  createHotel('htl-agr-007', 'Crystal Sarovar Premiere Agra', 'Agra', 4, 'Fatehabad Road, Taj Ganj, Agra', 3100, 2900, 6, ['Rooftop Restaurant Taj View', 'Swimming Pool', 'Free WiFi'], 'Deluxe King Room', 4.2, 840),
  createHotel('htl-agr-008', 'The Retreat Agra', 'Agra', 3, 'Taj Nagri Phase I, Fatehabad Road, Agra', 1900, 2100, 7, ['Close to Taj Mahal', 'Restaurant', 'Free High-Speed WiFi'], 'Standard Executive Room', 3.8, 460),

  // ── Manali Hotels (8 properties) ──
  createHotel('htl-mnl-001', 'The Himalayan Resort Manali', 'Manali', 4, 'Hadimba Temple Road, Kullu Valley, Manali', 5200, 4900, 0, ['Victorian Gothic Castle Decor', 'Outdoor Pool', 'Dhauladhar Views'], 'Castle Grand Chamber', 4.8, 890),
  createHotel('htl-mnl-002', 'Span Resort and Spa Kullu-Manali', 'Manali', 5, 'Baragran, National Highway 21, Kullu-Manali Highway', 8200, 8700, 1, ['Beas Riverbank Walk', 'Helipad', 'Riverside Dining', 'Heated Pool'], 'River Facing Suite', 4.8, 1140),
  createHotel('htl-mnl-004', 'Larisa Resort Manali', 'Manali', 4, 'Haripur, Kullu-Manali Highway, Manali', 5600, 5950, 3, ['Apple Orchards', 'Outdoor Swimming Pool', 'Spa', 'Organic Garden Dining'], 'Orchard Villa Suite', 4.7, 650),
  createHotel('htl-mnl-003', 'Solang Valley Resort Manali', 'Manali', 4, 'VPO Palchan, Solang Valley, Manali', 4800, 4500, 2, ['Snow Mountain Views', 'River Walkway', 'Free Breakfast', 'Bonfire'], 'Glacier View Deluxe Room', 4.6, 780),
  createHotel('htl-mnl-005', 'Manu Allaya Resort & Spa Manali', 'Manali', 4, 'Sunny Side, Chadiyari, Manali', 4100, 3850, 4, ['Valley Panoramic Views', 'Indoor Heated Pool', 'Bowling Alley', 'Spa'], 'Garden Facing Deluxe', 4.4, 820),
  createHotel('htl-mnl-006', 'Apple Country Resort Manali', 'Manali', 4, 'Log Huts Area, Old Manali', 3400, 3700, 5, ['Highest Mountain Ridge View', 'Cedar Spa', 'Pure Veg Restaurant'], 'Deluxe Pine View Room', 4.3, 710),
  createHotel('htl-mnl-007', 'The Orchard Greens Manali', 'Manali', 3, 'Log Huts Area, Hadimba Road, Manali', 2400, 2250, 6, ['Surrounded by Apple Trees', 'Free Breakfast', 'Free WiFi', 'Games Room'], 'Luxury Balcony Room', 4.2, 540),
  createHotel('htl-mnl-008', 'Johnson Lodge & Spa Manali', 'Manali', 3, 'Circuit House Road, Manali', 2900, 3100, 7, ['Historic 1907 Lodge', 'Johnson Cafe Access', 'Wood-Fired Pizza', 'Spa'], 'Heritage Wooden Cottage', 4.4, 690),

  // ── Kochi / Kerala Hotels (10 properties) ──
  createHotel('htl-koc-001', 'Brunton Boatyard Kochi - CGH Earth', 'Kochi', 5, '1/498 Calvathy Road, Fort Kochi', 7800, 7350, 0, ['Harbor Waterfront Views', 'Historic Shipyard Decor', 'Pool', 'Seafood'], 'Sea Facing Harbor Room', 4.8, 1220),
  createHotel('htl-koc-002', 'Grand Hyatt Kochi Bolgatty', 'Kochi', 5, 'Bolgatty Island, Mulavukad, Kochi', 7200, 7650, 1, ['Vembanad Lakefront', 'Indoor & Outdoor Pools', 'Santata Spa', 'Marina'], 'Grand King Lake View', 4.9, 1680),
  createHotel('htl-koc-003', 'Kumarakom Lake Resort Kerala', 'Kochi', 5, 'Vembanad Lake, Kumarakom, Kottayam', 11500, 10900, 2, ['Meandering Pool Access', 'Traditional Kerala Heritage Villas', 'Ayurveda'], 'Heritage Villa with Private Pool', 5.0, 2100),
  createHotel('htl-koc-004', 'The Malabar House Fort Kochi', 'Kochi', 4, '1/268 Parade Ground, Fort Kochi', 5200, 5600, 3, ['Relais & Chateaux Heritage Manor', 'Courtyard Pool', 'Fine Wine Cellar'], 'Heritage Malabar Suite', 4.7, 750),
  createHotel('htl-koc-005', 'Taj Malabar Resort & Spa Cochin', 'Kochi', 5, 'Willingdon Island, Kochi', 6900, 6500, 4, ['Arabian Sea Sunset Cruise', 'Infinity Pool', 'Jiva Spa', 'Seafood'], 'Superior Sea Facing Room', 4.8, 1420),
  createHotel('htl-koc-006', 'Fragrant Nature Kochi', 'Kochi', 4, 'Calvathy Bazaar Road, Fort Kochi', 4200, 4500, 5, ['Rooftop Swimming Pool', 'Trompe Loeil Wall Art', 'Spa', 'Free WiFi'], 'Duke Chambers Room', 4.5, 680),
  createHotel('htl-koc-007', 'Forte Kochi Luxury Heritage Hotel', 'Kochi', 4, '1/170 Princess Street, Fort Kochi', 4800, 4550, 6, ['Portuguese & Dutch Architecture', 'Central Courtyard Pool', 'Breakfast'], 'Imperial Heritage Room', 4.6, 590),
  createHotel('htl-koc-008', 'Kochi Marriott Hotel Edappally', 'Kochi', 5, 'Lulu International Shopping Mall Campus, Edappally', 5400, 5800, 7, ['Connected to Lulu Mall', 'Outdoor Pool', 'Quan Spa', 'Airport Shuttle'], 'Executive Club King', 4.7, 1310),
  createHotel('htl-koc-009', 'Old Harbour Hotel Fort Kochi', 'Kochi', 4, '1/328 Tower Road, Fort Kochi', 4600, 4300, 8, ['300-Year-Old Dutch Heritage House', 'Garden Pool', 'Ayurveda Treatments'], 'Garden View Cottage', 4.6, 620),
  createHotel('htl-koc-010', 'Eighth Bastion - CGH Earth', 'Kochi', 4, 'Calvathy Road, Fort Kochi', 3800, 4100, 9, ['Dutch Colonial Elegance', 'Plunge Pool', 'East Indies Fusion Dining'], 'Bastion King Room', 4.5, 510),

  // ── Varanasi Hotels (8 properties) ──
  createHotel('htl-vns-001', 'BrijRama Palace Varanasi', 'Varanasi', 5, 'Darbhanga Ghat, Dashashwamedh Ghat Area', 11200, 10600, 0, ['On Darbhanga Ghat Edge', 'Historic 18th Century Fortress', 'Riverboat'], 'Nadidhara River View Suite', 4.9, 1540),
  createHotel('htl-vns-002', 'Taj Ganges Varanasi', 'Varanasi', 5, 'Nadesar Palace Grounds, Varanasi', 7600, 8100, 1, ['40 Acres Landscaped Gardens', 'Outdoor Pool', 'Jiva Spa', 'Free Breakfast'], 'Executive Garden View Room', 4.8, 1380),
  createHotel('htl-vns-003', 'Taj Nadesar Palace Varanasi', 'Varanasi', 5, 'Nadesar Palace Compound, Varanasi', 14500, 13900, 2, ['Former Residence of Maharaja', 'Horse Carriage Ride', 'Private Butler'], 'Historical Palace Suite', 5.0, 980),
  createHotel('htl-vns-004', 'Radisson Hotel Varanasi', 'Varanasi', 4, 'The Mall, Cantonment, Varanasi', 4500, 4800, 3, ['Outdoor Pool', 'Great Kabab Factory', 'Fitness Center', 'Free WiFi'], 'Superior King Room', 4.4, 1120),
  createHotel('htl-vns-005', 'Ramada Plaza by Wyndham JHV Varanasi', 'Varanasi', 4, 'The Mall, Cantonment, Varanasi', 4200, 3950, 4, ['Outdoor Pool', 'Shopping Arcade', 'Spa', 'Free High-Speed WiFi'], 'Deluxe Double Room', 4.3, 980),
  createHotel('htl-vns-006', 'Amritara Suryauday Haveli Varanasi', 'Varanasi', 4, 'Shivala Ghat, Varanasi', 5200, 5600, 5, ['Overlooking Shivala Ghat', 'Morning Rooftop Yoga', 'Classical Music'], 'Shivala Ghat River View', 4.6, 730),
  createHotel('htl-vns-007', 'Hotel Madhuban Varanasi', 'Varanasi', 3, 'Cantonment Area, Varanasi', 2100, 1950, 6, ['Free High-Speed WiFi', 'Vegetarian Dining', 'Free Parking'], 'Standard AC Room', 4.0, 420),
  createHotel('htl-vns-008', 'Palace on Ganges Varanasi', 'Varanasi', 3, 'Assi Ghat, Varanasi', 2800, 3050, 7, ['Near Assi Ghat', 'Rooftop Aarti View', 'Free Breakfast', 'Free WiFi'], 'Heritage Assi Room', 4.2, 590),

  // ── Amritsar Hotels (8 properties) ──
  createHotel('htl-asr-001', 'Taj Swarna Amritsar', 'Amritsar', 5, 'Majitha Verka Bypass, Amritsar', 5800, 5400, 0, ['Outdoor Pool', 'Jiva Spa', 'Grand Punjab Dining', 'Free Breakfast'], 'Luxury King Room', 4.8, 1420),
  createHotel('htl-asr-002', 'Hyatt Regency Amritsar', 'Amritsar', 5, 'MBM Farms, GT Road, Amritsar', 5200, 5600, 1, ['Free Shuttle to Golden Temple', 'Outdoor Vitality Pool', 'Shanti Spa'], 'Regency King Suite', 4.7, 1680),
  createHotel('htl-asr-003', 'Radisson Blu Hotel Amritsar', 'Amritsar', 4, 'Adjacent to Airport, Ajnala Road, Amritsar', 3800, 3550, 2, ['Outdoor Pool', 'Airport Shuttle', 'Gym', 'Free High-Speed WiFi'], 'Superior Room', 4.4, 980),
  createHotel('htl-asr-004', 'Ramada by Wyndham Amritsar', 'Amritsar', 4, '117/1 Hall Bazaar, Near Golden Temple', 4100, 4400, 3, ['Walking Distance to Golden Temple', 'Rooftop Pool', 'Free Breakfast'], 'Executive King Room', 4.5, 1850),
  createHotel('htl-asr-005', 'Courtyard by Marriott Amritsar', 'Amritsar', 4, 'Mall Road, Amritsar', 4400, 4150, 4, ['Rooftop Swimming Pool', 'Vibrant Bar', 'Gym', 'Free WiFi'], 'Deluxe City View Room', 4.5, 890),
  createHotel('htl-asr-006', 'Fortune Select Boulevard Amritsar', 'Amritsar', 4, 'East Mohan Nagar, Amritsar', 3200, 3450, 5, ['Swimming Pool', 'Multi-Cuisine Restaurant', 'Free Parking'], 'Fortune Club Room', 4.2, 640),
  createHotel('htl-asr-007', 'Hotel City Park Amritsar', 'Amritsar', 3, 'Near Golden Temple, Jallianwala Bagh', 2200, 2050, 6, ['50m from Jallianwala Bagh', 'Free WiFi', 'Pure Veg Restaurant'], 'Deluxe Double Room', 4.1, 520),
  createHotel('htl-asr-008', 'Fairfield by Marriott Amritsar', 'Amritsar', 3, 'Albert Road, Amritsar', 2900, 3100, 7, ['Outdoor Pool', 'Kava Grill', '24h Fitness Center', 'Free WiFi'], 'Standard King Room', 4.3, 760),

  // ── Kolkata Hotels (8 properties) ──
  createHotel('htl-ccu-001', 'The Oberoi Grand Kolkata', 'Kolkata', 5, '15 Jawaharlal Nehru Road, New Market Area', 8900, 8400, 0, ['Grand Dame of Chowringhee', 'Outdoor Pool', 'Spa', 'Thai Dining'], 'Premier Classic Room', 4.9, 1920),
  createHotel('htl-ccu-002', 'ITC Royal Bengal Kolkata', 'Kolkata', 5, '1 JBS Haldane Avenue, EM Bypass, Kolkata', 8200, 8700, 1, ['Aristocratic Bengal Architecture', 'Kaya Kalp Spa', 'Pool', 'Fine Dining'], 'Grand Presidential Suite', 4.9, 2100),
  createHotel('htl-ccu-003', 'Taj Bengal Kolkata', 'Kolkata', 5, '34B Belvedere Road, Alipore, Kolkata', 7800, 7350, 2, ['Atrium Architecture', 'Outdoor Pool', 'Jiva Spa', 'Free Breakfast'], 'Luxury King Garden View', 4.8, 1680),
  createHotel('htl-ccu-004', 'JW Marriott Hotel Kolkata', 'Kolkata', 5, '4A JBS Haldane Avenue, EM Bypass, Kolkata', 7400, 7850, 3, ['Infinity Pool', 'Quan Spa', 'Nightclub', 'Free High-Speed WiFi'], 'Executive Skyline Room', 4.8, 1540),
  createHotel('htl-ccu-005', 'The Lalit Great Eastern Kolkata', 'Kolkata', 5, '1, 2 & 3 Old Court House Street, Dalhousie Square', 5600, 5250, 4, ['Historic 1840 Heritage Wing', 'Outdoor Pool', 'Rejuve Spa'], 'Heritage Deluxe Room', 4.6, 1250),
  createHotel('htl-ccu-006', 'Hyatt Regency Kolkata', 'Kolkata', 5, 'JA-1 Sector III, Salt Lake City, Kolkata', 5100, 5450, 5, ['Lagoon Pool', 'Club Prana Spa', 'Tennis Courts', 'Free Breakfast'], 'Regency King Room', 4.6, 1180),
  createHotel('htl-ccu-007', 'Peerless Hotel Kolkata', 'Kolkata', 4, '12 Jawaharlal Nehru Road, Esplanade, Kolkata', 3400, 3200, 6, ['Aaheli Authentic Bengali Restaurant', 'Free WiFi', 'Central Location'], 'Superior Executive Room', 4.2, 890),
  createHotel('htl-ccu-008', 'The Astor Hotel Kolkata', 'Kolkata', 3, '15 Shakespeare Sarani, Elgin, Kolkata', 2900, 3150, 7, ['Red-Brick Colonial Heritage', 'Chidiya Ghar Bar', 'Free Breakfast'], 'Heritage Deluxe Room', 4.3, 760),

  // ── Chennai Hotels (8 properties) ──
  createHotel('htl-maa-001', 'ITC Grand Chola Chennai', 'Chennai', 5, '63 Mount Road, Guindy, Chennai', 8900, 8400, 0, ['Chola Dynasty Carved Stone Palatial Architecture', '3 Pools', 'Kaya Kalp Spa'], 'Executive Club Chola', 4.9, 2300),
  createHotel('htl-maa-002', 'The Leela Palace Chennai', 'Chennai', 5, 'Adyar Seaface, MRC Nagar, Chennai', 9600, 10200, 1, ['Chettinad Architecture Oceanfront', 'Outdoor Pool', 'Spa', 'Fine Dining'], 'Grand Sea View Room', 4.9, 1980),
  createHotel('htl-maa-003', 'Taj Coromandel Chennai', 'Chennai', 5, '37 Mahatma Gandhi Road, Nungambakkam, Chennai', 7600, 7200, 2, ['Southern Spice Restaurant', 'Outdoor Pool', 'Jiva Spa', 'Free Breakfast'], 'Luxury Club Room', 4.8, 1540),
  createHotel('htl-maa-004', 'Park Hyatt Chennai', 'Chennai', 5, '39 Velachery Road, Near Guindy National Park', 6400, 6800, 3, ['Rooftop Infinity Pool Overlooking Guindy Park', 'Antahpura Spa'], 'Park Executive Suite', 4.7, 1260),
  createHotel('htl-maa-005', 'Hyatt Regency Chennai', 'Chennai', 5, '365 Anna Salai, Teynampet, Chennai', 5800, 5450, 4, ['Atrium Sunken Lounge', 'Outdoor Pool', 'Siddh Spa', 'Free High-Speed WiFi'], 'Regency King Room', 4.6, 1420),
  createHotel('htl-maa-006', 'The Park Chennai', 'Chennai', 5, '601 Anna Salai, Near US Embassy, Chennai', 4200, 4500, 5, ['Gemini Film Studio Heritage', 'Aqua Poolside Bar', 'Aura Spa'], 'Deluxe King Room', 4.4, 980),
  createHotel('htl-maa-007', 'Residency Towers Chennai', 'Chennai', 4, '115 Sir Thyagaraya Road, T. Nagar, Chennai', 3600, 3350, 6, ['Crown Rooftop Restaurant', 'Swimming Pool', 'Shopping Center Access'], 'Executive Deluxe Room', 4.3, 840),
  createHotel('htl-maa-008', 'Clarion Hotel President Chennai', 'Chennai', 3, '25 Dr. Radhakrishnan Salai, Mylapore, Chennai', 2600, 2800, 7, ['Near Marina Beach', 'Swimming Pool', 'Free High-Speed WiFi'], 'Standard City Room', 4.1, 620),

  // ── Hyderabad Hotels (10 properties) ──
  createHotel('htl-hyd-001', 'Taj Falaknuma Palace Hyderabad', 'Hyderabad', 5, 'Engine Bowli, Fatima Nagar, Falaknuma', 24000, 22800, 0, ['Scorpion-Shaped Palace of the Nizam', 'Horse Carriage Entrance', 'Jade Room'], 'Historical Palace Room', 5.0, 2900),
  createHotel('htl-hyd-002', 'ITC Kohenur Luxury Collection Hyderabad', 'Hyderabad', 5, 'Plot No. 5, HITEC City, Madhapur, Hyderabad', 8200, 8750, 1, ['Durgam Cheruvu Lakefront', 'Kaya Kalp Spa', 'Outdoor Pool', 'Golf Putting'], 'ITC One Executive Room', 4.9, 1850),
  createHotel('htl-hyd-003', 'Park Hyatt Hyderabad', 'Hyderabad', 5, 'Road No. 2, Banjara Hills, Hyderabad', 7600, 7200, 2, ['Monumental Atrium Architecture', 'Heated Outdoor Pool', 'The Spa'], 'Park View King', 4.8, 1640),
  createHotel('htl-hyd-004', 'The Westin Hyderabad Mindspace', 'Hyderabad', 5, 'Raheja IT Park, Hitec City, Madhapur', 6800, 7250, 3, ['Heavenly Bed', 'Outdoor Pool', 'Heavenly Spa', 'Free Breakfast'], 'Deluxe Club King', 4.7, 1490),
  createHotel('htl-hyd-005', 'Taj Krishna Hyderabad', 'Hyderabad', 5, 'Road No. 1, Banjara Hills, Hyderabad', 6900, 6500, 4, ['Banjara Hills Skyline View', 'Large Outdoor Pool', 'Jiva Spa', 'Firdaus Dining'], 'Deluxe Room Garden View', 4.7, 1580),
  createHotel('htl-hyd-006', 'Novotel Hyderabad Convention Centre', 'Hyderabad', 5, 'Near Hitec City, Izzatnagar, Kondapur', 5100, 5450, 5, ['Adjacent to HICC', 'Outdoor Pool', 'O2 Spa', 'Free WiFi'], 'Superior Room King', 4.5, 1260),
  createHotel('htl-hyd-007', 'Sheraton Hyderabad Hotel', 'Hyderabad', 5, 'Financial District, Gachibowli, Hyderabad', 5600, 5300, 6, ['Financial District Hub', 'Outdoor Pool', 'Shine Spa', 'Gym'], 'Club Executive Room', 4.6, 1140),
  createHotel('htl-hyd-008', 'Trident Hyderabad', 'Hyderabad', 5, 'HITEC City, Near Cyber Towers, Madhapur', 6200, 6600, 7, ['Outdoor Pool', 'Kanak Indian Restaurant', 'Fitness Center', 'Free WiFi'], 'Deluxe Executive King', 4.7, 1380),
  createHotel('htl-hyd-009', 'The Golkonda Hotel Hyderabad', 'Hyderabad', 4, 'Banjara Hills, Masab Tank, Hyderabad', 3200, 2980, 8, ['Swimming Pool', 'Melange Coffee Shop', 'Free WiFi', 'Gym'], 'Club Superior Room', 4.2, 790),
  createHotel('htl-hyd-010', 'Red Fox Hotel HITEC City Hyderabad', 'Hyderabad', 3, 'Plot No 2, Survey No 64, Hitec City, Madhapur', 2400, 2600, 9, ['Cyber Towers Neighborhood', 'Free Breakfast', 'Free WiFi'], 'Standard Fox Queen', 4.2, 680),

  // ── Pune Hotels (8 properties) ──
  createHotel('htl-pnq-001', 'The Ritz-Carlton Pune', 'Pune', 5, 'Golf Course Square, Airport Road, Yerawada', 8900, 8400, 0, ['Overlooking Poona Club Golf Course', 'Rooftop Lounge', 'Ritz Spa', 'Pool'], 'Golf View Premier Suite', 4.9, 1420),
  createHotel('htl-pnq-002', 'JW Marriott Hotel Pune', 'Pune', 5, 'Senapati Bapat Road, Pune', 7800, 8250, 1, ['Rooftop Paasha Lounge', 'Quan Spa', 'Outdoor Pool', 'Free Breakfast'], 'Executive King Room', 4.8, 1890),
  createHotel('htl-pnq-003', 'Conrad Pune by Hilton', 'Pune', 5, '7 Mangaldas Road, Bund Garden Area, Pune', 7200, 6800, 2, ['Art Deco Grand Architecture', 'Outdoor Temperature Pool', 'Conrad Spa'], 'Deluxe King Room', 4.8, 1540),
  createHotel('htl-pnq-004', 'Sheraton Grand Pune Bund Garden Hotel', 'Pune', 5, 'Raja Bahadur Mill Road, Pune', 5400, 5800, 3, ['Historic Victorian Elegance', 'Rooftop Pool', 'Shine Spa', 'Free WiFi'], 'Club Executive Room', 4.6, 1180),
  createHotel('htl-pnq-005', 'Hyatt Pune Kalyani Nagar', 'Pune', 4, 'Adjacent to Aga Khan Palace, Kalyani Nagar', 4600, 4300, 4, ['Adjacent to Aga Khan Palace', 'Outdoor Pool', 'Spa', 'Free Breakfast'], 'Deluxe King Garden View', 4.5, 1250),
  createHotel('htl-pnq-006', 'The Westin Pune Koregaon Park', 'Pune', 5, '36/3-B Koregaon Park Annexe, Mundhwa Road', 6700, 7100, 5, ['Koregaon Park Location', 'Heavenly Bed', 'Outdoor Pool', 'Spa'], 'Deluxe King River View', 4.7, 1390),
  createHotel('htl-pnq-007', 'Vivanta Pune Hinjawadi', 'Pune', 4, 'Xion Complex, Wakad Hinjawadi Flyover', 3800, 3550, 6, ['IT Hub Hinjawadi Location', 'Rooftop Pool', 'Gym', 'Free WiFi'], 'Superior King Room', 4.3, 910),
  createHotel('htl-pnq-008', 'Ibis Pune Viman Nagar', 'Pune', 3, 'Viman Nagar, Nagar Road, Near Airport', 2500, 2700, 7, ['Near Pune Airport', 'Spice It Restaurant', 'Free High-Speed WiFi'], 'Standard Double Room', 4.1, 740),
];

// In-memory array storing all hotels, initialized from INITIAL_HOTELS
let hotelDatabase: MockHotel[] = [...INITIAL_HOTELS];

// ── Query & CRUD Functions ──────────────────────────────────────────────────

/**
 * Retrieve all hotels currently stored in the mock database.
 *
 * @returns Array of all MockHotel items
 */
export function getAllMockHotels(): MockHotel[] {
  // Return copy of all in-memory hotels
  return [...hotelDatabase];
}

/**
 * Filter and paginate hotels for a given destination city.
 * Supports optional price filtering (minPrice, maxPrice) and pagination (page, limit).
 *
 * @param city - Target city name
 * @param options - Filter and pagination criteria
 * @returns Filtered hotel records and pagination metadata
 */
export function getHotelsByCity(
  city: string,
  options?: {
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
    priceModifier?: { bestPrice?: number; isSupplierACheaper?: boolean; winningHotelName?: string };
  }
): {
  city: string;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hotels: MockHotel[];
} {
  // Normalize destination name
  const targetCity = (city || '').trim().toLowerCase();

  // Filter hotels matching city name (exact or substring match, or all hotels if empty/all)
  let filtered =
    !targetCity || targetCity === 'all'
      ? [...hotelDatabase]
      : hotelDatabase.filter((h) => {
          const hotelCity = h.city.toLowerCase();
          return hotelCity === targetCity || hotelCity.includes(targetCity) || targetCity.includes(hotelCity);
        });

  // Apply minimum price filter if specified
  if (options?.minPrice !== undefined && options.minPrice > 0) {
    filtered = filtered.filter((h) => h.price >= options.minPrice!);
  }

  // Apply maximum price filter if specified
  if (options?.maxPrice !== undefined && options.maxPrice > 0) {
    filtered = filtered.filter((h) => h.price <= options.maxPrice!);
  }

  // If price modifier override was provided (e.g. from workflow comparison)
  if (options?.priceModifier && filtered.length > 0) {
    const first = filtered[0];
    const isA = options.priceModifier.isSupplierACheaper ?? true;
    const best = options.priceModifier.bestPrice || first.price;
    const higherRate = Math.round(best * 1.08);

    first.cheaperSupplier = isA ? 'Supplier A' : 'Supplier B';
    first.rateA = isA ? best : higherRate;
    first.rateB = isA ? higherRate : best;
    first.price = best;
    first.savings = Math.abs(first.rateA - first.rateB);
    if (options.priceModifier.winningHotelName) {
      first.name = options.priceModifier.winningHotelName;
    }
  }

  // Total matching hotels before pagination
  const total = filtered.length;

  // Pagination parameters (default page 1, default limit 200 to allow viewing all inventory)
  const page = Math.max(1, Number(options?.page) || 1);
  const limit = Math.max(1, Number(options?.limit) || 200);
  const totalPages = Math.ceil(total / limit) || 1;

  // Calculate slice range for current page
  const startIndex = (page - 1) * limit;
  const paginatedHotels = filtered.slice(startIndex, startIndex + limit);

  return {
    city: targetCity && targetCity !== 'all' ? (city || 'Goa') : 'All Destinations',
    total,
    page,
    limit,
    totalPages,
    hotels: paginatedHotels,
  };
}

/**
 * Find single hotel by its unique identifier.
 *
 * @param hotelId - Unique hotel ID
 * @returns Found MockHotel or undefined
 */
export function getHotelById(hotelId: string): MockHotel | undefined {
  // Locate hotel matching ID
  return hotelDatabase.find((h) => h.hotelId === hotelId);
}

/**
 * Add a new custom hotel to the in-memory database.
 *
 * @param hotel - New MockHotel object
 * @returns The newly added MockHotel
 */
export function addCustomHotel(hotel: Omit<MockHotel, 'hotelId' | 'price' | 'savings' | 'cheaperSupplier'> & { hotelId?: string }): MockHotel {
  // Compute price, savings, and cheaper supplier
  const price = Math.min(hotel.rateA, hotel.rateB);
  const savings = Math.abs(hotel.rateA - hotel.rateB);
  const cheaperSupplier = hotel.rateA <= hotel.rateB ? 'Supplier A' : 'Supplier B';
  const hotelId = hotel.hotelId || `htl-${hotel.city.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`;

  const newHotel: MockHotel = {
    ...hotel,
    hotelId,
    price,
    savings,
    cheaperSupplier,
  };

  // Prepend to catalog
  hotelDatabase.unshift(newHotel);
  return newHotel;
}

/**
 * Update an existing hotel record.
 *
 * @param hotelId - Target hotel ID
 * @param updates - Partial hotel properties to update
 * @returns Updated MockHotel or null if not found
 */
export function updateHotel(hotelId: string, updates: Partial<MockHotel>): MockHotel | null {
  // Find index of hotel in database
  const index = hotelDatabase.findIndex((h) => h.hotelId === hotelId);
  if (index === -1) return null;

  // Merge updates
  const existing = hotelDatabase[index];
  const merged = { ...existing, ...updates };

  // Recompute rates if rateA or rateB changed
  merged.price = Math.min(merged.rateA, merged.rateB);
  merged.savings = Math.abs(merged.rateA - merged.rateB);
  merged.cheaperSupplier = merged.rateA <= merged.rateB ? 'Supplier A' : 'Supplier B';

  hotelDatabase[index] = merged;
  return merged;
}

/**
 * Delete a hotel record from the in-memory database.
 *
 * @param hotelId - Target hotel ID
 * @returns True if deleted, false if not found
 */
export function deleteHotel(hotelId: string): boolean {
  // Filter out the hotel matching the ID
  const initialLength = hotelDatabase.length;
  hotelDatabase = hotelDatabase.filter((h) => h.hotelId !== hotelId);
  return hotelDatabase.length < initialLength;
}

/**
 * Data interface for destination city summary metadata.
 */
export interface DestinationSummary {
  // Name of the destination city
  city: string;
  // Total number of hotels available in this destination
  hotelCount: number;
  // Lowest nightly rate available in this destination in INR
  minPrice: number;
  // Representative image URL for destination cards
  image: string;
  // Flag indicating whether this destination is a featured popular hub
  popular: boolean;
}

/**
 * Aggregates all unique destination cities from the in-memory hotel catalog.
 *
 * @returns Array of destination summaries with hotel counts, minimum rates, and images
 */
export function getDestinationsList(): DestinationSummary[] {
  // Map to accumulate destination statistics keyed by city name
  const destinationMap = new Map<string, { hotelCount: number; minPrice: number; image: string }>();

  // Iterate over every hotel in the catalog to calculate statistics
  for (const hotel of hotelDatabase) {
    const existing = destinationMap.get(hotel.city);
    if (existing) {
      existing.hotelCount += 1;
      if (hotel.price < existing.minPrice) {
        existing.minPrice = hotel.price;
      }
    } else {
      destinationMap.set(hotel.city, {
        hotelCount: 1,
        minPrice: hotel.price,
        image: hotel.image,
      });
    }
  }

  // Priority list of popular destinations
  const popularCities = new Set([
    'Meerut',
    'Goa',
    'Jaipur',
    'Mumbai',
    'Delhi',
    'Bengaluru',
    'Udaipur',
    'Agra',
    'Manali',
    'Kochi',
  ]);

  // Transform map entries into array of destination summary objects
  const destinations: DestinationSummary[] = Array.from(destinationMap.entries()).map(
    ([city, data]) => ({
      city,
      hotelCount: data.hotelCount,
      minPrice: data.minPrice,
      image: data.image,
      popular: popularCities.has(city),
    })
  );

  // Sort popular cities first, then alphabetically by city name
  destinations.sort((a, b) => {
    if (a.popular && !b.popular) return -1;
    if (!a.popular && b.popular) return 1;
    return a.city.localeCompare(b.city);
  });

  return destinations;
}

/**
 * Validates whether a given city name matches an available destination in the catalog.
 *
 * @param queryCity - City name or search prefix entered by the user
 * @returns Object with valid flag and normalized city name if matched
 */
export function validateDestination(queryCity: string): { valid: boolean; normalizedCity?: string } {
  // Return invalid if empty string provided
  if (!queryCity || !queryCity.trim()) {
    return { valid: false };
  }

  const normalizedQuery = queryCity.trim().toLowerCase();

  // Find matching destination in database
  const match = hotelDatabase.find((hotel) => {
    const hotelCity = hotel.city.toLowerCase();
    return hotelCity === normalizedQuery || hotelCity.includes(normalizedQuery) || normalizedQuery.includes(hotelCity);
  });

  if (match) {
    return {
      valid: true,
      normalizedCity: match.city,
    };
  }

  return { valid: false };
}

/**
 * Reset mock hotel database back to initial seed data.
 */
export function resetMockHotels(): void {
  // Restore initial collection
  hotelDatabase = [...INITIAL_HOTELS];
}

