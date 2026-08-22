// Demo data shown until a real Supabase project is connected (see README.md).
// Once CONFIG.SUPABASE_URL is set, this file is ignored.
const OFFICIAL_BC_SOURCE = {
  official_source_name: "Emergency Department Wait Times (VCH / Fraser Health)",
  official_source_url: "https://www.edwaittimes.ca/legacy",
};

const SAMPLE_FACILITIES = [
  { id: "demo-1", name: "Abbotsford Regional Hospital", type: "er", city: "Abbotsford", province: "BC", lat: 49.0504, lng: -122.2887, avg_wait_minutes: 250, avg_rating: 3.4, recent_report_count: 6, ...OFFICIAL_BC_SOURCE },
  { id: "demo-2", name: "Fraser Valley Urgent Care", type: "walkin", city: "Abbotsford", province: "BC", lat: 49.0561, lng: -122.2960, avg_wait_minutes: 55, avg_rating: 4.1, recent_report_count: 3 },
  { id: "demo-3", name: "Mission Community Hospital", type: "er", city: "Mission", province: "BC", lat: 49.1336, lng: -122.3131, avg_wait_minutes: 80, avg_rating: 4.0, recent_report_count: 1, ...OFFICIAL_BC_SOURCE },
  { id: "demo-4", name: "Surrey Memorial Hospital", type: "er", city: "Surrey", province: "BC", lat: 49.1793, lng: -122.8399, avg_wait_minutes: 300, avg_rating: 2.9, recent_report_count: 9, ...OFFICIAL_BC_SOURCE },
  { id: "demo-5", name: "Toronto General Hospital", type: "er", city: "Toronto", province: "ON", lat: 43.6596, lng: -79.3877, avg_wait_minutes: 190, avg_rating: 3.6, recent_report_count: 4 },
  { id: "demo-6", name: "Foothills Medical Centre", type: "er", city: "Calgary", province: "AB", lat: 51.0654, lng: -114.1329, avg_wait_minutes: 140, avg_rating: 3.8, recent_report_count: 2 },
];
