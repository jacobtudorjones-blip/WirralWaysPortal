// CGL brand palette, site colours, approvers list, and room/layout data
// extracted from the original single-file app.
import { slugify } from "../lib/helpers.js";

const CGL = {
  blackcurrant: "#5e1b6d",
  neon:         "#ef5ba1",
  saffron:      "#f08300",
  black:        "#000000",
  white:        "#ffffff",
  grey:         "#e8e8e8",
  sky:          "#5dc5ea",
  ocean:        "#0081c1",
  space:        "#004a81",
  lavender:     "#d2c5e2",
  sunshine:     "#fcbf00",
  flame:        "#ec6907",
  amethyst:     "#954b97",
  raspberry:    "#b52372",
  orchid:       "#f4aacc",
};

// ─── SITE COLOURS ─────────────────────────────────────────────────────────────
const SITE_COLOR = {
  "Price Street":   CGL.blackcurrant,
  "Market Street":  CGL.ocean,
  "Argyle Street":  CGL.raspberry,
  "Brighton Street":CGL.saffron,
};

// ─── APPROVERS ────────────────────────────────────────────────────────────────
// Only email is checked — name is parsed from the email automatically
const APPROVERS = [
  { email: "jacob.jones2@cgl.org.uk" },
  { email: "sharon.cooney@cgl.org.uk" },
  { email: "diane.locke@cgl.org.uk" },
  { email: "helen.davies@cgl.org.uk" },
  { email: "toni.kaklamanis@cgl.org.uk" },
  { email: "yvonne.mcgrath@cgl.org.uk" },
  { email: "jack.lawson@cgl.org.uk" },
];

// ─── GENERIC FLOOR PLAN LAYOUT ────────────────────────────────────────────────
function genericLayout(capacity = 4) {
  const cols = Math.min(capacity, 4);
  const elements = [
    { type:"wall",   x:0,   y:0,   w:260, h:200 },
    { type:"window", x:80,  y:0,   w:100, h:8 },
    { type:"door",   x:220, y:160, w:8,   h:40 },
    { type:"tv",     x:90,  y:12,  w:80,  h:20, label:"Screen" },
    { type:"table",  x:55,  y:72,  w:150, h:56, label:"" },
    { type:"plant",  x:8,   y:8,   w:26,  h:26 },
  ];
  const chairPositions = [
    [68,52],[112,52],[68,132],[112,132],[28,82],[202,82]
  ];
  chairPositions.slice(0,Math.min(capacity,6)).forEach(([x,y])=>
    elements.push({ type:"chair", x, y, w:22, h:16 })
  );
  return { width:260, height:200, elements };
}

