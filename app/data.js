window.TESTWISE_DATA = {
  customer: "Raider Runtime",
  defaultThreshold: 12,
  defaultRecordId: "MAYA-LAB-002",
  patient: {
    name: "Maya Patel",
    initials: "MP",
    dob: "2011-09-14",
    age: 14,
    sex: "Female",
    pronouns: "she/her",
    mrn: "RR-204611",
    encounterId: "ENC-2026-0611-0042",
    location: "Pediatric outpatient clinic",
    orderingClinician: "Dr. Lena Brooks",
    primaryClinician: "Dr. Arjun Mehta",
    clinicalQuestion: "Fatigue, dizziness, and new microcytosis after two weeks of reduced exercise tolerance.",
    allergies: "NKDA",
    insurance: "DemoCare PPO",
    demoNotice: "Synthetic demo patient staged for TestWise evaluation"
  },
  story: {
    headline: "Maya's lab portal shows red numbers. TestWise shows the next best step.",
    subhead: "A dense clinical algorithm becomes a clear, auditable explanation for families, clinicians, and health systems.",
    parentBriefTitle: "Maya's Parent Brief",
    parentBrief:
      "Maya's blood count suggests anemia. The pattern is most consistent with a type that often needs iron studies before anyone names the exact cause. TestWise recommends ordering ferritin, serum iron, TIBC, and transferrin saturation next. This is not a diagnosis by itself; it is a clear next step for Maya's care team to review.",
    aiLabel: "AI-generated plain-language brief",
    beforeTitle: "Before TestWise",
    beforeText: "Families see red lab flags, abbreviations, and uncertainty. Clinicians see the right algorithm, but it lives in a static flowchart.",
    afterTitle: "After TestWise",
    afterText: "The system traces the expert pathway, explains the next action, and preserves a reviewable clinical audit trail.",
    nextAction: "Order iron studies before assigning an anemia subtype",
    proofPoint: "Low HGB + low MCV routes to the microcytic branch; missing iron studies prevent premature diagnosis."
  },
  platformPacks: [
    { label: "Anemia", state: "Live demo", note: "CBC to iron-study routing" },
    { label: "Lipids", state: "Pack ready", note: "Cardiovascular risk and triglyceride branches" },
    { label: "Jaundice", state: "Pack ready", note: "Bilirubin pattern interpretation" },
    { label: "PT/PTT", state: "Pack ready", note: "Coagulation abnormality workup" },
    { label: "Porphyria", state: "Pack ready", note: "Rare-disease testing pathway" },
    { label: "Cardiac risk", state: "Pack ready", note: "Preventive-care lab logic" }
  ],
  target: {
    region: "us-ashburn-1",
    regionCode: "iad",
    compartmentName: "LZ-appdev-cmp",
    compartmentId: "ocid1.compartment.oc1..aaaaaaaak5tliaqm7cveh3lzkkrbwkmaeiznf7bdfh3fxgnsz6igrg7c3lra",
    subnetName: "LZ-0-web-subnet",
    subnetId: "ocid1.subnet.oc1.iad.aaaaaaaaadb3dstet7yffqs44n4bzp2ytx3e44seakj3yrugliyr7xi6k6cq",
    vcnName: "LZ-0-vcn",
    subnetCidr: "10.0.0.0/24",
    publicIpAllowed: true
  },
  referenceRanges: {
    hgb: { label: "HGB", unit: "g/dL", low: 12, high: 16 },
    hct: { label: "HCT", unit: "%", low: 36, high: 46 },
    rbc: { label: "RBC", unit: "10^6/uL", low: 4, high: 5.2 },
    mcv: { label: "MCV", unit: "fL", low: 80, high: 100 },
    rdw: { label: "RDW", unit: "%", low: 11.5, high: 14.5 },
    platelets: { label: "Platelets", unit: "K/uL", low: 150, high: 450 },
    reticulocytes: { label: "Reticulocytes", unit: "%", low: 0.5, high: 2.5 },
    iron: { label: "Iron", unit: "ug/dL", low: 50, high: 170 },
    tibc: { label: "TIBC", unit: "ug/dL", low: 250, high: 450 },
    ferritin: { label: "Ferritin", unit: "ng/mL", low: 15, high: 150 },
    transferrinSaturation: { label: "Transferrin sat", unit: "%", low: 16, high: 45 },
    ldh: { label: "LDH", unit: "U/L", low: 120, high: 246 },
    haptoglobin: { label: "Haptoglobin", unit: "mg/dL", low: 30, high: 200 }
  },
  flowSegments: [
    {
      label: "Patient context gate",
      note: "Starts from the ordering question, age, sex, collection time, and CBC availability."
    },
    {
      label: "Hemoglobin gate",
      note: "HGB below the active threshold routes into anemia workup; otherwise the pathway stops at no anemia."
    },
    {
      label: "MCV split",
      note: "Microcytic patterns route to iron studies; normocytic and macrocytic patterns route to reticulocytes."
    },
    {
      label: "Iron studies",
      note: "Ferritin, iron, TIBC, and transferrin saturation determine iron deficiency versus inflammation patterns."
    },
    {
      label: "Hemolysis safety gate",
      note: "Reticulocytes, LDH, haptoglobin, and DAT/Coombs are requested when the marrow response is high or unclear."
    }
  ],
  records: [
    {
      id: "MAYA-LAB-001",
      sourceLabel: "Validation Case 1",
      visitType: "Sports physical CBC",
      collectedAt: "2026-06-01 09:15",
      accession: "RR-LAB-26-0601-118",
      provider: "Dr. Lena Brooks",
      status: "Signed",
      expectedOutcome: "Normal",
      clinicalQuestion: "Baseline school sports physical before symptoms were reported.",
      symptoms: "No fatigue, dyspnea, or bleeding symptoms documented.",
      orders: ["CBC with platelet count and auto differential"],
      labs: {
        hgb: 12.4,
        hct: 38.4,
        rbc: 4.22,
        mcv: 91,
        rdw: 12.9,
        platelets: 202,
        reticulocytes: 1.2,
        iron: 65,
        tibc: 300,
        ferritin: 102,
        transferrinSaturation: 30,
        ldh: null,
        haptoglobin: null
      },
      audit: [
        "2026-06-01 09:42 CBC signed without anemia pathway escalation.",
        "2026-06-01 09:44 TestWise trace archived as baseline."
      ]
    },
    {
      id: "MAYA-LAB-002",
      sourceLabel: "Validation Case 2",
      visitType: "Fatigue workup CBC",
      collectedAt: "2026-06-09 08:42",
      accession: "RR-LAB-26-0609-044",
      provider: "Dr. Lena Brooks",
      status: "Needs orders",
      expectedOutcome: "Need Iron Studies",
      clinicalQuestion: "New fatigue and dizziness with low hemoglobin and microcytosis.",
      symptoms: "Fatigue, dizziness after practice, mild pallor. No acute bleeding recorded.",
      orders: [
        "CBC with platelet count and auto differential",
        "Pending: ferritin, serum iron, TIBC, transferrin saturation"
      ],
      labs: {
        hgb: 10.1,
        hct: 34.2,
        rbc: 5,
        mcv: 79,
        rdw: 13.2,
        platelets: 297,
        reticulocytes: null,
        iron: null,
        tibc: null,
        ferritin: null,
        transferrinSaturation: null,
        ldh: null,
        haptoglobin: null
      },
      audit: [
        "2026-06-09 08:55 CBC resulted with low HGB and microcytosis.",
        "2026-06-09 08:57 TestWise recommended iron studies before subtype assignment."
      ]
    },
    {
      id: "MAYA-LAB-003",
      sourceLabel: "Validation Case 4",
      visitType: "Iron panel add-on",
      collectedAt: "2026-06-09 15:18",
      accession: "RR-LAB-26-0609-219",
      provider: "Dr. Lena Brooks",
      status: "Routed",
      expectedOutcome: "Iron Deficiency Anemia",
      clinicalQuestion: "Interpret add-on iron studies against the abnormal CBC.",
      symptoms: "Fatigue persists; appetite lower than usual. No fever documented.",
      orders: [
        "Ferritin",
        "Serum iron",
        "TIBC",
        "Transferrin saturation",
        "Reticulocyte count"
      ],
      labs: {
        hgb: 10.7,
        hct: 33.6,
        rbc: 5.3,
        mcv: 75,
        rdw: 13.8,
        platelets: 345,
        reticulocytes: 0.9,
        iron: 32,
        tibc: 453,
        ferritin: 100,
        transferrinSaturation: 7.1,
        ldh: null,
        haptoglobin: null
      },
      audit: [
        "2026-06-09 15:22 Iron panel resulted with low iron and transferrin saturation.",
        "2026-06-09 15:23 TestWise routed the pattern to iron deficiency anemia."
      ]
    },
    {
      id: "MAYA-LAB-004",
      sourceLabel: "Clinical Review",
      visitType: "Pathologist review",
      collectedAt: "2026-06-10 10:05",
      accession: "RR-LAB-26-0610-077",
      provider: "Dr. Helena Singh",
      status: "Reviewed",
      expectedOutcome: "Iron Deficiency Anemia",
      clinicalQuestion: "Review whether the algorithm trace matches the expert anemia flowchart.",
      symptoms: "Clinical note asks whether iron loss source should be evaluated.",
      orders: [
        "Review smear if symptoms worsen",
        "Clinician correlation for iron-loss source"
      ],
      labs: {
        hgb: 10.6,
        hct: 33.8,
        rbc: 5.1,
        mcv: 76,
        rdw: 14,
        platelets: 336,
        reticulocytes: 0.8,
        iron: 31,
        tibc: 448,
        ferritin: 92,
        transferrinSaturation: 6.9,
        ldh: 184,
        haptoglobin: 126
      },
      audit: [
        "2026-06-10 10:12 Flowchart trace reviewed by pathology.",
        "2026-06-10 10:14 Hemolysis safety labs were normal, supporting iron deficiency pathway."
      ]
    },
    {
      id: "MAYA-LAB-005",
      sourceLabel: "Follow-up Case",
      visitType: "Follow-up monitoring",
      collectedAt: "2026-06-17 09:30",
      accession: "RR-LAB-26-0617-063",
      provider: "Dr. Lena Brooks",
      status: "Follow-up",
      expectedOutcome: "Iron Deficiency Anemia",
      clinicalQuestion: "Track response after initial iron replacement plan.",
      symptoms: "Fatigue improving but not resolved.",
      orders: [
        "CBC",
        "Iron studies",
        "Continue follow-up trend review"
      ],
      labs: {
        hgb: 11.2,
        hct: 35.1,
        rbc: 4.9,
        mcv: 78,
        rdw: 14.8,
        platelets: 318,
        reticulocytes: 1.4,
        iron: 45,
        tibc: 420,
        ferritin: 18,
        transferrinSaturation: 10.7,
        ldh: null,
        haptoglobin: null
      },
      audit: [
        "2026-06-17 09:44 HGB improved but remains below threshold.",
        "2026-06-17 09:45 TestWise kept the record on iron deficiency follow-up."
      ]
    }
  ],
  gates: [
    { label: "Maya patient packet", state: "Ready", note: "Demographics, encounter, accession, orders, and dated lab timeline are staged" },
    { label: "Dynamic pathway logic", state: "Passed", note: "Outcome is recomputed from labs and the active hemoglobin threshold" },
    { label: "Flowchart source assets", state: "Ready", note: "Main chart and cutouts copied to neutral app filenames" },
    { label: "Sensitive source scan", state: "Passed", note: "Visible app strings avoid real customer and source workbook names" },
    { label: "IAD placement", state: "Ready", note: "LZ-appdev-cmp with LZ-0-web-subnet" }
  ]
};
