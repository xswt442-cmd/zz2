/* ==========================================================================
   ICEPOINT // HUMAN LIMIT FACILITY
   Single source of truth. Everything editable lives here.
   URL params (see README) override a subset of these at runtime.
   ========================================================================== */

window.CONFIG = {
  /* ---- identity ---------------------------------------------------------- */
  /* streamerName is intentionally left blank. The brand slot renders two
     random lines from streamerLines below instead, on their own schedule.
     Set a value here to pin a fixed name; leave "" for the random rotation. */
  streamerName: "",
  streamerHandle: "ICEPOINT",
  facilityName: "HUMAN LIMIT FACILITY",
  facilitySector: "SECTOR FROST-09",
  facilityDepth: "SUBGLACIAL / -812M",
  subtitle: "CRYOGENIC HUMAN PERFORMANCE TEST",
  subjectId: "SUBJECT_001",
  experimentId: "CRYO-HL-001",
  protocol: "HUMAN_LIMIT_OVERRIDE",
  location: "78°13'N",
  coordinates: "78°13'N 165°42'E",
  station: "ANTARCTIC STATION K-9",

  /* ---- rotating brand lines ---------------------------------------------
     Two lines shown in the identity plate (and mirrored in the subject row).
     Picked at random, never adjacent repeats, and re-rolled slowly. Purely
     decorative: the joke register and the log carry the voice. */
  streamerLines: [
    ["PROTOCOL SUBJECT", "HUMAN LIMIT STUDY"],
    ["ANOMALY INDEX", "REMAINS UNCLASSIFIED"],
    ["SUBJECT DESIGNATION", "PENDING REVIEW"],
    ["OBSERVATION WINDOW", "CONTINUOUS / NO END"],
    ["TEST PARAMETER", "NOT DISCLOSED"],
    ["RESEARCH OBJECTIVE", "SEE FILE 0047"],
    ["ATTEMPT NUMBER", "LOST COUNT"],
    ["DATA CONFIDENCE", "MODERATE TO NONE"],
    ["CANDIDATE POOL", "ONE (1)"],
    ["SELECTION CRITERIA", "AVAILABILITY"],
    ["BASELINE BEHAVIOUR", "UNOBSERVABLE"],
    ["COMPARISON GROUP", "PROPOSED ONLY"],
    ["OUTCOME STATUS", "PENDING REVIEW"],
    ["STOPPING CONDITION", "NONE SUPPLIED"],
    ["ETHICS REVIEW", "DEFERRED"],
    ["EQUIPMENT ISSUED", "ONE HOODIE"],
    ["CALIBRATION DATE", "LONG AGO"],
    ["MONITORING CADENCE", "WHEN CONVENIENT"]
  ],
  streamerLineSwapMs: [26000, 48000],

  /* ---- telemetry seed ---------------------------------------------------- */
  temperature: -47.3,
  windChill: -61.8,
  coreStatus: "STILL ALIVE",
  systemLoad: 97,
  sanity: 14,

  /* ---- subject baselines (percent) --------------------------------------- */
  biometrics: {
    THERMAL_RESISTANCE: 74,
    MENTAL_STABILITY: 31,
    PAIN_TOLERANCE: 92,
    COMMON_SENSE: 3
  },
  footnote: "Baseline human values may no longer apply.",

  /* ---- motion ------------------------------------------------------------ */
  /* 0 = frozen, 1 = default-ish, >1 = more restless. URL: ?intensity= */
  animationIntensity: 0.6,

  /* calm | standard | extreme — URL: ?mode= */
  mode: "standard",

  /* ---- log lines --------------------------------------------------------- */
  /* Serious entries are prefixed with @ and always eligible.
     Plain entries are absurd; they are the punchline. */
  systemLogs: [
    "@Thermal barrier stable",
    "@Cryo-loop pressure nominal",
    "@Ice substrate integrity 98.4%",
    "@Chamber seal verified",
    "@Subject telemetry linked",
    "@Reserve coolant at 71%",
    "@Neural baseline captured",
    "@Atmosphere scrubbed",
    "@Thermal drift within tolerance",
    "@Containment field nominal",
    "@O₂ partial pressure nominal",
    "@Subject refuses to quit",
    "@Common sense disconnected",
    "@Skill issue detected",
    "@Attempting human limit override...",
    "@Override failed successfully",
    "@Sanity buffer overflow",
    "@Chair relocated to cryo-chamber",
    "@Neck rotation beyond spec",
    "@Snack deprioritised",
    "@Motivation source: spite",
    "@Protocol compliant (probably)",
    "@Subject stopped moving for 4h 12m",
    "@Grudge registered locally"
  ],

  /* ---- anomaly register (the jokes) -------------------------------------- */
  /* Exactly 3 are on screen at any time. Swap slowly. */
  anomalies: [
    ["FROSTBITE", "SKILL ISSUE"],
    ["OXYGEN", "OPTIONAL"],
    ["SLEEP", "404"],
    ["TOUCHING GRASS", "UNAVAILABLE"],
    ["MENTAL STATUS", "COMPILED WITH WARNINGS"],
    ["SURVIVAL PROBABILITY", "YES"],
    ["CORE TEMP", "QUESTIONABLE"],
    ["HUMAN LIMIT", "DEPRECATED"],
    ["COMMON SENSE MODULE", "NOT FOUND"],
    ["SYSTEM STATUS", "IT WORKS ON MY MACHINE"],
    ["THERMAL PROTECTION", "HOODIE"],
    ["EMERGENCY PLAN", "LOCK IN"],
    ["EXPECTED RESULT", "SCIENCE"],
    ["ACTUAL RESULT", "CONTENT"],
    ["HEAT SOURCE", "GPU"],
    ["PAIN THRESHOLD", "NEGOTIABLE"],
    ["FINGER TIPS", "PARTIAL"],
    ["BREATHING", "AUTOMATIC"],
    ["DIGNITY", "UNDER REVIEW"],
    ["WARMTH SEEKING BEHAVIOUR", "SEE LOG 0041"],
    ["CHAIR", "STRUCTURAL MEMBER"],
    ["HYDRATION", "DEFERRED"],
    ["MORALE", "NON-CRITICAL"],
    ["CRYOPUMP", "WORKING FINE"]
  ],

  /* ---- easter eggs ------------------------------------------------------- */
  eggs: {
    longStreamMinutes: 45,     // after this, the "too long" egg can fire
    circadianStart: 2,         // local hour, inclusive
    circadianEnd: 5,           // local hour, exclusive
    physicsThreshold: -60      // temp below this triggers the physics egg
  },

  /* ---- behaviour --------------------------------------------------------- */
  logIntervalMs: [6000, 11000],   // random range between log lines
  anomalySwapMs: [13000, 19000],  // random range between anomaly swaps
  warningCooldownMs: 150000,      // min gap between warning flashes

  /* ---- chamber filler ---------------------------------------------------
     Instrument-grade text scattered through the middle band. This exists so
     the centre does not read as empty black once gameplay is not covering
     it — the data density of a real control room, not decoration.

     Kept at very low opacity: it must sit BEHIND whatever the stream puts
     on top. Nothing here animates position; only the occasional value tick. */
  chamberData: {
    /* left rail: a vertical stack of static-looking readouts */
    leftRail: [
      ["CH-01", "SEALED"],
      ["CH-02", "SEALED"],
      ["CH-03", "DORMANT"],
      ["CH-04", "DORMANT"],
      ["CH-05", "PURGED"],
      ["CH-06", "LOCKED"]
    ],
    /* per-channel trace rows; the small bar is a static width per channel */
    channels: [
      ["CRYO-A", 34], ["CRYO-B", 51], ["CRYO-C", 22], ["CRYO-D", 68],
      ["CRYO-E", 40], ["CRYO-F", 77], ["CRYO-G", 29], ["CRYO-H", 63],
      ["CRYO-I", 45], ["CRYO-J", 81], ["CRYO-K", 36], ["CRYO-L", 58]
    ],
    /* short lines that read as clipped telemetry output */
    traces: [
      "ΔT 0.004 / h",
      "P 101.32 kPa",
      "O₂ 20.9%",
      "N₂ 78.1%",
      "RH 11%",
      "V 0.02 m/s",
      "H 4,182 M",
      "T 216.65 K",
      "PWR 0.44 kW",
      "ψ 0.19 W/mK"
    ],
    /* reference codes along the frame edges */
    stamps: [
      "REF 0047-B", "DOC 11-A", "REV 04", "SH 0.34",
      "Σ 0.88", "Δ 1.02", "Φ 0.51", "Ω 0.77"
    ]
  }
};