// ─── ROOMS ────────────────────────────────────────────────────────────────────
const RAW_ROOMS = [
  // Price Street
  { id:"ps_crag", name:"The Crag", icon:"🧗", site:"Price Street", type:"Clinical Room", capacity:3, staffOnly:false, av:"None", accessibility:"Ground floor - fully accessible", notes:"" },
  { id:"ps_ridge", name:"The Ridge", icon:"⛰️", site:"Price Street", type:"Group Room", capacity:8, staffOnly:false, av:"TV & HDMI", accessibility:"Ground floor - fully accessible", notes:"" },
  { id:"ps_basecamp", name:"Basecamp", icon:"🏕️", site:"Price Street", type:"Group Room", capacity:14, staffOnly:false, av:"TV & HDMI", accessibility:"Ground floor - fully accessible", notes:"" },
  { id:"ps_peak", name:"The Peak", icon:"🏔️", site:"Price Street", type:"Training/Meeting Room", capacity:20, staffOnly:true, av:"Touch Screen TV, HDMI, Video Conferencing equipment", accessibility:"Ground floor - fully accessible", notes:"Staff use only" },
  { id:"ps_situation", name:"The Situation Room", icon:"📋", site:"Price Street", type:"Small Meeting Room", capacity:4, staffOnly:true, av:"None", accessibility:"First floor - no lift access, only stairs", notes:"Staff use only" },
  { id:"ps_wellbeing", name:"Wellbeing Space", icon:"🌿", site:"Price Street", type:"Group Room", capacity:12, staffOnly:false, av:"None", accessibility:"Ground floor - fully accessible", notes:"" },
  // Market Street
  { id:"ms_sunflower", name:"Sunflower Room", icon:"🌻", site:"Market Street", type:"121 Room", capacity:3, staffOnly:false, av:"None", accessibility:"First floor - lift access", notes:"" },
  { id:"ms_autumn", name:"Autumn Room", icon:"🍂", site:"Market Street", type:"121 Room", capacity:3, staffOnly:false, av:"None", accessibility:"First floor - lift access", notes:"Assessment use only" },
  { id:"ms_mountain", name:"Mountain Room", icon:"🗻", site:"Market Street", type:"121 Room", capacity:3, staffOnly:false, av:"None", accessibility:"First floor - lift access", notes:"" },
  { id:"ms_ocean", name:"Ocean Room", icon:"🌊", site:"Market Street", type:"Clinical Room", capacity:3, staffOnly:false, av:"TV on wall", accessibility:"First floor - lift access", notes:"" },
  { id:"ms_meadow", name:"Meadow Room", icon:"🌿", site:"Market Street", type:"Large 121 Room/Group Space", capacity:8, staffOnly:false, av:"TV on wall (cast)", accessibility:"First floor - lift access", notes:"" },
  { id:"ms_river", name:"River Room", icon:"🏞️", site:"Market Street", type:"Clinical Room", capacity:3, staffOnly:false, av:"None", accessibility:"First floor - lift access", notes:"" },
  { id:"ms_pebble", name:"Pebble Room", icon:"🪨", site:"Market Street", type:"Clinical Room", capacity:3, staffOnly:false, av:"None", accessibility:"First floor - lift access", notes:"" },
  { id:"ms_berry", name:"Berry Room", icon:"🫐", site:"Market Street", type:"Clinical Room", capacity:3, staffOnly:false, av:"None", accessibility:"First floor - lift access", notes:"" },
  { id:"ms_lavender", name:"Lavender Room", icon:"💜", site:"Market Street", type:"Clinical Room", capacity:3, staffOnly:false, av:"None", accessibility:"First floor - lift access", notes:"" },
  { id:"ms_rose", name:"Rose Room", icon:"🌹", site:"Market Street", type:"Clinical Room", capacity:3, staffOnly:false, av:"None", accessibility:"First floor - lift access", notes:"" },
  { id:"ms_daffodil", name:"Daffodil Room", icon:"🌼", site:"Market Street", type:"Clinical Room", capacity:3, staffOnly:false, av:"None", accessibility:"First floor - lift access", notes:"" },
  { id:"ms_chrysalis", name:"Chrysalis Room", icon:"🦋", site:"Market Street", type:"Training/Meeting Room", capacity:18, staffOnly:true, av:"TV on wall (cast) & speakers", accessibility:"Second floor - lift access", notes:"Staff use only" },
  // Argyle Street
  { id:"as_counselling", name:"Counselling Room", icon:"🤝", site:"Argyle Street", type:"121 Room", capacity:2, staffOnly:false, av:"None", accessibility:"Ground floor - fully accessible", notes:"" },
  { id:"as_group1", name:"First Floor Group Room", icon:"1️⃣", site:"Argyle Street", type:"Group Space", capacity:18, staffOnly:false, av:"TV", accessibility:"First floor - no lift access, only stairs", notes:"First floor — check lift availability" },
  { id:"as_group2", name:"Second Floor Group Room", icon:"2️⃣", site:"Argyle Street", type:"Group Space", capacity:18, staffOnly:false, av:"TV", accessibility:"Second floor - no lift access, only stairs", notes:"Second floor — check lift availability" },
  // Brighton Street
  { id:"bs_garden", name:"Garden Room", icon:"🌱", site:"Brighton Street", type:"Clinical Space", capacity:3, staffOnly:false, av:"None", accessibility:"TBC", notes:"Prescribers room" },
  { id:"bs_primrose", name:"Primrose Room", icon:"🌸", site:"Brighton Street", type:"Group Room", capacity:12, staffOnly:false, av:"TBC", accessibility:"TBC", notes:"" },
  { id:"bs_orchid", name:"Orchid Room", icon:"🌺", site:"Brighton Street", type:"Group Room", capacity:12, staffOnly:false, av:"TBC", accessibility:"TBC", notes:"" },
  { id:"bs_daisy", name:"Daisy Room", icon:"🌼", site:"Brighton Street", type:"Group Room", capacity:12, staffOnly:false, av:"TBC", accessibility:"TBC", notes:"" },
  { id:"bs_bluebell", name:"Bluebell Room", icon:"🔔", site:"Brighton Street", type:"Clinical Room", capacity:3, staffOnly:false, av:"None", accessibility:"TBC", notes:"" },
  { id:"bs_heather", name:"Heather Room", icon:"🪻", site:"Brighton Street", type:"121 Room", capacity:3, staffOnly:false, av:"None", accessibility:"TBC", notes:"" },
  { id:"bs_forest", name:"Forest Room", icon:"🌲", site:"Brighton Street", type:"121 Room", capacity:3, staffOnly:false, av:"None", accessibility:"TBC", notes:"" },
  { id:"bs_fern", name:"Fern Room", icon:"🌿", site:"Brighton Street", type:"121 Room", capacity:3, staffOnly:false, av:"None", accessibility:"TBC", notes:"" },
];

