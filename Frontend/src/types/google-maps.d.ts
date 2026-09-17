// Type declarations for Google Maps Places API
declare global {
    interface Window {
        google: typeof google;
    }
}

declare namespace google.maps {
    class Geocoder {
        geocode(
            request: GeocoderRequest,
            callback: (results: GeocoderResult[] | null, status: GeocoderStatus) => void
        ): void;
    }

    interface GeocoderRequest {
        placeId?: string;
        address?: string;
    }

    interface GeocoderResult {
        geometry: {
            location: {
                lat(): number;
                lng(): number;
            };
        };
        formatted_address: string;
    }

    enum GeocoderStatus {
        OK = 'OK',
        ZERO_RESULTS = 'ZERO_RESULTS',
        OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
        REQUEST_DENIED = 'REQUEST_DENIED',
        INVALID_REQUEST = 'INVALID_REQUEST',
        UNKNOWN_ERROR = 'UNKNOWN_ERROR'
    }

    namespace places {
        class AutocompleteService {
            getPlacePredictions(
                request: AutocompletionRequest,
                callback: (predictions: AutocompletePrediction[] | null, status: PlacesServiceStatus) => void
            ): void;
        }

        interface AutocompletionRequest {
            input: string;
        }

        interface AutocompletePrediction {
            description: string;
            place_id: string;
            structured_formatting?: {
                main_text: string;
                secondary_text: string;
            };
        }

        enum PlacesServiceStatus {
            OK = 'OK',
            ZERO_RESULTS = 'ZERO_RESULTS',
            INVALID_REQUEST = 'INVALID_REQUEST',
            OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
            REQUEST_DENIED = 'REQUEST_DENIED',
            UNKNOWN_ERROR = 'UNKNOWN_ERROR'
        }
    }
}

export { };
