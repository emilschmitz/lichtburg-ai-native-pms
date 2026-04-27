import type { Room, Bed } from "./types";

/**
 * Kreuzberg Lichtburg Hostel — Berlin, 17 beds total across 6 rooms on 3 floors.
 *
 * Layout grid: 12 cols × 8 rows.
 */

export const HOSTEL_INFO = {
  name: "Kreuzberg Lichtburg Hostel",
  address: "Oranienstraße 142, 10969 Berlin",
  timezone: "Europe/Berlin",
  currency: "EUR",
  totalBeds: 17,
};

export const ROOMS: Room[] = [
  // --- Floor 0 (ground) ---
  {
    id: "r-101",
    number: "101",
    name: "Spree Dorm",
    class: "shared_mixed",
    capacity: 6,
    floor: 0,
    layout: { x: 0, y: 0, w: 6, h: 4 },
    pricePerNight: 28,
    amenities: ["Lockers", "Reading lights", "USB charging"],
  },
  {
    id: "r-102",
    number: "102",
    name: "Linden Single",
    class: "single_private",
    capacity: 1,
    floor: 0,
    layout: { x: 6, y: 0, w: 3, h: 2 },
    pricePerNight: 65,
    amenities: ["Desk", "Window to courtyard"],
  },
  {
    id: "r-103",
    number: "103",
    name: "Tempelhof Double",
    class: "double_private",
    capacity: 2,
    floor: 0,
    layout: { x: 9, y: 0, w: 3, h: 2 },
    pricePerNight: 92,
    amenities: ["Queen bed", "Shared bath"],
  },

  // --- Floor 1 ---
  {
    id: "r-201",
    number: "201",
    name: "Mauerpark Female",
    class: "shared_female",
    capacity: 4,
    floor: 1,
    layout: { x: 0, y: 0, w: 5, h: 4 },
    pricePerNight: 32,
    amenities: ["Female only", "Lockers", "Vanity"],
  },
  {
    id: "r-202",
    number: "202",
    name: "Görli En-Suite",
    class: "private_ensuite",
    capacity: 2,
    floor: 1,
    layout: { x: 5, y: 0, w: 4, h: 4 },
    pricePerNight: 119,
    amenities: ["Private bath", "Balcony"],
  },

  // --- Floor 2 ---
  {
    id: "r-301",
    number: "301",
    name: "Skyline Twin",
    class: "double_private",
    capacity: 2,
    floor: 2,
    layout: { x: 0, y: 0, w: 4, h: 3 },
    pricePerNight: 78,
    amenities: ["Skylight", "Quiet floor", "Two single beds"],
  },
];

/**
 * Beds — explicitly enumerated so a booking is always per-bed.
 * Total: 6 + 1 + 2 + 4 + 2 + 2 = 17.
 */
export const BEDS: Bed[] = [
  // Spree Dorm (6) — 3 bunks
  { id: "b-101-1t", roomId: "r-101", label: "Bunk 1 top", type: "bunk_top" },
  { id: "b-101-1b", roomId: "r-101", label: "Bunk 1 bottom", type: "bunk_bottom" },
  { id: "b-101-2t", roomId: "r-101", label: "Bunk 2 top", type: "bunk_top" },
  { id: "b-101-2b", roomId: "r-101", label: "Bunk 2 bottom", type: "bunk_bottom" },
  { id: "b-101-3t", roomId: "r-101", label: "Bunk 3 top", type: "bunk_top" },
  { id: "b-101-3b", roomId: "r-101", label: "Bunk 3 bottom", type: "bunk_bottom" },

  // Linden Single (1)
  { id: "b-102-a", roomId: "r-102", label: "Bed A", type: "single" },

  // Tempelhof Double (2)
  { id: "b-103-a", roomId: "r-103", label: "Bed A", type: "double" },
  { id: "b-103-b", roomId: "r-103", label: "Bed B", type: "double" },

  // Mauerpark Female (4) — 2 bunks
  { id: "b-201-1t", roomId: "r-201", label: "Bunk 1 top", type: "bunk_top" },
  { id: "b-201-1b", roomId: "r-201", label: "Bunk 1 bottom", type: "bunk_bottom" },
  { id: "b-201-2t", roomId: "r-201", label: "Bunk 2 top", type: "bunk_top" },
  { id: "b-201-2b", roomId: "r-201", label: "Bunk 2 bottom", type: "bunk_bottom" },

  // Görli En-Suite (2)
  { id: "b-202-a", roomId: "r-202", label: "Bed A", type: "double" },
  { id: "b-202-b", roomId: "r-202", label: "Bed B", type: "single" },

  // Skyline Twin (2 — private twin, both beds sold together)
  { id: "b-301-a", roomId: "r-301", label: "Bed A", type: "single" },
  { id: "b-301-b", roomId: "r-301", label: "Bed B", type: "single" },
];