// Detailed Price Street layouts
const PS_LAYOUTS = {
  detailed_crag: {
    width:340, height:260,
    elements:[
      {type:"wall",x:0,y:0,w:340,h:260},{type:"window",x:60,y:0,w:80,h:8},{type:"window",x:200,y:0,w:80,h:8},
      {type:"door",x:310,y:220,w:30,h:8},{type:"tv",x:130,y:10,w:80,h:24,label:"Projector"},
      {type:"table",x:60,y:60,w:220,h:60,label:"Main Table"},
      {type:"chair",x:70,y:44,w:24,h:18},{type:"chair",x:104,y:44,w:24,h:18},{type:"chair",x:138,y:44,w:24,h:18},
      {type:"chair",x:172,y:44,w:24,h:18},{type:"chair",x:206,y:44,w:24,h:18},{type:"chair",x:240,y:44,w:24,h:18},
      {type:"chair",x:70,y:120,w:24,h:18},{type:"chair",x:104,y:120,w:24,h:18},{type:"chair",x:138,y:120,w:24,h:18},
      {type:"chair",x:172,y:120,w:24,h:18},{type:"chair",x:206,y:120,w:24,h:18},{type:"chair",x:240,y:120,w:24,h:18},
      {type:"plant",x:10,y:200,w:28,h:28},{type:"whiteboard",x:10,y:60,w:16,h:60},
    ]
  },
};
const LAYOUT_MAP = { detailed_crag: PS_LAYOUTS.detailed_crag };

const ROOMS = Object.fromEntries(
  RAW_ROOMS.map(r => [r.id, {
    ...r,
    slug: slugify(r.name),
    color: SITE_COLOR[r.site] || CGL.blackcurrant,
    layout: (r.layout && LAYOUT_MAP[r.layout]) || genericLayout(typeof r.capacity === "number" ? r.capacity : 4),
    isPlaceholder: !(r.layout && LAYOUT_MAP[r.layout]),
  }])
);
const ROOM_LIST = Object.values(ROOMS);
const SITES = ["Price Street","Market Street","Argyle Street","Brighton Street"];

// Reverse lookup for /rooms/:slug deep links (see App.jsx). Room names are
// unique in practice; if two ever collide the later one in RAW_ROOMS wins.
const ROOM_BY_SLUG = Object.fromEntries(ROOM_LIST.map(r => [r.slug, r]));

export { CGL, SITE_COLOR, APPROVERS, ROOMS, ROOM_LIST, ROOM_BY_SLUG, SITES };
