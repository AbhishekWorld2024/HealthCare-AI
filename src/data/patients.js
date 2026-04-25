export const PATIENTS = [
  {
    id: 'HC-001',
    firstName: 'John',
    lastName: 'Doe',
    dob: '1985-03-14',
    gender: 'Male',
    bloodType: 'O+',
    history: [
      'Hypertension — diagnosed 2018, managed with medication',
      'Type 2 Diabetes — diagnosed 2020, controlled via diet and Metformin',
      'Appendectomy — surgical procedure performed 2010',
    ],
    medications: ['Metformin 500mg', 'Lisinopril 10mg', 'Aspirin 81mg'],
    lastVisit: 'March 18, 2024 — Routine checkup, BP and glucose levels reviewed',
  },
  {
    id: 'HC-002',
    firstName: 'Jane',
    lastName: 'Smith',
    dob: '1992-07-22',
    gender: 'Female',
    bloodType: 'A-',
    history: [
      'Asthma — mild intermittent, managed with inhaler since childhood',
      'Seasonal Allergic Rhinitis — treated with antihistamines',
    ],
    medications: ['Albuterol inhaler (PRN)', 'Cetirizine 10mg'],
    lastVisit: 'January 9, 2024 — Asthma follow-up, lung function normal',
  },
  {
    id: 'HC-003',
    firstName: 'Robert',
    lastName: 'Johnson',
    dob: '1970-11-05',
    gender: 'Male',
    bloodType: 'B+',
    history: [
      'Coronary Artery Disease — stent placed 2019',
      'Hyperlipidemia — on statin therapy since 2017',
      'Mild Obesity — BMI 31.2, dietary counseling ongoing',
    ],
    medications: ['Atorvastatin 40mg', 'Clopidogrel 75mg', 'Metoprolol 25mg', 'Aspirin 81mg'],
    lastVisit: 'April 2, 2024 — Cardiology follow-up, EKG stable',
  },
  {
    id: 'HC-004',
    firstName: 'Emily',
    lastName: 'Davis',
    dob: '1998-02-28',
    gender: 'Female',
    bloodType: 'AB+',
    history: [
      'Migraine — chronic, 4–6 episodes/month since age 19',
      'Iron Deficiency Anemia — treated with supplements',
    ],
    medications: ['Sumatriptan 50mg (PRN)', 'Ferrous Sulfate 325mg', 'Topiramate 25mg'],
    lastVisit: 'February 27, 2024 — Neurology review, migraine frequency improving',
  },
  {
    id: 'HC-005',
    firstName: 'Michael',
    lastName: 'Brown',
    dob: '1963-09-17',
    gender: 'Male',
    bloodType: 'O-',
    history: [
      'COPD — Stage 2, former smoker (quit 2015)',
      'Hypertension — well-controlled on ACE inhibitor',
      'Osteoarthritis — bilateral knees, conservative management',
    ],
    medications: ['Tiotropium inhaler', 'Amlodipine 5mg', 'Naproxen 500mg (PRN)'],
    lastVisit: 'March 30, 2024 — Pulmonology visit, spirometry reviewed',
  },
  {
    id: 'HC-006',
    firstName: 'Sarah',
    lastName: 'Wilson',
    dob: '2001-05-11',
    gender: 'Female',
    bloodType: 'A+',
    history: [
      'Anxiety Disorder — generalized, diagnosed 2021',
      'GERD — mild, managed with lifestyle modification and PPI',
    ],
    medications: ['Sertraline 50mg', 'Omeprazole 20mg'],
    lastVisit: 'April 10, 2024 — Psychiatry follow-up, mood stable',
  },
  {
    id: 'HC-007',
    firstName: 'David',
    lastName: 'Martinez',
    dob: '1955-12-30',
    gender: 'Male',
    bloodType: 'B-',
    history: [
      'Type 1 Diabetes — since age 12, on insulin pump',
      'Diabetic Retinopathy — mild, annual ophthalmology follow-up',
      'Chronic Kidney Disease — Stage 2, monitored closely',
    ],
    medications: ['Insulin Aspart (pump)', 'Ramipril 5mg', 'Vitamin D3 2000IU'],
    lastVisit: 'April 5, 2024 — Endocrinology review, HbA1c 7.1%',
  },
  {
    id: 'HC-008',
    firstName: 'Lisa',
    lastName: 'Anderson',
    dob: '1988-08-03',
    gender: 'Female',
    bloodType: 'O+',
    history: [
      'Hypothyroidism — Hashimoto\'s, on levothyroxine since 2015',
      'Vitamin D Deficiency — annual supplementation',
    ],
    medications: ['Levothyroxine 75mcg', 'Vitamin D3 1000IU'],
    lastVisit: 'March 12, 2024 — TSH levels reviewed, dosage stable',
  },
]

export function computeAge(dob) {
  const today = new Date()
  const birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export function formatDob(dob) {
  return new Date(dob).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export function findPatient(firstName, lastName) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const result = PATIENTS.find(
        (p) =>
          p.firstName.toLowerCase() === firstName.toLowerCase() &&
          p.lastName.toLowerCase() === lastName.toLowerCase()
      )
      resolve(result ?? null)
    }, 1200)
  })
}
