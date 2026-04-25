// Mock patient database
const PATIENTS = [
  {
    id: "HC-001",
    firstName: "John",
    lastName: "Doe",
    dob: "1985-03-14",
    gender: "Male",
    bloodType: "O+",
    history: [
      "Hypertension — diagnosed 2018, managed with medication",
      "Type 2 Diabetes — diagnosed 2020, controlled via diet and Metformin",
      "Appendectomy — surgical procedure performed 2010",
    ],
    medications: ["Metformin 500mg", "Lisinopril 10mg", "Aspirin 81mg"],
    lastVisit: "March 18, 2024 — Routine checkup, BP and glucose levels reviewed",
  },
  {
    id: "HC-002",
    firstName: "Jane",
    lastName: "Smith",
    dob: "1992-07-22",
    gender: "Female",
    bloodType: "A-",
    history: [
      "Asthma — mild intermittent, managed with inhaler since childhood",
      "Seasonal Allergic Rhinitis — treated with antihistamines",
    ],
    medications: ["Albuterol inhaler (PRN)", "Cetirizine 10mg"],
    lastVisit: "January 9, 2024 — Asthma follow-up, lung function normal",
  },
  {
    id: "HC-003",
    firstName: "Robert",
    lastName: "Johnson",
    dob: "1970-11-05",
    gender: "Male",
    bloodType: "B+",
    history: [
      "Coronary Artery Disease — stent placed 2019",
      "Hyperlipidemia — on statin therapy since 2017",
      "Mild Obesity — BMI 31.2, dietary counseling ongoing",
    ],
    medications: ["Atorvastatin 40mg", "Clopidogrel 75mg", "Metoprolol 25mg", "Aspirin 81mg"],
    lastVisit: "April 2, 2024 — Cardiology follow-up, EKG stable",
  },
  {
    id: "HC-004",
    firstName: "Emily",
    lastName: "Davis",
    dob: "1998-02-28",
    gender: "Female",
    bloodType: "AB+",
    history: [
      "Migraine — chronic, 4–6 episodes/month since age 19",
      "Iron Deficiency Anemia — treated with supplements",
    ],
    medications: ["Sumatriptan 50mg (PRN)", "Ferrous Sulfate 325mg", "Topiramate 25mg"],
    lastVisit: "February 27, 2024 — Neurology review, migraine frequency improving",
  },
  {
    id: "HC-005",
    firstName: "Michael",
    lastName: "Brown",
    dob: "1963-09-17",
    gender: "Male",
    bloodType: "O-",
    history: [
      "COPD — Stage 2, former smoker (quit 2015)",
      "Hypertension — well-controlled on ACE inhibitor",
      "Osteoarthritis — bilateral knees, conservative management",
    ],
    medications: ["Tiotropium inhaler", "Amlodipine 5mg", "Naproxen 500mg (PRN)"],
    lastVisit: "March 30, 2024 — Pulmonology visit, spirometry reviewed",
  },
  {
    id: "HC-006",
    firstName: "Sarah",
    lastName: "Wilson",
    dob: "2001-05-11",
    gender: "Female",
    bloodType: "A+",
    history: [
      "Anxiety Disorder — generalized, diagnosed 2021",
      "GERD — mild, managed with lifestyle modification and PPI",
    ],
    medications: ["Sertraline 50mg", "Omeprazole 20mg"],
    lastVisit: "April 10, 2024 — Psychiatry follow-up, mood stable",
  },
  {
    id: "HC-007",
    firstName: "David",
    lastName: "Martinez",
    dob: "1955-12-30",
    gender: "Male",
    bloodType: "B-",
    history: [
      "Type 1 Diabetes — since age 12, on insulin pump",
      "Diabetic Retinopathy — mild, annual ophthalmology follow-up",
      "Chronic Kidney Disease — Stage 2, monitored closely",
    ],
    medications: ["Insulin Aspart (pump)", "Ramipril 5mg", "Vitamin D3 2000IU"],
    lastVisit: "April 5, 2024 — Endocrinology review, HbA1c 7.1%",
  },
  {
    id: "HC-008",
    firstName: "Lisa",
    lastName: "Anderson",
    dob: "1988-08-03",
    gender: "Female",
    bloodType: "O+",
    history: [
      "Hypothyroidism — Hashimoto's, on levothyroxine since 2015",
      "Vitamin D Deficiency — annual supplementation",
    ],
    medications: ["Levothyroxine 75mcg", "Vitamin D3 1000IU"],
    lastVisit: "March 12, 2024 — TSH levels reviewed, dosage stable",
  },
];

