import { computeAge, formatDob } from '../data/patients'

export default function PatientCard({ patient, description }) {
  const initials = patient.firstName[0] + patient.lastName[0]
  const age = computeAge(patient.dob)

  return (
    <div className="patient-card">
      <div className="card-header">
        <div className="avatar">{initials}</div>
        <div>
          <h3>{patient.firstName} {patient.lastName}</h3>
          <span className="badge">{patient.gender}</span>
        </div>
      </div>

      <div className="card-body">
        {description && (
          <div className="ai-summary">
            <div className="ai-summary-title">
              <span className="ai-badge">AI</span> Clinical Summary
            </div>
            <p>{description}</p>
          </div>
        )}

        <div className="info-grid">
          <InfoItem label="Age" value={`${age} years`} />
          <InfoItem label="Blood Type" value={patient.bloodType} />
          <InfoItem label="Date of Birth" value={formatDob(patient.dob)} />
          <InfoItem label="Patient ID" value={patient.id} />
        </div>

        <div className="section-title">Medical History</div>
        <ul className="history-list">
          {patient.history.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>

        <div className="section-title">Current Medications</div>
        <div className="meds-list">
          {patient.medications.map((med, i) => (
            <span key={i} className="med-pill">{med}</span>
          ))}
        </div>

        <div className="section-title">Last Visit</div>
        <p className="last-visit">{patient.lastVisit}</p>
      </div>
    </div>
  )
}

function InfoItem({ label, value }) {
  return (
    <div className="info-item">
      <span className="label">{label}</span>
      <span className="value">{value}</span>
    </div>
  )
}
