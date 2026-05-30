import { useState } from 'react'
import Header from './components/Header'
import SearchForm from './components/SearchForm'
import PatientCard from './components/PatientCard'
import Loader from './components/Loader'
import NotFound from './components/NotFound'
import { streamPatientSummary } from './data/api'

const STATUS = { IDLE: 'idle', LOADING: 'loading', FOUND: 'found', NOT_FOUND: 'notfound' }

export default function App() {
  const [status, setStatus] = useState(STATUS.IDLE)
  const [patient, setPatient] = useState(null)
  const [description, setDescription] = useState('')
  const [generating, setGenerating] = useState(false)
  const [searchedName, setSearchedName] = useState('')

  async function handleSearch(firstName, lastName) {
    setStatus(STATUS.LOADING)
    setSearchedName(`${firstName} ${lastName}`)
    setPatient(null)
    setDescription('')
    setGenerating(false)

    await streamPatientSummary(firstName, lastName, {
      onPatient: (p) => {
        setPatient(p)
        setDescription('')
        setGenerating(true)
        setStatus(STATUS.FOUND)
      },
      onToken: (token) => {
        setDescription((prev) => prev + token)
      },
      onDone: () => {
        setGenerating(false)
      },
      onNotFound: () => {
        setPatient(null)
        setStatus(STATUS.NOT_FOUND)
      },
      onError: () => {
        setGenerating(false)
      },
    })
  }

  return (
    <div className="app">
      <Header />

      <main>
        <SearchForm onSearch={handleSearch} loading={status === STATUS.LOADING} />

        {status === STATUS.LOADING && <Loader />}
        {status === STATUS.NOT_FOUND && <NotFound name={searchedName} />}
        {status === STATUS.FOUND && patient && (
          <PatientCard patient={patient} description={description} generating={generating} />
        )}
      </main>

      <footer>
        <p>&copy; 2024 HealthCare AI &mdash; For demonstration purposes only.</p>
      </footer>
    </div>
  )
}
