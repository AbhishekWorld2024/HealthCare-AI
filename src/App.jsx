import { useState } from 'react'
import Header from './components/Header'
import SearchForm from './components/SearchForm'
import PatientCard from './components/PatientCard'
import Loader from './components/Loader'
import NotFound from './components/NotFound'
import { findPatient } from './data/patients'

const STATUS = { IDLE: 'idle', LOADING: 'loading', FOUND: 'found', NOT_FOUND: 'notfound' }

export default function App() {
  const [status, setStatus] = useState(STATUS.IDLE)
  const [patient, setPatient] = useState(null)
  const [searchedName, setSearchedName] = useState('')

  async function handleSearch(firstName, lastName) {
    setStatus(STATUS.LOADING)
    setSearchedName(`${firstName} ${lastName}`)

    const result = await findPatient(firstName, lastName)

    if (result) {
      setPatient(result)
      setStatus(STATUS.FOUND)
    } else {
      setPatient(null)
      setStatus(STATUS.NOT_FOUND)
    }
  }

  return (
    <div className="app">
      <Header />

      <main>
        <SearchForm onSearch={handleSearch} loading={status === STATUS.LOADING} />

        {status === STATUS.LOADING && <Loader />}
        {status === STATUS.NOT_FOUND && <NotFound name={searchedName} />}
        {status === STATUS.FOUND && patient && <PatientCard patient={patient} />}
      </main>

      <footer>
        <p>&copy; 2024 HealthCare AI &mdash; For demonstration purposes only.</p>
      </footer>
    </div>
  )
}
