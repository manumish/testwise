(function () {
  const data = window.TESTWISE_DATA;
  const records = data.records || [];
  const patient = data.patient;

  let activeView = "story";
  let selectedId = data.defaultRecordId || (records[0] && records[0].id);
  let outcomeFilter = "all";
  let statusFilter = "all";
  let hgbThreshold = data.defaultThreshold || 12;
  let shieldOn = true;
  let recommendationsOn = true;
  let lastRunAt = null;

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const labOrder = [
    "hgb",
    "hct",
    "rbc",
    "mcv",
    "rdw",
    "platelets",
    "reticulocytes",
    "iron",
    "tibc",
    "ferritin",
    "transferrinSaturation",
    "ldh",
    "haptoglobin"
  ];

  const els = {
    navTabs: $$(".nav-tab"),
    views: $$(".view"),
    pageEyebrow: $("#pageEyebrow"),
    pageTitle: $("#pageTitle"),
    clinicalContext: $("#clinicalContext"),
    storyHeadline: $("#storyHeadline"),
    storySubhead: $("#storySubhead"),
    beforeTitle: $("#beforeTitle"),
    beforeText: $("#beforeText"),
    afterTitle: $("#afterTitle"),
    afterText: $("#afterText"),
    aiBriefLabel: $("#aiBriefLabel"),
    parentBriefTitle: $("#parentBriefTitle"),
    parentBriefText: $("#parentBriefText"),
    storyNextAction: $("#storyNextAction"),
    storyProofPoint: $("#storyProofPoint"),
    miniPath: $("#miniPath"),
    platformGrid: $("#platformGrid"),
    showProofButton: $("#showProofButton"),
    showPlatformButton: $("#showPlatformButton"),
    patientAvatar: $("#patientAvatar"),
    patientName: $("#patientName"),
    patientBadge: $("#patientBadge"),
    patientGrid: $("#patientGrid"),
    clinicalQuestion: $("#clinicalQuestion"),
    caseList: $("#caseList"),
    outcomeFilter: $("#outcomeFilter"),
    thresholdSlider: $("#hgbThresholdSlider"),
    thresholdValue: $("#thresholdValue"),
    shieldToggle: $("#shieldToggle"),
    explainToggle: $("#explainToggle"),
    recommendationPanel: $("#recommendationPanel"),
    queueSummary: $("#queueSummary"),
    caseTitle: $("#caseTitle"),
    caseSubtitle: $("#caseSubtitle"),
    caseStatus: $("#caseStatus"),
    caseOutcome: $("#caseOutcome"),
    caseInterpretation: $("#caseInterpretation"),
    caseRecommendation: $("#caseRecommendation"),
    recordSummary: $("#recordSummary"),
    labGrid: $("#labGrid"),
    pathwayTrace: $("#pathwayTrace"),
    orderPanel: $("#orderPanel"),
    auditLog: $("#auditLog"),
    metricCases: $("#metricCases"),
    metricCasesNote: $("#metricCasesNote"),
    metricFollowup: $("#metricFollowup"),
    metricAgreement: $("#metricAgreement"),
    metricHgbNote: $("#metricHgbNote"),
    metricShield: $("#metricShield"),
    chartSelect: $("#chartSelect"),
    flowchartImage: $("#flowchartImage"),
    flowSegmentList: $("#flowSegmentList"),
    coverageList: $("#coverageList"),
    identityGrid: $("#identityGrid"),
    targetList: $("#targetList"),
    gateList: $("#gateList"),
    toast: $("#toast")
  };

  function isMissing(value) {
    return value === null || value === undefined || value === "";
  }

  function hasNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function maskIdentifier(value) {
    if (!value) return "Not provided";
    if (!shieldOn) return value;
    return value.replace(/[A-Z0-9](?=.{4})/g, "•");
  }

  function recordLabel(record) {
    return shieldOn ? record.id : `${record.id} / ${record.sourceLabel}`;
  }

  function statusClass(status) {
    return ["Reviewed", "Passed", "Ready", "Signed", "Routed"].includes(status) ? "ok" : "warn";
  }

  function labValue(key, value) {
    const range = data.referenceRanges[key];
    if (isMissing(value)) return "Not provided";
    return `${value}${range && range.unit ? ` ${range.unit}` : ""}`;
  }

  function labFlag(key, value) {
    const range = data.referenceRanges[key];
    if (isMissing(value)) return "missing";
    if (!range || !hasNumber(value)) return "normal";
    if (hasNumber(range.low) && value < range.low) return "low";
    if (hasNumber(range.high) && value > range.high) return "high";
    return "normal";
  }

  function flagLabel(flag) {
    if (flag === "missing") return "Missing";
    if (flag === "low") return "Low";
    if (flag === "high") return "High";
    return "Normal";
  }

  function hasIronStudies(labs) {
    return ["iron", "tibc", "ferritin", "transferrinSaturation"].every((key) => hasNumber(labs[key]));
  }

  function unique(items) {
    return Array.from(new Set(items.filter(Boolean)));
  }

  function evaluateRecord(record, threshold = hgbThreshold) {
    const labs = record.labs || {};
    const trace = [];
    const orders = [];

    const addStep = (text, state = "ok") => trace.push({ text, state });
    const result = (outcome, interpretation, recommendation, followup, severity = "routine") => ({
      outcome,
      interpretation,
      recommendation,
      followup,
      severity,
      trace,
      orders: unique(orders)
    });

    addStep("Clinical context and CBC order reviewed");

    if (!hasNumber(labs.hgb)) {
      addStep("Hemoglobin is not available", "warn");
      orders.push("CBC with platelet count and auto differential");
      return result(
        "Awaiting CBC",
        "The anemia pathway cannot begin until hemoglobin is available.",
        "Order or import a CBC before running the anemia flowchart.",
        true,
        "warn"
      );
    }

    addStep(`HGB ${labs.hgb} g/dL compared with active threshold ${threshold.toFixed(1)} g/dL`);

    if (labs.hgb >= threshold) {
      addStep("Hemoglobin is not below the active anemia threshold");
      return result(
        "Normal",
        "Hemoglobin is above the active threshold, so the chart does not escalate to anemia workup for this record.",
        "No anemia pathway escalation is needed for this record. Keep this result as Maya's baseline comparator.",
        false
      );
    }

    addStep("Hemoglobin is below threshold", "warn");

    if (!hasNumber(labs.mcv)) {
      addStep("MCV is missing, so anemia morphology cannot be classified", "warn");
      orders.push("MCV or complete CBC indices");
      return result(
        "Need MCV",
        "The pathway needs MCV to choose the microcytic, normocytic, or macrocytic branch.",
        "Request complete CBC indices before assigning the anemia subtype.",
        true,
        "warn"
      );
    }

    if (labs.mcv < 80) {
      addStep(`MCV ${labs.mcv} fL routes to the microcytic branch`, "warn");

      if (!hasIronStudies(labs)) {
        addStep("Iron, TIBC, ferritin, or transferrin saturation is missing", "warn");
        orders.push("Ferritin");
        orders.push("Serum iron");
        orders.push("TIBC");
        orders.push("Transferrin saturation");
        return result(
          "Need Iron Studies",
          "Maya has low hemoglobin with microcytosis, but the iron panel is incomplete.",
          "Order ferritin, serum iron, TIBC, and transferrin saturation before assigning a subtype.",
          true,
          "warn"
        );
      }

      const ironLow = labs.iron < data.referenceRanges.iron.low;
      const tibcHigh = labs.tibc > data.referenceRanges.tibc.high;
      const ferritinLow = labs.ferritin <= 30;
      const ferritinHigh = labs.ferritin > 250;
      const satLow = labs.transferrinSaturation < data.referenceRanges.transferrinSaturation.low;

      addStep("Iron panel is available");

      if (ferritinHigh && !satLow) {
        addStep("Ferritin is high without low transferrin saturation", "warn");
        orders.push("Inflammatory markers");
        return result(
          "Inflammation Pattern",
          "Microcytosis with elevated ferritin is more consistent with inflammation or marrow-related causes than simple iron deficiency.",
          "Correlate with CRP/ESR, infection history, medication exposure, and marrow risk before final diagnosis.",
          true,
          "warn"
        );
      }

      if (ferritinLow || satLow || (ironLow && tibcHigh)) {
        addStep("Low iron availability pattern detected");
        if (satLow) addStep("Transferrin saturation is low");
        if (tibcHigh) addStep("TIBC is high or borderline high");
        return result(
          "Iron Deficiency Anemia",
          "The microcytic branch plus low iron availability supports iron deficiency anemia for Maya.",
          "Confirm the clinical source of iron loss or inadequate intake, then document the iron replacement and follow-up plan.",
          false
        );
      }

      addStep("Microcytic pattern remains indeterminate", "warn");
      orders.push("Pathologist smear review");
      orders.push("Hemoglobin electrophoresis if clinically indicated");
      return result(
        "Microcytic Anemia, Needs Review",
        "Microcytosis is present, but iron markers do not cleanly identify deficiency or inflammation.",
        "Escalate for pathologist review and consider thalassemia or other microcytic causes if clinically indicated.",
        true,
        "warn"
      );
    }

    addStep(`MCV ${labs.mcv} fL is not microcytic`);

    if (!hasNumber(labs.reticulocytes)) {
      addStep("Reticulocyte count is missing", "warn");
      orders.push("Reticulocyte count");
      return result(
        "Need Reticulocyte Count",
        "Maya's anemia is not microcytic, so the chart needs reticulocytes to evaluate marrow response.",
        "Order reticulocyte count before routing to hemolysis, blood loss, or production-failure branches.",
        true,
        "warn"
      );
    }

    if (labs.reticulocytes > data.referenceRanges.reticulocytes.high) {
      addStep("Reticulocytes are elevated, suggesting response to loss or hemolysis", "warn");
      if (!hasNumber(labs.ldh)) orders.push("LDH");
      if (!hasNumber(labs.haptoglobin)) orders.push("Haptoglobin");
      orders.push("DAT/Coombs if clinically indicated");
      return result(
        "Need Hemolysis Workup",
        "The reticulocyte response is high enough to check hemolysis or blood loss branches.",
        "Add LDH, haptoglobin, bilirubin, and DAT/Coombs when clinically appropriate.",
        true,
        "warn"
      );
    }

    if (hasNumber(labs.ferritin) && labs.ferritin > 250) {
      addStep("Ferritin is elevated with low or normal reticulocyte response", "warn");
      orders.push("Inflammatory markers");
      return result(
        "Inflammation Pattern",
        "Normocytic anemia with high ferritin and low marrow response suggests inflammation or chronic disease.",
        "Correlate with inflammation, infection, renal function, and medication history.",
        true,
        "warn"
      );
    }

    addStep("Low reticulocyte response needs clinician review", "warn");
    orders.push("Clinician review of renal, endocrine, marrow, and medication causes");
    return result(
      "Normocytic Anemia, Needs Review",
      "The pathway needs clinical correlation because the marrow response is not elevated and iron deficiency is not clearly established.",
      "Review renal function, thyroid status, inflammatory history, medication exposure, and smear findings.",
      true,
      "warn"
    );
  }

  function getRecord(id) {
    return records.find((record) => record.id === id) || records[0];
  }

  function getVisibleRecords() {
    return records.filter((record) => {
      const result = evaluateRecord(record);
      const outcomeMatch = outcomeFilter === "all" || result.outcome === outcomeFilter;
      const statusMatch =
        statusFilter === "all" ||
        record.status === statusFilter ||
        (statusFilter === "Needs orders" && (result.followup || record.status === "Follow-up"));
      return outcomeMatch && statusMatch;
    });
  }

  function renderPatientBanner() {
    els.patientAvatar.textContent = patient.initials;
    els.patientName.textContent = patient.name;
    els.patientBadge.textContent = patient.demoNotice;
    els.clinicalQuestion.textContent = patient.clinicalQuestion;

    const rows = [
      ["DOB", `${patient.dob} (${patient.age})`],
      ["Sex", patient.sex],
      ["MRN", maskIdentifier(patient.mrn)],
      ["Encounter", maskIdentifier(patient.encounterId)],
      ["Location", patient.location],
      ["Ordering clinician", patient.orderingClinician],
      ["Primary clinician", patient.primaryClinician],
      ["Allergies", patient.allergies]
    ];

    els.patientGrid.innerHTML = rows.map(([label, value]) => `
      <div class="patient-data-cell">
        <span>${label}</span>
        <strong>${value}</strong>
      </div>
    `).join("");
  }

  function renderStory() {
    const story = data.story || {};
    const defaultRecord = getRecord(data.defaultRecordId);
    const result = evaluateRecord(defaultRecord);

    els.storyHeadline.textContent = story.headline;
    els.storySubhead.textContent = story.subhead;
    els.beforeTitle.textContent = story.beforeTitle;
    els.beforeText.textContent = story.beforeText;
    els.afterTitle.textContent = story.afterTitle;
    els.afterText.textContent = story.afterText;
    els.aiBriefLabel.textContent = story.aiLabel;
    els.parentBriefTitle.textContent = story.parentBriefTitle;
    els.parentBriefText.textContent = story.parentBrief;
    els.storyNextAction.textContent = story.nextAction || result.recommendation;
    els.storyProofPoint.textContent = story.proofPoint || result.interpretation;

    const visibleSteps = result.trace.slice(0, 5);
    els.miniPath.innerHTML = visibleSteps.map((step, index) => `
      <div class="mini-path-step ${step.state === "warn" ? "warn" : ""}">
        <span>${index + 1}</span>
        <p>${step.text}</p>
      </div>
    `).join("");

    els.platformGrid.innerHTML = (data.platformPacks || []).map((pack) => `
      <article class="platform-pack">
        <span>${pack.state}</span>
        <strong>${pack.label}</strong>
        <p>${pack.note}</p>
      </article>
    `).join("");
  }

  function renderMetrics(visible) {
    const selected = getRecord(selectedId);
    const selectedResult = evaluateRecord(selected);
    const openCount = visible.filter((record) => {
      const result = evaluateRecord(record);
      return result.followup || ["Needs orders", "Follow-up"].includes(record.status);
    }).length;

    els.metricCases.textContent = String(records.length);
    els.metricCasesNote.textContent = `${visible.length} visible`;
    els.metricFollowup.textContent = String(openCount);
    els.metricAgreement.textContent = labValue("hgb", selected.labs.hgb).replace(" g/dL", "");
    els.metricHgbNote.textContent = selectedResult.outcome;
    els.metricShield.textContent = shieldOn ? "On" : "Off";
  }

  function renderRecordList() {
    const visible = getVisibleRecords();
    if (!visible.find((record) => record.id === selectedId) && visible[0]) {
      selectedId = visible[0].id;
    }

    els.caseList.innerHTML = visible.map((record) => {
      const result = evaluateRecord(record);
      const status = result.followup ? "Action needed" : record.status;
      return `
        <button class="case-row lab-case-row ${record.id === selectedId ? "active" : ""}" type="button" data-case-id="${record.id}">
          <span class="case-initial">${patient.initials}</span>
          <span>
            <strong>${record.visitType}</strong>
            <small>${recordLabel(record)} / ${record.collectedAt}</small>
            <small>HGB ${labValue("hgb", record.labs.hgb)} / MCV ${labValue("mcv", record.labs.mcv)}</small>
          </span>
          <em>${status}</em>
        </button>
      `;
    }).join("");

    if (!visible.length) {
      els.caseList.innerHTML = '<div class="empty-state">No Maya records match the current filters.</div>';
    }

    els.queueSummary.textContent = `${visible.length} records at HGB ${hgbThreshold.toFixed(1)} g/dL threshold`;
    renderPatientBanner();
    renderMetrics(visible);
    renderSelectedRecord();
  }

  function renderSelectedRecord() {
    const record = getRecord(selectedId);
    if (!record) return;

    const result = evaluateRecord(record);
    const status = result.followup ? "Action Needed" : record.status;
    const statusTone = result.followup ? "warn" : statusClass(record.status);

    els.caseTitle.textContent = `${patient.name} - ${record.visitType}`;
    els.caseSubtitle.textContent = `${record.collectedAt} / ${maskIdentifier(record.accession)} / ${record.provider}`;
    els.caseStatus.textContent = status;
    els.caseStatus.className = `status-pill ${statusTone}`;
    els.caseOutcome.textContent = result.outcome;
    els.caseInterpretation.textContent = result.interpretation;
    els.caseRecommendation.textContent = recommendationsOn ? result.recommendation : "Recommendations hidden.";
    els.recommendationPanel.classList.toggle("muted", !recommendationsOn);

    const summaryRows = [
      ["Clinical question", record.clinicalQuestion],
      ["Symptoms", record.symptoms],
      ["Expected pathway", record.expectedOutcome],
      ["Accession", maskIdentifier(record.accession)]
    ];

    els.recordSummary.innerHTML = summaryRows.map(([label, value]) => `
      <div class="summary-card">
        <span>${label}</span>
        <strong>${value}</strong>
      </div>
    `).join("");

    els.labGrid.innerHTML = labOrder.map((key) => {
      const range = data.referenceRanges[key];
      const value = record.labs[key];
      const flag = labFlag(key, value);
      const rangeText = range && hasNumber(range.low) && hasNumber(range.high)
        ? `${range.low}-${range.high} ${range.unit}`
        : "No range";
      return `
        <div class="lab-cell flag-${flag} ${flag === "missing" ? "missing" : ""}">
          <span>${range.label}</span>
          <strong>${labValue(key, value)}</strong>
          <small>${rangeText}</small>
          <em>${flagLabel(flag)}</em>
        </div>
      `;
    }).join("");

    els.pathwayTrace.innerHTML = result.trace.map((step, index) => `
      <div class="path-step ${step.state === "warn" ? "warn" : ""}">
        <span>${index + 1}</span>
        <p>${step.text}</p>
      </div>
    `).join("");

    const openOrders = unique([...(record.orders || []), ...result.orders]);
    els.orderPanel.innerHTML = `
      <div class="orders-header">
        <div>
          <h3>${result.followup ? "Open Orders And Actions" : "Orders And Evidence"}</h3>
          <p>${result.followup ? "Items needed before the pathway can close." : "Evidence supporting the current pathway result."}</p>
        </div>
        <span class="status-pill ${result.followup ? "warn" : "ok"}">${openOrders.length} items</span>
      </div>
      <div class="order-list">
        ${openOrders.map((order) => `<div class="order-row">${order}</div>`).join("")}
      </div>
    `;

    const runLine = lastRunAt ? [`${lastRunAt} Demo pathway rerun from current screen state.`] : [];
    const auditRows = [...(record.audit || []), ...runLine];
    els.auditLog.innerHTML = `
      <h3>Audit Trail</h3>
      <div class="audit-items">
        ${auditRows.map((line) => `<p>${line}</p>`).join("")}
      </div>
    `;
  }

  function renderFlowchart() {
    els.flowSegmentList.innerHTML = data.flowSegments.map((segment) => `
      <div class="gate-row">
        <span class="status-dot ok"></span>
        <div>
          <strong>${segment.label}</strong>
          <small>${segment.note}</small>
        </div>
        <em>Mapped</em>
      </div>
    `).join("");
  }

  function renderCoverage() {
    const outcomes = unique(records.map((record) => evaluateRecord(record).outcome));
    els.coverageList.innerHTML = outcomes.map((outcome) => {
      const items = records.filter((record) => evaluateRecord(record).outcome === outcome);
      const matched = items.filter((record) => record.expectedOutcome === outcome).length;
      const pct = Math.round((matched / items.length) * 100);
      return `
        <div class="coverage-row">
          <div>
            <strong>${outcome}</strong>
            <span>${items.length} Maya record${items.length === 1 ? "" : "s"}</span>
          </div>
          <div class="bar" aria-label="${outcome} expected agreement ${pct}%">
            <span style="width: ${pct}%"></span>
          </div>
          <em>${pct}% match</em>
        </div>
      `;
    }).join("");

    const identities = [
      ["Patient name", `${patient.name} (synthetic)`],
      ["DOB", patient.dob],
      ["MRN", maskIdentifier(patient.mrn)],
      ["Encounter", maskIdentifier(patient.encounterId)],
      ["Accession IDs", shieldOn ? "Masked on screen" : "Visible for demo"],
      ["Source records", "No real PHI linked in UI"]
    ];

    els.identityGrid.innerHTML = identities.map(([label, value]) => `
      <div class="identity-cell">
        <span>${label}</span>
        <strong>${value}</strong>
      </div>
    `).join("");
  }

  function shortId(id) {
    return `${id.slice(0, 22)}...${id.slice(-8)}`;
  }

  function renderDeployment() {
    const targetRows = [
      ["Demo packet", `${patient.name} anemia workup`],
      ["Company", data.customer],
      ["Region", `${data.target.regionCode.toUpperCase()} / ${data.target.region}`],
      ["Compartment", data.target.compartmentName],
      ["Compartment ID", shortId(data.target.compartmentId)],
      ["Subnet", data.target.subnetName],
      ["Subnet ID", shortId(data.target.subnetId)],
      ["VCN", data.target.vcnName],
      ["CIDR", data.target.subnetCidr],
      ["Public IPs", data.target.publicIpAllowed ? "Allowed" : "Prohibited"]
    ];

    els.targetList.innerHTML = targetRows.map(([label, value]) => `
      <div>
        <dt>${label}</dt>
        <dd>${value}</dd>
      </div>
    `).join("");

    els.gateList.innerHTML = data.gates.map((gate) => `
      <div class="gate-row">
        <span class="status-dot ${statusClass(gate.state)}"></span>
        <div>
          <strong>${gate.label}</strong>
          <small>${gate.note}</small>
        </div>
        <em>${gate.state}</em>
      </div>
    `).join("");
  }

  function switchView(view) {
    activeView = view;
    els.navTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === view));
    els.views.forEach((section) => section.classList.toggle("active", section.id === `view-${view}`));
    els.clinicalContext.classList.toggle("hidden", view === "story");
    if (view === "story") {
      els.pageEyebrow.textContent = "VC demo story";
      els.pageTitle.textContent = "From confusing labs to a clear next step";
      $("#refreshButton").classList.add("hidden");
      $("#runButton").textContent = "Open workup";
    } else if (view === "workup") {
      els.pageEyebrow.textContent = "Anemia decision support";
      els.pageTitle.textContent = "Maya Patel anemia workup";
      $("#refreshButton").classList.remove("hidden");
      $("#runButton").textContent = "Run pathway";
    } else if (view === "flowchart") {
      els.pageEyebrow.textContent = "Clinical proof";
      els.pageTitle.textContent = "Expert flowchart made interactive";
      $("#refreshButton").classList.remove("hidden");
      $("#runButton").textContent = "Run pathway";
    } else if (view === "validation") {
      els.pageEyebrow.textContent = "Demo readiness";
      els.pageTitle.textContent = "Synthetic, traceable, reviewable";
      $("#refreshButton").classList.remove("hidden");
      $("#runButton").textContent = "Run pathway";
    } else {
      els.pageEyebrow.textContent = "Enterprise deployment";
      els.pageTitle.textContent = "Ready for OCI-backed clinical pilots";
      $("#refreshButton").classList.remove("hidden");
      $("#runButton").textContent = "Run pathway";
    }
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    window.setTimeout(() => els.toast.classList.remove("show"), 1800);
  }

  function bindEvents() {
    els.navTabs.forEach((tab) => {
      tab.addEventListener("click", () => switchView(tab.dataset.view));
    });

    els.showProofButton.addEventListener("click", () => {
      switchView("workup");
      showToast("Clinical proof layer opened");
    });

    els.showPlatformButton.addEventListener("click", () => {
      $("#platformSection").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    els.caseList.addEventListener("click", (event) => {
      const row = event.target.closest("[data-case-id]");
      if (!row) return;
      selectedId = row.dataset.caseId;
      renderRecordList();
    });

    els.outcomeFilter.addEventListener("change", (event) => {
      outcomeFilter = event.target.value;
      renderRecordList();
    });

    $$("input[name='statusFilter']").forEach((input) => {
      input.addEventListener("change", (event) => {
        statusFilter = event.target.value;
        renderRecordList();
      });
    });

    els.thresholdSlider.addEventListener("input", (event) => {
      hgbThreshold = Number(event.target.value);
      els.thresholdValue.textContent = `${hgbThreshold.toFixed(1)} g/dL`;
      renderRecordList();
      renderCoverage();
    });

    els.shieldToggle.addEventListener("change", (event) => {
      shieldOn = event.target.checked;
      renderRecordList();
      renderCoverage();
      renderDeployment();
    });

    els.explainToggle.addEventListener("change", (event) => {
      recommendationsOn = event.target.checked;
      renderSelectedRecord();
    });

    els.chartSelect.addEventListener("change", (event) => {
      els.flowchartImage.src = event.target.value;
    });

    $("#markValidatedButton").addEventListener("click", () => {
      const record = getRecord(selectedId);
      if (record) {
        record.status = "Reviewed";
        record.audit = record.audit || [];
        record.audit.push("Demo session: record marked reviewed from the TestWise UI.");
        renderRecordList();
        renderCoverage();
        showToast(`${record.id} marked reviewed`);
      }
    });

    $("#runButton").addEventListener("click", () => {
      if (activeView === "story") {
        switchView("workup");
        showToast("Clinical proof layer opened");
        return;
      }
      const record = getRecord(selectedId);
      const result = record ? evaluateRecord(record) : null;
      lastRunAt = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      renderSelectedRecord();
      showToast(record ? `${record.id} routed to ${result.outcome}` : "Pathway run complete");
    });

    $("#refreshButton").addEventListener("click", () => {
      outcomeFilter = "all";
      statusFilter = "all";
      hgbThreshold = data.defaultThreshold || 12;
      selectedId = data.defaultRecordId || (records[0] && records[0].id);
      els.outcomeFilter.value = "all";
      els.thresholdSlider.value = String(hgbThreshold);
      els.thresholdValue.textContent = `${hgbThreshold.toFixed(1)} g/dL`;
      $$("input[name='statusFilter']").forEach((input) => {
        input.checked = input.value === "all";
      });
      renderRecordList();
      renderCoverage();
      showToast("Maya chart reset");
    });
  }

  function init() {
    bindEvents();
    renderStory();
    renderRecordList();
    renderFlowchart();
    renderCoverage();
    renderDeployment();
    switchView(activeView);
  }

  init();
}());
