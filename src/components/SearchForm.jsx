import { useState } from 'react'

export default function SearchForm({ onSearch, loading }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [errors, setErrors] = useState({})

  function validate() {
    const e = {}
    if (!firstName.trim()) e.firstName = 'First name is required.'
    if (!lastName.trim()) e.lastName = 'Last name is required.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    onSearch(firstName.trim(), lastName.trim())
  }

  return (
    <section className="search-card">
      <h2>Search Patient</h2>
      <p className="hint">Enter the patient's full name to retrieve their records.</p>

      <form onSubmit={handleSubmit} noValidate autoComplete="off">
        <div className="field-row">
          <div className="field">
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              type="text"
              placeholder="e.g. John"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value)
                if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: '' }))
              }}
              className={errors.firstName ? 'invalid' : ''}
              autoComplete="off"
            />
            {errors.firstName && <span className="error-msg">{errors.firstName}</span>}
          </div>

          <div className="field">
            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              type="text"
              placeholder="e.g. Doe"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value)
                if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: '' }))
              }}
              className={errors.lastName ? 'invalid' : ''}
              autoComplete="off"
            />
            {errors.lastName && <span className="error-msg">{errors.lastName}</span>}
          </div>
        </div>

        <button type="submit" disabled={loading}>
          <span className="btn-text">{loading ? 'Searching…' : 'Search'}</span>
          <span className="btn-icon">🔍</span>
        </button>
      </form>
    </section>
  )
}
