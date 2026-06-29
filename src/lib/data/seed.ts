// 40 hand-crafted Bengaluru demand reports. Lat/lng jittered around real area centroids.
// All AI-derived fields produced via the same `mockClassify` contract used at runtime.

import { mockClassify } from "../ai/mockClassifier";
import type { DemandReport } from "@/domain/demand";
import { BLR_ZONES, roundCoord } from "../geo/bengaluru";

const RAW: Array<{
  raw: string;
  zone: string;
  loc?: string;
  status?: "new" | "reviewing" | "acknowledged";
  upvotes?: number;
  daysAgo?: number;
}> = [
  {
    raw: "Massive potholes near Christ University main gate. Causing accidents daily.",
    zone: "koramangala",
    loc: "Near Christ University",
    status: "reviewing",
    upvotes: 47,
    daysAgo: 1,
  },
  {
    raw: "Overflowing garbage dump near Yelahanka station. It stinks and is a health hazard.",
    zone: "yelahanka",
    loc: "Yelahanka Station",
    upvotes: 38,
    daysAgo: 2,
  },
  {
    raw: "Broken streetlights in BTM 2nd stage making it very unsafe for women walking home.",
    zone: "btm_layout",
    loc: "BTM 2nd Stage",
    status: "acknowledged",
    upvotes: 62,
    daysAgo: 3,
  },
  {
    raw: "No safe pedestrian crossing near the metro station. Cars don't stop.",
    zone: "indiranagar",
    loc: "Indiranagar Metro",
    upvotes: 29,
    daysAgo: 1,
  },
  {
    raw: "Poor last-mile bus frequency from ITPL. Tech workers stranded after 9 PM.",
    zone: "whitefield",
    loc: "ITPL Main Road",
    status: "reviewing",
    upvotes: 91,
    daysAgo: 4,
  },
  {
    raw: "No public parks or recreation spaces for kids in this block. We need a playground.",
    zone: "jayanagar",
    loc: "Jayanagar 4th Block",
    upvotes: 33,
  },
  {
    raw: "Severe water leakage from the main pipeline. Wasting thousands of liters.",
    zone: "banashankari",
    loc: "Banashankari 2nd Stage",
    upvotes: 18,
  },
  {
    raw: "Pavements are completely broken and blocked by debris. Unusable for wheelchairs.",
    zone: "hebbal",
    loc: "Hebbal",
    upvotes: 22,
  },
  {
    raw: "Need a subsidized 24x7 study library for students preparing for exams.",
    zone: "koramangala",
    loc: "Koramangala 5th Block",
    status: "reviewing",
    upvotes: 54,
    daysAgo: 6,
  },
  {
    raw: "Missing public pharmacy or clinic access. Closest hospital is 5km away.",
    zone: "rajajinagar",
    loc: "Rajajinagar 2nd Block",
    upvotes: 41,
    daysAgo: 2,
  },
  {
    raw: "Deep crater on the main road turning left. It is a death trap for two-wheelers.",
    zone: "koramangala",
    loc: "Koramangala 6th Block",
    status: "acknowledged",
    upvotes: 87,
    daysAgo: 5,
  },
  {
    raw: "Lack of affordable community daycare centers for working parents in this zone.",
    zone: "electronic_city",
    loc: "Electronic City Phase 1",
    upvotes: 36,
  },
  {
    raw: "No public toilets near the busy market area. Unhygienic conditions everywhere.",
    zone: "banashankari",
    loc: "Banashankari Metro",
    upvotes: 25,
  },
  {
    raw: "Blocked stormwater drains. Entire street floods with just 30 mins of rain.",
    zone: "indiranagar",
    loc: "CMH Road",
    upvotes: 31,
  },
  {
    raw: "No feeder shuttles to the tech park from the main junction. Daily commute is a nightmare.",
    zone: "whitefield",
    loc: "Hope Farm",
    upvotes: 44,
    daysAgo: 3,
  },
  {
    raw: "Public sports ground is poorly maintained and used for illegal dumping.",
    zone: "jayanagar",
    loc: "Jayanagar 9th Block",
    upvotes: 27,
  },
  {
    raw: "Frequent power cuts and no streetlights make this area very unsafe at night.",
    zone: "yelahanka",
    loc: "Yelahanka Phase 2",
    upvotes: 33,
  },
  {
    raw: "Pavements are missing entirely. Pedestrians forced to walk on the busy highway.",
    zone: "electronic_city",
    loc: "Near IIIT-B",
    upvotes: 39,
  },
  {
    raw: "Sewage pipe has burst and water is entering residential compounds.",
    zone: "btm_layout",
    loc: "BTM 1st Stage",
    upvotes: 21,
  },
  {
    raw: "Buses don't stop at the designated shelter. It's too small and always crowded.",
    zone: "hebbal",
    loc: "Hebbal Metro",
    status: "reviewing",
    upvotes: 73,
    daysAgo: 4,
  },
  {
    raw: "Garbage collection hasn't happened in 4 days. Stray dogs are scattering waste.",
    zone: "rajajinagar",
    loc: "Rajajinagar 1st Block",
    upvotes: 19,
  },
  {
    raw: "Need a subsidized community health center. Private clinics are too expensive.",
    zone: "btm_layout",
    loc: "BTM Layout",
    upvotes: 58,
    daysAgo: 7,
  },
  {
    raw: "Streetlights flicker and go off completely after 11 PM. Extremely dark lane.",
    zone: "whitefield",
    loc: "Whitefield Main",
    upvotes: 35,
  },
  {
    raw: "Auto drivers gang up and refuse rides or charge triple. Need traffic police intervention.",
    zone: "yelahanka",
    loc: "Yelahanka Station",
    upvotes: 49,
    daysAgo: 2,
  },
  {
    raw: "There is no accessible ramp at the community hall for senior citizens.",
    zone: "indiranagar",
    loc: "Indiranagar Metro",
    upvotes: 24,
  },
  {
    raw: "Water supply is erratic and muddy. Need immediate inspection of underground pipes.",
    zone: "banashankari",
    loc: "Banashankari 3rd Stage",
    upvotes: 28,
  },
  {
    raw: "Need affordable student canteens or subsidized food options near the university.",
    zone: "banashankari",
    loc: "Near PES University",
    upvotes: 30,
  },
  {
    raw: "Community park equipment is completely rusted and unsafe for children.",
    zone: "jayanagar",
    loc: "Jayanagar East",
    upvotes: 26,
  },
  {
    raw: "No 24x7 emergency medical store in this entire tech corridor.",
    zone: "electronic_city",
    loc: "Electronic City Phase 2",
    status: "reviewing",
    upvotes: 51,
    daysAgo: 3,
  },
  {
    raw: "Blind spot at the intersection causing frequent minor collisions.",
    zone: "koramangala",
    loc: "Koramangala 4th Block",
    upvotes: 32,
  },
  {
    raw: "Road dug up for cable laying and left open for three weeks now.",
    zone: "hebbal",
    loc: "Near MS Ramaiah",
    upvotes: 17,
  },
  {
    raw: "Dark underpass is extremely unsafe for women commuters. Needs immediate lighting.",
    zone: "whitefield",
    loc: "Kadugodi",
    status: "reviewing",
    upvotes: 64,
    daysAgo: 5,
  },
  {
    raw: "Fallen tree branches blocking half the road since the storm two days ago.",
    zone: "indiranagar",
    loc: "HAL Stage 2",
    upvotes: 16,
  },
  {
    raw: "Need a community mental health support group or free counselling center.",
    zone: "rajajinagar",
    loc: "Rajajinagar",
    upvotes: 37,
  },
  {
    raw: "Stray cattle and dogs causing massive traffic jams and safety hazards.",
    zone: "yelahanka",
    loc: "Yelahanka",
    upvotes: 23,
  },
  {
    raw: "Pothole so big that autos have overturned. Needs immediate asphalting.",
    zone: "yelahanka",
    loc: "Near Acharya College",
    upvotes: 42,
    daysAgo: 1,
  },
  {
    raw: "Footpaths encroached completely by illegal construction materials.",
    zone: "jayanagar",
    loc: "Jayanagar 5th Block",
    upvotes: 20,
  },
  {
    raw: "Direct BMTC shuttle needed from Silk Board to office parks. Current route takes 2 hours.",
    zone: "btm_layout",
    loc: "BTM Silk Board",
    status: "reviewing",
    upvotes: 78,
    daysAgo: 6,
  },
  {
    raw: "Public library building is in a dilapidated state and leaks during rains.",
    zone: "banashankari",
    loc: "Banashankari 1st Stage",
    upvotes: 19,
  },
  {
    raw: "No designated auto stand. Autos park haphazardly blocking the entire main road.",
    zone: "hebbal",
    loc: "Manyata Tech Park",
    upvotes: 34,
  },
];

