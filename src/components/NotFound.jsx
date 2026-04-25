export default function NotFound({ name }) {
  return (
    <div className="not-found">
      <span className="nf-icon">⚠</span>
      <h3>No Patient Found</h3>
      <p>
        No records match <strong>"{name}"</strong>. Please verify the name and try again.
      </p>
    </div>
  )
}
