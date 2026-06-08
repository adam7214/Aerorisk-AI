"use client";

import { useActionState } from "react";
import { createReport, type CreateReportState } from "@/lib/actions";
import { reviewerNames } from "@/lib/reviewers";

const initialState: CreateReportState = {};

export function NewReportForm() {
  const [state, formAction, pending] = useActionState(createReport, initialState);

  return (
    <form className="card card-pad form-grid" action={formAction}>
      {state.error ? <div className="warning" role="alert">{state.error}</div> : null}
      <div className="warning">AI output is advisory only and requires qualified human review.</div>
      <div className="field">
        <label htmlFor="analysisMode">Analysis mode</label>
        <select id="analysisMode" name="analysisMode" defaultValue="mock">
          <option value="mock">Deterministic mock classifier</option>
          <option value="openai">OpenAI advisory analysis</option>
        </select>
      </div>
      <div className="inline-fields">
        <div className="field"><label htmlFor="title">Report title</label><input id="title" name="title" placeholder="Runway hold-short clearance concern" required /></div>
        <div className="field"><label htmlFor="eventDate">Event date</label><input id="eventDate" name="eventDate" type="date" required /></div>
      </div>
      <div className="field">
        <label htmlFor="narrative">Deidentified narrative</label>
        <textarea id="narrative" name="narrative" placeholder="Crew reported a deidentified safety event. No names, employee numbers, tail numbers, or passenger identifiers." required />
      </div>
      <div className="inline-fields">
        <div className="field"><label htmlFor="location">Location / airport code</label><input id="location" name="location" placeholder="KDEN" required /></div>
        <div className="field">
          <label htmlFor="phaseOfFlight">Phase of flight</label>
          <select id="phaseOfFlight" name="phaseOfFlight" defaultValue="Taxi">
            <option>Taxi</option><option>Takeoff</option><option>Climb</option><option>Cruise</option><option>Descent</option><option>Approach</option><option>Landing</option><option>Maintenance</option>
          </select>
        </div>
      </div>
      <div className="inline-fields">
        <div className="field">
          <label htmlFor="reporterRole">Reporter role</label>
          <select id="reporterRole" name="reporterRole" defaultValue="Flight crew">
            <option>Flight crew</option><option>Cabin crew</option><option>Dispatcher</option><option>Maintenance technician</option><option>Ramp operations</option><option>Safety analyst</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="assignedReviewer">Assigned reviewer</label>
          <select id="assignedReviewer" name="assignedReviewer" defaultValue={reviewerNames[0]}>
            {reviewerNames.map((reviewer) => <option key={reviewer}>{reviewer}</option>)}
          </select>
        </div>
      </div>
      <div className="field"><label htmlFor="tags">Tags</label><input id="tags" name="tags" placeholder="runway, taxi, communication" /></div>
      <div className="split-actions"><button className="button primary" type="submit" disabled={pending}>{pending ? "Running Analysis..." : "Run Analysis"}</button></div>
    </form>
  );
}
