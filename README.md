# TestWise

TestWise is an interactive clinical decision-support demo that turns a static anemia workup flowchart into a guided, reviewable pathway.

The demo follows a synthetic pediatric patient, Maya Patel, from abnormal CBC results to the next recommended clinical action. It shows:

- A parent-readable explanation of confusing lab values.
- Dynamic anemia pathway logic based on hemoglobin, MCV, iron studies, reticulocytes, and safety-gate labs.
- A traceable pathway audit trail for clinician review.
- Flowchart source assets mapped to the interactive workflow.
- Readiness and deployment screens for an OCI-hosted demo.

## Demo

Live demo:

```text
http://tw.mitra-os.com
```

Backup demo URL:

```text
http://132.145.187.125
```

## Run Locally

This is a static web app. Open `app/index.html` in a browser, or serve the folder with any static file server.

```bash
cd app
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Project Structure

```text
app/       Static TestWise frontend
deploy/    OCI and nginx deployment helpers
```

## Data Safety

The visible patient data is synthetic and staged for demonstration. Local source decks, raw sample data, generated video frames, and backup artifacts are intentionally excluded from the repository.