// Compute age from date of birth
function computeAge(dob) {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// Format date of birth for display
function formatDob(dob) {
  return new Date(dob).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

// Simulate async API call with artificial delay
function fetchPatient(firstName, lastName) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const result = PATIENTS.find(
        (p) =>
          p.firstName.toLowerCase() === firstName.toLowerCase() &&
          p.lastName.toLowerCase() === lastName.toLowerCase()
      );
      resolve(result || null);
    }, 1200);
  });
}

// DOM references
const form         = document.getElementById("searchForm");
const firstInput   = document.getElementById("firstName");
const lastInput    = document.getElementById("lastName");
const firstError   = document.getElementById("firstNameError");
const lastError    = document.getElementById("lastNameError");
const searchBtn    = document.getElementById("searchBtn");
const resultsSection = document.getElementById("resultsSection");
const loader       = document.getElementById("loader");
const notFound     = document.getElementById("notFound");
const searchedName = document.getElementById("searchedName");
const patientCard  = document.getElementById("patientCard");

function clearErrors() {
  [firstInput, lastInput].forEach((el) => el.classList.remove("invalid"));
  [firstError, lastError].forEach((el) => el.classList.remove("visible"));
}

function validateForm() {
  let valid = true;
  if (!firstInput.value.trim()) {
    firstInput.classList.add("invalid");
    firstError.classList.add("visible");
    valid = false;
  }
  if (!lastInput.value.trim()) {
    lastInput.classList.add("invalid");
    lastError.classList.add("visible");
    valid = false;
  }
  return valid;
}

function showLoader() {
  resultsSection.classList.remove("hidden");
  loader.classList.remove("hidden");
  notFound.classList.add("hidden");
  patientCard.classList.add("hidden");
}

function renderPatient(patient) {
  loader.classList.add("hidden");
  patientCard.classList.remove("hidden");

  const initials = patient.firstName[0] + patient.lastName[0];
  document.getElementById("avatarInitials").textContent = initials;
  document.getElementById("patientName").textContent = `${patient.firstName} ${patient.lastName}`;
  document.getElementById("patientGender").textContent = patient.gender;
  document.getElementById("patientAge").textContent = `${computeAge(patient.dob)} years`;
  document.getElementById("patientBlood").textContent = patient.bloodType;
  document.getElementById("patientDob").textContent = formatDob(patient.dob);
  document.getElementById("patientId").textContent = patient.id;
  document.getElementById("lastVisit").textContent = patient.lastVisit;

  const historyList = document.getElementById("medicalHistory");
  historyList.innerHTML = patient.history
    .map((item) => `<li>${item}</li>`)
    .join("");

  const medsList = document.getElementById("medications");
  medsList.innerHTML = patient.medications
    .map((med) => `<span class="med-pill">${med}</span>`)
    .join("");
}

function renderNotFound(first, last) {
  loader.classList.add("hidden");
  notFound.classList.remove("hidden");
  searchedName.textContent = `"${first} ${last}"`;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();
  if (!validateForm()) return;

  const first = firstInput.value.trim();
  const last  = lastInput.value.trim();

  searchBtn.disabled = true;
  showLoader();

  const patient = await fetchPatient(first, last);

  searchBtn.disabled = false;

  if (patient) {
    renderPatient(patient);
  } else {
    renderNotFound(first, last);
  }
});

// Clear field error on input
[firstInput, lastInput].forEach((input) => {
  input.addEventListener("input", () => {
    input.classList.remove("invalid");
    const errEl = input.id === "firstName" ? firstError : lastError;
    errEl.classList.remove("visible");
  });
});
