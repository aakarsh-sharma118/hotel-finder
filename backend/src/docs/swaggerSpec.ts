/**
 * @fileoverview Complete OpenAPI 3.0 specification for Hotel Finder API.
 * Defines schemas, query parameters, request bodies, and responses for all API endpoints.
 *
 * © 2026 Aakarsh Sharma. All rights reserved.
 *
 * @module docs/swaggerSpec
 */

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Hotel Finder API',
    version: '1.0.0',
    description:
      'Distributed hotel rate comparison and reservations engine. Aggregates multi-supplier rates via Temporal workflows, serves verified hotel catalogs, and manages reservation lifecycles.',
    contact: {
      name: 'Aakarsh Sharma',
      url: 'https://github.com/aakarsh-sharma118/hotel-finder',
    },
    license: {
      name: 'Commercial Terms - Aakarsh Sharma',
    },
  },
  servers: [
    {
      url: '/',
      description: 'Current Environment Host Server',
    },
    {
      url: 'http://localhost:3001',
      description: 'Local Development Server',
    },
  ],
  tags: [
    { name: 'Hotels', description: 'Hotel catalog browsing, rate filtering, and inventory operations' },
    { name: 'Search', description: 'Real-time multi-supplier rate comparison workflows' },
    { name: 'Bookings', description: 'Hotel reservation creation, updates, and cancellations' },
    { name: 'Suppliers', description: 'Mock rate supplier simulation endpoints' },
    { name: 'System', description: 'Health checks, catalog discovery, and state administration' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Service health check',
        description: 'Returns operational status and current server timestamp.',
        responses: {
          '200': {
            description: 'Server is healthy and responsive',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'OK' },
                    timestamp: { type: 'string', example: '2026-09-14T18:00:00.000Z' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1': {
      get: {
        tags: ['System'],
        summary: 'API catalog discovery',
        description: 'Returns list of all available REST endpoints and service metadata.',
        responses: {
          '200': {
            description: 'API catalog metadata returned successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiCatalogResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/hotels/catalog': {
      get: {
        tags: ['Hotels'],
        summary: 'Get hotel catalog by destination city',
        description:
          'Retrieves verified hotel inventory for a city with optional price range filtering and pagination support.',
        parameters: [
          {
            name: 'city',
            in: 'query',
            description: 'Destination city name (e.g. Meerut, Goa, Mumbai, Delhi)',
            required: false,
            schema: { type: 'string', default: 'Goa', example: 'Meerut' },
          },
          {
            name: 'minPrice',
            in: 'query',
            description: 'Minimum price filter in INR',
            required: false,
            schema: { type: 'number', example: 2000 },
          },
          {
            name: 'maxPrice',
            in: 'query',
            description: 'Maximum price filter in INR',
            required: false,
            schema: { type: 'number', example: 5000 },
          },
          {
            name: 'page',
            in: 'query',
            description: 'Page number for pagination (starts at 1)',
            required: false,
            schema: { type: 'integer', default: 1, example: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of items per page',
            required: false,
            schema: { type: 'integer', default: 12, example: 6 },
          },
        ],
        responses: {
          '200': {
            description: 'Hotels retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HotelCatalogResponse' },
              },
            },
          },
          '400': {
            description: 'Invalid search parameters',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/hotels/destinations': {
      get: {
        tags: ['Hotels'],
        summary: 'Get list of valid destination cities',
        description:
          'Retrieves all available destination hubs across India and international cities with hotel count, lowest rate, and featured image.',
        responses: {
          '200': {
            description: 'List of valid destinations returned successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DestinationsResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/destinations/validate': {
      get: {
        tags: ['Hotels'],
        summary: 'Validate destination city',
        description: 'Checks if a given destination name matches available catalog inventory.',
        parameters: [
          {
            name: 'city',
            in: 'query',
            description: 'City name or search term to validate',
            required: true,
            schema: { type: 'string', example: 'Meerut' },
          },
        ],
        responses: {
          '200': {
            description: 'Validation outcome returned',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    city: { type: 'string', example: 'Meerut' },
                    valid: { type: 'boolean', example: true },
                    normalizedCity: { type: 'string', example: 'Meerut' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/hotels': {
      post: {
        tags: ['Hotels'],
        summary: 'Add a new custom hotel to catalog',
        description: 'Creates a custom hotel record with rates for Supplier A and Supplier B.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateHotelDto' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Hotel created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Hotel added successfully' },
                    hotel: { $ref: '#/components/schemas/MockHotel' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/hotels/{hotelId}': {
      put: {
        tags: ['Hotels'],
        summary: 'Update hotel details',
        description: 'Updates properties such as name, rates, amenities, or room type for an existing hotel.',
        parameters: [
          {
            name: 'hotelId',
            in: 'path',
            required: true,
            description: 'Unique hotel identifier',
            schema: { type: 'string', example: 'htl-meerut-001' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateHotelDto' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Hotel updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Hotel updated successfully' },
                    hotel: { $ref: '#/components/schemas/MockHotel' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Hotel not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Hotels'],
        summary: 'Delete hotel from catalog',
        description: 'Removes a hotel record from the active catalog by ID.',
        parameters: [
          {
            name: 'hotelId',
            in: 'path',
            required: true,
            description: 'Unique hotel identifier',
            schema: { type: 'string', example: 'htl-meerut-001' },
          },
        ],
        responses: {
          '200': {
            description: 'Hotel deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Hotel htl-meerut-001 removed successfully' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Hotel not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/hotels/search': {
      get: {
        tags: ['Search'],
        summary: 'Search hotel rates via query parameters',
        description:
          'Executes rate comparison across Supplier A and Supplier B using Temporal workflow or direct SLA-guaranteed fallback.',
        parameters: [
          {
            name: 'city',
            in: 'query',
            required: true,
            description: 'Destination city',
            schema: { type: 'string', example: 'Meerut' },
          },
          {
            name: 'checkIn',
            in: 'query',
            required: true,
            description: 'Check-in date (YYYY-MM-DD)',
            schema: { type: 'string', example: '2026-10-10' },
          },
          {
            name: 'checkOut',
            in: 'query',
            required: true,
            description: 'Check-out date (YYYY-MM-DD)',
            schema: { type: 'string', example: '2026-10-14' },
          },
          {
            name: 'waitForResult',
            in: 'query',
            description: 'If false, starts workflow asynchronously and returns workflowId immediately',
            schema: { type: 'boolean', default: true },
          },
        ],
        responses: {
          '200': {
            description: 'Rate comparison completed successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SearchWorkflowResult' },
              },
            },
          },
          '202': {
            description: 'Search workflow started asynchronously',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    workflowId: { type: 'string' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Missing or invalid parameters',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Search'],
        summary: 'Search hotel rates via JSON request body',
        description:
          'Submits search parameters and optional supplier fault simulations (delay, status, abort) in request payload.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SearchHotelsBodyDto' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Rate comparison completed successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SearchWorkflowResult' },
              },
            },
          },
          '400': {
            description: 'Invalid search parameters',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/search-hotels': {
      post: {
        tags: ['Search'],
        summary: 'Legacy search endpoint',
        description: 'Backwards-compatible route for executing rate comparison searches.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SearchHotelsBodyDto' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Search completed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SearchWorkflowResult' },
              },
            },
          },
        },
      },
    },
    '/api/v1/hotels/search/{workflowId}': {
      get: {
        tags: ['Search'],
        summary: 'Query search workflow execution status',
        description: 'Checks status and final result of an in-progress or completed Temporal search workflow.',
        parameters: [
          {
            name: 'workflowId',
            in: 'path',
            required: true,
            description: 'Workflow execution identifier',
            schema: { type: 'string', example: 'hotel-search-meerut-1789406000000-xyz' },
          },
        ],
        responses: {
          '200': {
            description: 'Workflow status found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/WorkflowStatusResponse' },
              },
            },
          },
          '404': {
            description: 'Workflow not found or expired',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/search-status/{workflowId}': {
      get: {
        tags: ['Search'],
        summary: 'Legacy workflow status endpoint',
        description: 'Backwards compatible route to query workflow status.',
        parameters: [
          {
            name: 'workflowId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Status returned',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/WorkflowStatusResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/hotels/search/{workflowId}/cancel': {
      post: {
        tags: ['Search'],
        summary: 'Cancel an active search workflow',
        description: 'Sends cancellation signal to the running Temporal workflow.',
        parameters: [
          {
            name: 'workflowId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Cancellation signal triggered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    workflowId: { type: 'string' },
                    status: { type: 'string', example: 'CANCEL_REQUESTED' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '500': {
            description: 'Cancellation failed or workflow already finished',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/cancel-search/{workflowId}': {
      post: {
        tags: ['Search'],
        summary: 'Legacy cancel workflow endpoint',
        description: 'Backwards compatible route to trigger workflow cancellation.',
        parameters: [
          {
            name: 'workflowId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Cancellation triggered',
          },
        },
      },
    },
    '/api/v1/bookings': {
      get: {
        tags: ['Bookings'],
        summary: 'List all reservations with pagination',
        description:
          'Retrieves confirmed reservations with masked guest PII (privacy protected). Supports page and limit parameters.',
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number (default 1)',
            schema: { type: 'integer', default: 1, example: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of items per page',
            schema: { type: 'integer', default: 20, example: 10 },
          },
        ],
        responses: {
          '200': {
            description: 'Bookings retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BookingsListResponse' },
              },
            },
          },
        },
      },
      post: {
        tags: ['Bookings'],
        summary: 'Create a new verified hotel reservation',
        description: 'Validates guest contact details and confirms a new reservation in the system.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateBookingDto' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Booking created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Booking confirmed successfully' },
                    booking: { $ref: '#/components/schemas/BookingRecord' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error in name, email, or phone',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/bookings/{bookingId}': {
      get: {
        tags: ['Bookings'],
        summary: 'Get booking details by ID',
        description: 'Retrieves details for a single reservation record with masked PII.',
        parameters: [
          {
            name: 'bookingId',
            in: 'path',
            required: true,
            description: 'Booking reference code',
            schema: { type: 'string', example: 'BK-MEERUT-98124' },
          },
        ],
        responses: {
          '200': {
            description: 'Booking found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    booking: { $ref: '#/components/schemas/BookingRecord' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Booking not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      put: {
        tags: ['Bookings'],
        summary: 'Update existing reservation details',
        description: 'Modifies guest notes, dates, or guest occupancy count for a reservation.',
        parameters: [
          {
            name: 'bookingId',
            in: 'path',
            required: true,
            description: 'Booking reference code',
            schema: { type: 'string', example: 'BK-MEERUT-98124' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateBookingDto' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Booking updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Reservation updated successfully' },
                    booking: { $ref: '#/components/schemas/BookingRecord' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Booking not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Bookings'],
        summary: 'Cancel an existing reservation',
        description: 'Updates reservation status to CANCELLED.',
        parameters: [
          {
            name: 'bookingId',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'BK-MEERUT-98124' },
          },
        ],
        responses: {
          '200': {
            description: 'Reservation cancelled successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    booking: { $ref: '#/components/schemas/BookingRecord' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Reservation not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/supplierA/hotels': {
      get: {
        tags: ['Suppliers'],
        summary: 'Mock Supplier A rate API',
        description:
          'Returns real-time rates from Supplier A. Supports fault injection simulations such as delay, status error, and network abort.',
        parameters: [
          {
            name: 'city',
            in: 'query',
            description: 'Target city name',
            schema: { type: 'string', default: 'Meerut', example: 'Meerut' },
          },
          {
            name: 'delay',
            in: 'query',
            description: 'Simulated latency in milliseconds',
            schema: { type: 'integer', example: 100 },
          },
          {
            name: 'status',
            in: 'query',
            description: 'Simulated HTTP error code (e.g. 500)',
            schema: { type: 'integer' },
          },
          {
            name: 'abort',
            in: 'query',
            description: 'If true, destroys TCP socket to simulate network drop',
            schema: { type: 'boolean' },
          },
        ],
        responses: {
          '200': {
            description: 'Supplier A offers returned',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/HotelOffer' },
                },
              },
            },
          },
        },
      },
    },
    '/supplierB/hotels': {
      get: {
        tags: ['Suppliers'],
        summary: 'Mock Supplier B rate API',
        description:
          'Returns real-time rates from Supplier B. Supports fault injection simulations such as delay, status error, and network abort.',
        parameters: [
          {
            name: 'city',
            in: 'query',
            description: 'Target city name',
            schema: { type: 'string', default: 'Meerut', example: 'Meerut' },
          },
          {
            name: 'delay',
            in: 'query',
            description: 'Simulated latency in milliseconds',
            schema: { type: 'integer', example: 100 },
          },
          {
            name: 'status',
            in: 'query',
            description: 'Simulated HTTP error code',
            schema: { type: 'integer' },
          },
          {
            name: 'abort',
            in: 'query',
            description: 'Simulate socket abort',
            schema: { type: 'boolean' },
          },
        ],
        responses: {
          '200': {
            description: 'Supplier B offers returned',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/HotelOffer' },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/admin/reset-mock-state': {
      post: {
        tags: ['System'],
        summary: 'Admin reset for mock state and bookings',
        description: 'Resets transient error simulation counters and clears all user reservations.',
        responses: {
          '200': {
            description: 'Reset completed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/reset-mock-state': {
      post: {
        tags: ['System'],
        summary: 'Reset supplier simulation counters',
        description: 'Clears transient error counters for Supplier A and Supplier B.',
        responses: {
          '200': {
            description: 'Counters reset',
          },
        },
      },
    },
  },
  components: {
    schemas: {
      DestinationSummary: {
        type: 'object',
        properties: {
          city: { type: 'string', example: 'Meerut' },
          hotelCount: { type: 'number', example: 10 },
          minPrice: { type: 'number', example: 1700 },
          image: { type: 'string', example: 'https://images.unsplash.com/photo-1566073771259-6a8506099945' },
          popular: { type: 'boolean', example: true },
        },
      },
      DestinationsResponse: {
        type: 'object',
        properties: {
          destinations: {
            type: 'array',
            items: { $ref: '#/components/schemas/DestinationSummary' },
          },
          total: { type: 'number', example: 16 },
        },
      },
      HotelOffer: {
        type: 'object',
        properties: {
          hotelId: { type: 'string', example: 'htl-meerut-001' },
          name: { type: 'string', example: 'Hotel Bravura Gold Resort Meerut' },
          price: { type: 'number', example: 2600 },
          city: { type: 'string', example: 'Meerut' },
          stars: { type: 'number', example: 4 },
          location: { type: 'string', example: 'Delhi-Roorkee Bypass Road, Meerut' },
          image: { type: 'string' },
        },
      },
      MockHotel: {
        type: 'object',
        properties: {
          hotelId: { type: 'string', example: 'htl-meerut-001' },
          name: { type: 'string', example: 'Hotel Bravura Gold Resort Meerut' },
          city: { type: 'string', example: 'Meerut' },
          stars: { type: 'number', example: 4 },
          location: { type: 'string', example: 'Delhi-Roorkee Bypass Road, Meerut' },
          rateA: { type: 'number', example: 2850 },
          rateB: { type: 'number', example: 2600 },
          cheaperSupplier: { type: 'string', enum: ['Supplier A', 'Supplier B'], example: 'Supplier B' },
          price: { type: 'number', example: 2600 },
          savings: { type: 'number', example: 250 },
          image: { type: 'string' },
          amenities: { type: 'array', items: { type: 'string' }, example: ['Swimming Pool', 'Free WiFi', 'Breakfast'] },
          roomType: { type: 'string', example: 'Executive Suite' },
          rating: { type: 'number', example: 4.4 },
          reviewsCount: { type: 'number', example: 480 },
        },
      },
      HotelCatalogResponse: {
        type: 'object',
        properties: {
          city: { type: 'string', example: 'Meerut' },
          total: { type: 'number', example: 10 },
          page: { type: 'number', example: 1 },
          limit: { type: 'number', example: 6 },
          totalPages: { type: 'number', example: 2 },
          count: { type: 'number', example: 6 },
          hotels: {
            type: 'array',
            items: { $ref: '#/components/schemas/MockHotel' },
          },
        },
      },
      CreateHotelDto: {
        type: 'object',
        required: ['name', 'city', 'stars', 'location', 'rateA', 'rateB', 'amenities'],
        properties: {
          name: { type: 'string', example: 'Meerut Heritage Grand Hotel' },
          city: { type: 'string', example: 'Meerut' },
          stars: { type: 'number', minimum: 1, maximum: 5, example: 4 },
          location: { type: 'string', example: 'Civil Lines, Meerut' },
          rateA: { type: 'number', example: 2500 },
          rateB: { type: 'number', example: 2300 },
          amenities: { type: 'array', items: { type: 'string' }, example: ['Free WiFi', 'Swimming Pool'] },
          roomType: { type: 'string', example: 'Premier Deluxe Suite' },
          image: { type: 'string', example: 'https://images.unsplash.com/photo-1566073771259-6a8506099945' },
        },
      },
      UpdateHotelDto: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          stars: { type: 'number' },
          location: { type: 'string' },
          rateA: { type: 'number' },
          rateB: { type: 'number' },
          amenities: { type: 'array', items: { type: 'string' } },
          roomType: { type: 'string' },
        },
      },
      SearchHotelsBodyDto: {
        type: 'object',
        required: ['city', 'checkIn', 'checkOut'],
        properties: {
          city: { type: 'string', example: 'Meerut' },
          checkIn: { type: 'string', example: '2026-10-10' },
          checkOut: { type: 'string', example: '2026-10-14' },
          guests: { type: 'string', example: '2 Adults' },
          waitForResult: { type: 'boolean', default: true },
          simulations: {
            type: 'object',
            properties: {
              supplierA: {
                type: 'object',
                properties: {
                  delay: { type: 'number' },
                  status: { type: 'number' },
                  abort: { type: 'boolean' },
                },
              },
              supplierB: {
                type: 'object',
                properties: {
                  delay: { type: 'number' },
                  status: { type: 'number' },
                  abort: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
      SearchWorkflowResult: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          status: { type: 'string', enum: ['SUCCESS', 'ERROR', 'NO_HOTELS_FOUND', 'CANCELLED'], example: 'SUCCESS' },
          bestDeal: { $ref: '#/components/schemas/HotelOffer' },
          allOffers: { type: 'array', items: { $ref: '#/components/schemas/HotelOffer' } },
          workflowId: { type: 'string', example: 'hotel-search-meerut-1789406000000-xyz' },
          city: { type: 'string', example: 'Meerut' },
          checkIn: { type: 'string', example: '2026-10-10' },
          checkOut: { type: 'string', example: '2026-10-14' },
          hotels: { type: 'array', items: { $ref: '#/components/schemas/MockHotel' } },
        },
      },
      BookingRecord: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'BK-MEERUT-98124' },
          hotelId: { type: 'string', example: 'htl-meerut-001' },
          hotelName: { type: 'string', example: 'Hotel Bravura Gold Resort Meerut' },
          city: { type: 'string', example: 'Meerut' },
          supplier: { type: 'string', enum: ['SupplierA', 'SupplierB'], example: 'SupplierB' },
          price: { type: 'number', example: 2600 },
          guestName: { type: 'string', example: 'Aakarsh Sharma' },
          guestEmail: { type: 'string', example: 'aa***@example.com' },
          guestPhone: { type: 'string', example: '*******3210' },
          checkIn: { type: 'string', example: '2026-10-10' },
          checkOut: { type: 'string', example: '2026-10-14' },
          guests: { type: 'string', example: '2 Adults' },
          status: { type: 'string', enum: ['CONFIRMED', 'CANCELLED'], example: 'CONFIRMED' },
          createdAt: { type: 'string', example: '2026-09-14T18:00:00.000Z' },
          specialRequests: { type: 'string', example: 'Quiet room on higher floor' },
        },
      },
      CreateBookingDto: {
        type: 'object',
        required: ['hotelId', 'hotelName', 'city', 'guestName', 'guestEmail', 'guestPhone', 'checkIn', 'checkOut'],
        properties: {
          hotelId: { type: 'string', example: 'htl-meerut-001' },
          hotelName: { type: 'string', example: 'Hotel Bravura Gold Resort Meerut' },
          city: { type: 'string', example: 'Meerut' },
          supplier: { type: 'string', enum: ['SupplierA', 'SupplierB'], default: 'SupplierA' },
          price: { type: 'number', example: 2600 },
          guestName: { type: 'string', example: 'Aakarsh Sharma' },
          guestEmail: { type: 'string', example: 'aakarsh.sharma@example.com' },
          guestPhone: { type: 'string', example: '+91 98765 43210' },
          checkIn: { type: 'string', example: '2026-10-10' },
          checkOut: { type: 'string', example: '2026-10-14' },
          guests: { type: 'string', default: '2 Adults', example: '2 Adults' },
          specialRequests: { type: 'string', example: 'Late check-in expected' },
        },
      },
      UpdateBookingDto: {
        type: 'object',
        properties: {
          checkIn: { type: 'string', example: '2026-10-11' },
          checkOut: { type: 'string', example: '2026-10-15' },
          guests: { type: 'string', example: '3 Adults' },
          specialRequests: { type: 'string', example: 'Ground floor room required' },
        },
      },
      BookingsListResponse: {
        type: 'object',
        properties: {
          total: { type: 'number', example: 4 },
          page: { type: 'number', example: 1 },
          limit: { type: 'number', example: 20 },
          totalPages: { type: 'number', example: 1 },
          count: { type: 'number', example: 4 },
          bookings: {
            type: 'array',
            items: { $ref: '#/components/schemas/BookingRecord' },
          },
        },
      },
      WorkflowStatusResponse: {
        type: 'object',
        properties: {
          workflowId: { type: 'string' },
          status: { type: 'string', example: 'COMPLETED' },
          result: { $ref: '#/components/schemas/SearchWorkflowResult' },
        },
      },
      ApiCatalogResponse: {
        type: 'object',
        properties: {
          service: { type: 'string', example: 'Hotel Finder API' },
          version: { type: 'string', example: 'v1' },
          description: { type: 'string' },
          endpoints: { type: 'object' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Missing or invalid parameters' },
          workflowId: { type: 'string' },
        },
      },
    },
  },
};
