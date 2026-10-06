/* ==========================================================================
   ICEPOINT // HUMAN LIMIT FACILITY
   Single source of truth. Everything editable lives here.
   URL params (see README) override a subset of these at runtime.
   ========================================================================== */

window.CONFIG = {
  /* ---- identity ---------------------------------------------------------- */
  streamerName: "冰点凝冻",
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
  warningCooldownMs: 150000       // min gap between warning flashes
};