let counter = 0;
function generateLocalId(seed: string) {
  counter++;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `seed-${counter.toString().padStart(2, "0")}-${(h & 0xffff).toString(16)}`;
}

function jitter(n: number, amount = 0.008, seed = 1) {
  const s = Math.sin(seed * 9301 + 49297) * 233280;
  const r = s - Math.floor(s);
  return n + (r - 0.5) * amount * 2;
}

export function buildSeedDemands(): DemandReport[] {
  return RAW.map((row, i) => {
    const zone = BLR_ZONES.find((z) => z.key === row.zone)!;
    const lat = roundCoord(jitter(zone.lat, 0.012, i + 1));
    const lng = roundCoord(jitter(zone.lng, 0.012, i + 7));
    const ai = mockClassify({
      raw_text: row.raw,
      area_label: zone.label,
      location_text: row.loc,
      latitude: lat,
      longitude: lng,
    });
    const daysAgo = row.daysAgo ?? Math.floor((i % 9) + 1);
    const created = new Date(Date.now() - daysAgo * 86400_000 - i * 3600_000).toISOString();
    return {
      id: generateLocalId(row.raw),
      created_at: created,
      reporter_session: `seed-${i}`,
      raw_text: row.raw,
      location_text: row.loc ?? zone.label,
      area_label: zone.label,
      latitude: lat,
      longitude: lng,
      status: row.status ?? "new",
      upvotes: row.upvotes ?? Math.floor(10 + ((i * 7) % 40)),
      ...ai,
    } as DemandReport;
  });
}

export const SEED_DEMANDS: DemandReport[] = buildSeedDemands();
