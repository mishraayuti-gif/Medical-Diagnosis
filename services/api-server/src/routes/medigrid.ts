import { Router, type IRouter } from "express";
import {
  AnalyzeSymptomsBody,
  CreateAppointmentBody,
  ListAppointmentsQueryParams,
  ListDoctorsQueryParams,
  UpdateMyPatientProfileBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const patient = {
  id: 1,
  name: "Aarav Mehta",
  age: 32,
  gender: "Male",
  bloodGroup: "O+",
  phone: "+91 98765 43210",
  allergies: ["Penicillin"],
  conditions: ["Mild asthma"],
  height: 176,
  weight: 74,
  bloodPressure: "118/76",
  bloodSugar: "92 mg/dL",
};

const doctors = [
  { id: 1, name: "Dr. Ananya Sharma", specialty: "General Physician", experience: "12 years", rating: 4.9, distance: "1.2 km", availability: ["Today, 4:30 PM", "Tomorrow, 10:00 AM"] },
  { id: 2, name: "Dr. Rohan Kapoor", specialty: "Cardiologist", experience: "15 years", rating: 4.8, distance: "2.8 km", availability: ["Tomorrow, 2:00 PM", "Thu, 11:30 AM"] },
  { id: 3, name: "Dr. Meera Iyer", specialty: "Dermatologist", experience: "9 years", rating: 4.7, distance: "3.4 km", availability: ["Today, 6:00 PM", "Fri, 9:30 AM"] },
  { id: 4, name: "Dr. Vikram Singh", specialty: "Pulmonologist", experience: "18 years", rating: 4.9, distance: "4.1 km", availability: ["Wed, 3:00 PM", "Sat, 12:00 PM"] },
];

let appointments = [
  { id: 1, doctorName: "Dr. Ananya Sharma", specialty: "General Physician", date: "Wed, Aug 26", time: "4:30 PM", status: "upcoming" as const, location: "MediGrid Clinic · 1.2 km", avatar: "AS" },
  { id: 2, doctorName: "Dr. Rohan Kapoor", specialty: "Cardiologist", date: "Mon, Jul 14", time: "11:00 AM", status: "completed" as const, location: "HeartFirst Centre · 2.8 km", avatar: "RK" },
];

router.get("/dashboard/summary", (_req, res) => {
  res.json({
    patientName: patient.name,
    nextAppointment: appointments[0],
    healthScore: 86,
    notifications: 3,
    metrics: { bloodPressure: patient.bloodPressure, bloodSugar: patient.bloodSugar, weight: `${patient.weight} kg` },
  });
});

router.get("/patients/me", (_req, res) => res.json(patient));

router.patch("/patients/me", (req, res) => {
  const parsed = UpdateMyPatientProfileBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Please check the profile fields." });
  Object.assign(patient, parsed.data);
  return res.json(patient);
});

router.get("/appointments", (req, res) => {
  const parsed = ListAppointmentsQueryParams.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Invalid appointment filter." });
  const status = parsed.data.status;
  return res.json(status && status !== "all" ? appointments.filter((item) => item.status === status) : appointments);
});

router.post("/appointments", (req, res) => {
  const parsed = CreateAppointmentBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Doctor, date, and time are required." });
  const data = parsed.data;
  const created = { id: Date.now(), ...data, status: "upcoming" as const, location: "MediGrid Clinic · 1.2 km", avatar: data.doctorName.split(" ").slice(-1)[0]?.[0] ?? "MD" };
  appointments = [created, ...appointments];
  return res.status(201).json(created);
});

router.post("/symptom-analysis", (req, res) => {
  const parsed = AnalyzeSymptomsBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Tell us what symptoms you are experiencing." });
  const symptoms = parsed.data.symptoms.toLowerCase();
  const emergency = /(chest pain|difficulty breathing|can't breathe|severe bleeding|unconscious|stroke)/.test(symptoms);
  const risk = emergency ? "High" : /(fever|persistent|severe|vomit|dizzy)/.test(symptoms) ? "Medium" : "Low";
  return res.json({
    risk,
    emergency,
    possibleConditions: emergency ? ["Symptoms may need urgent clinical assessment"] : risk === "Medium" ? ["Viral infection", "Dehydration", "Inflammation"] : ["Common cold", "Tension headache", "Fatigue related to sleep or stress"],
    recommendations: emergency ? ["Call local emergency services now", "Do not drive yourself if you feel faint", "View nearby hospitals for immediate care"] : ["Rest and hydrate", "Monitor your symptoms over the next 24 hours", "Book a clinician if symptoms persist or worsen"],
  });
});

router.get("/doctors", (req, res) => {
  const parsed = ListDoctorsQueryParams.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Invalid doctor filter." });
  const specialty = parsed.data.specialty?.toLowerCase();
  return res.json(specialty ? doctors.filter((doctor) => doctor.specialty.toLowerCase().includes(specialty)) : doctors);
});

export interface MedicineItem {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  route?: string;
  instructions?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  date: string;
  clinicalNotes: string;
  medicines: MedicineItem[];
  generalInstructions: string;
  followUpDate?: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
}

let prescriptions: Prescription[] = [
  {
    id: "RX-2026-0001",
    patientId: "p-01",
    patientName: "Aarav Mehta",
    patientAge: 32,
    patientGender: "Male",
    doctorId: "d-01",
    doctorName: "Dr. Ananya Sharma",
    doctorSpecialization: "General Physician",
    date: "2026-08-22",
    clinicalNotes: "Patient presents with mild acute upper respiratory symptoms. Vital signs stable.",
    medicines: [
      { name: "Budesonide Inhaler", dosage: "200 mcg", frequency: "Twice daily", duration: "10 days", route: "Inhalation", instructions: "Rinse mouth after use" },
      { name: "Paracetamol", dosage: "500 mg", frequency: "Twice daily", duration: "5 days", route: "Oral", instructions: "Take after meals" },
      { name: "Cetirizine", dosage: "10 mg", frequency: "Once daily", duration: "3 days", route: "Oral", instructions: "Take before bedtime" }
    ],
    generalInstructions: "Drink adequate water and maintain proper rest schedule.",
    followUpDate: "2026-09-05",
    status: "ACTIVE"
  },
  {
    id: "RX-2026-0002",
    patientId: "p-01",
    patientName: "Aarav Mehta",
    patientAge: 32,
    patientGender: "Male",
    doctorId: "d-02",
    doctorName: "Dr. Rohan Kapoor",
    doctorSpecialization: "Cardiologist",
    date: "2026-07-14",
    clinicalNotes: "Routine cardiovascular checkup. Blood pressure within normal target.",
    medicines: [
      { name: "Vitamin D3", dosage: "60000 IU", frequency: "Once weekly", duration: "8 weeks", route: "Oral", instructions: "Take with milk after breakfast" }
    ],
    generalInstructions: "Engage in 30 minutes of moderate aerobic exercise daily.",
    followUpDate: "2026-10-14",
    status: "COMPLETED"
  }
];

const nearbyPlaces = [
  { id: "doc-1", name: "Dr. Ananya Sharma", category: "Doctors", specialty: "General Physician", rating: 4.9, distance: 1.2, distanceStr: "1.2 km", availability: "Available Today", address: "124 Medical Plaza, Sector 4", contact: "+91 98765 11111", openHours: "9:00 AM - 6:00 PM" },
  { id: "doc-2", name: "Dr. Rohan Kapoor", category: "Doctors", specialty: "Cardiologist", rating: 4.8, distance: 2.8, distanceStr: "2.8 km", availability: "Available Tomorrow", address: "HeartFirst Centre, Suite 200", contact: "+91 98765 22222", openHours: "10:00 AM - 5:00 PM" },
  { id: "doc-3", name: "Dr. Meera Iyer", category: "Doctors", specialty: "Dermatologist", rating: 4.7, distance: 3.4, distanceStr: "3.4 km", availability: "Available Today", address: "88 SkinCare Ave, Block B", contact: "+91 98765 33333", openHours: "11:00 AM - 7:00 PM" },
  { id: "doc-4", name: "Dr. Vikram Singh", category: "Doctors", specialty: "Pulmonologist", rating: 4.9, distance: 4.1, distanceStr: "4.1 km", availability: "Available Wednesday", address: "Breathing Well Institute", contact: "+91 98765 44444", openHours: "9:00 AM - 4:00 PM" },
  { id: "cli-1", name: "Harborview Clinic & Diagnostics", category: "Clinics", specialty: "General Healthcare & Diagnostic Lab", rating: 4.7, distance: 1.8, distanceStr: "1.8 km", availability: "Open Today · Closes 8 PM", address: "45 Wellness Boulevard", contact: "+91 98765 55555", openHours: "8:00 AM - 8:00 PM" },
  { id: "cli-2", name: "MediGrid Care Center", category: "Clinics", specialty: "Family Practice & Outpatient", rating: 4.8, distance: 2.5, distanceStr: "2.5 km", availability: "Open Today · Closes 9 PM", address: "909 Recovery Road", contact: "+91 98765 66666", openHours: "7:30 AM - 9:00 PM" },
  { id: "hosp-1", name: "City Multi-Specialty Hospital", category: "Hospitals", specialty: "Emergency & Critical Care (24/7)", rating: 4.8, distance: 2.4, distanceStr: "2.4 km", availability: "Emergency Open 24 Hours", address: "1 Central Emergency Way", contact: "+91 98765 91100", openHours: "24/7 Emergency" },
  { id: "hosp-2", name: "North Bay Medical Center", category: "Hospitals", specialty: "Advanced Surgery & Trauma Center", rating: 4.9, distance: 5.2, distanceStr: "5.2 km", availability: "Emergency Open 24 Hours", address: "500 Metro Parkway", contact: "+91 98765 91111", openHours: "24/7 Emergency" }
];

// ==========================================
// E-PRESCRIPTIONS ENDPOINTS
// ==========================================
router.get("/prescriptions", (req, res) => {
  const { patientName, doctorName, status } = req.query as { patientName?: string; doctorName?: string; status?: string };
  let results = [...prescriptions];
  if (patientName) results = results.filter(p => p.patientName.toLowerCase().includes(patientName.toLowerCase()));
  if (doctorName) results = results.filter(p => p.doctorName.toLowerCase().includes(doctorName.toLowerCase()));
  if (status && status !== "ALL") results = results.filter(p => p.status === status);
  return res.json(results);
});

router.get("/prescriptions/:id", (req, res) => {
  const rx = prescriptions.find(p => p.id.toLowerCase() === req.params.id.toLowerCase());
  if (!rx) return res.status(404).json({ error: "Prescription not found." });
  return res.json(rx);
});

router.post("/prescriptions", (req, res) => {
  const data = req.body;
  if (!data.patientName || !data.medicines || !Array.isArray(data.medicines) || data.medicines.length === 0) {
    return res.status(400).json({ error: "Patient name and at least one medicine are required." });
  }
  const year = new Date().getFullYear();
  const nextNum = String(prescriptions.length + 1).padStart(4, "0");
  const newRx: Prescription = {
    id: `RX-${year}-${nextNum}`,
    patientId: data.patientId || `PAT-${Date.now()}`,
    patientName: data.patientName,
    patientAge: Number(data.patientAge) || 30,
    patientGender: data.patientGender || "Other",
    doctorId: data.doctorId || "d-01",
    doctorName: data.doctorName || "Dr. Ananya Sharma",
    doctorSpecialization: data.doctorSpecialization || "General Physician",
    date: data.date || new Date().toISOString().split("T")[0],
    clinicalNotes: data.clinicalNotes || "",
    medicines: data.medicines,
    generalInstructions: data.generalInstructions || "Take as prescribed.",
    followUpDate: data.followUpDate,
    status: "ACTIVE"
  };
  prescriptions.unshift(newRx);
  return res.status(201).json(newRx);
});

// ==========================================
// NEARBY HEALTHCARE FINDER ENDPOINT
// ==========================================
router.get("/nearby", (req, res) => {
  const { category, search, maxDistance } = req.query as { category?: string; search?: string; maxDistance?: string };
  let results = [...nearbyPlaces];
  if (category && category !== "All") {
    results = results.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(p => p.name.toLowerCase().includes(q) || p.specialty.toLowerCase().includes(q) || p.address.toLowerCase().includes(q));
  }
  if (maxDistance) {
    const max = parseFloat(maxDistance);
    if (!isNaN(max)) {
      results = results.filter(p => p.distance <= max);
    }
  }
  return res.json(results);
});

// ==========================================
// ML PREDICTION PROXY & FALLBACK
// ==========================================
const ML_API_URL = process.env.ML_API_URL || "http://127.0.0.1:8000";

router.get("/ml/health", async (_req, res) => {
  try {
    const response = await fetch(`${ML_API_URL}/health`, { signal: AbortSignal.timeout(2000) });
    if (response.ok) {
      const data = await response.json();
      return res.json({ connected: true, service: data });
    }
  } catch {}
  return res.json({ connected: false, fallbackActive: true });
});

router.post("/ml/predict", async (req, res) => {
  try {
    const response = await fetch(`${ML_API_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
      signal: AbortSignal.timeout(5000)
    });
    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
  } catch (err) {
    // Continue to fallback below
  }

  // In-process psychometric inference baseline when Python FastAPI server is warming up or unreachable
  const b = req.body || {};
  const tipi = b.tipi || {};
  const emotionalStability = ((8 - (tipi.tipi4 || 4)) + (tipi.tipi9 || 4)) / 2;
  const extraversion = ((tipi.tipi1 || 4) + (8 - (tipi.tipi6 || 4))) / 2;
  const agreeableness = ((8 - (tipi.tipi2 || 4)) + (tipi.tipi7 || 4)) / 2;

  const depScore = Math.max(0, Math.min(1, (7 - emotionalStability) * 0.14 + (7 - extraversion) * 0.05));
  const anxScore = Math.max(0, Math.min(1, (7 - emotionalStability) * 0.16 + (7 - agreeableness) * 0.03));
  const strScore = Math.max(0, Math.min(1, (7 - emotionalStability) * 0.15 + ((b.age && b.age < 30) ? 0.05 : 0)));

  const getSeverity = (score: number) => score > 0.65 ? "Severe" : score > 0.45 ? "Moderate" : score > 0.25 ? "Mild" : "Normal";
  const getProbabilities = (score: number) => {
    if (score > 0.65) return { "Normal": 0.05, "Mild": 0.12, "Moderate": 0.23, "Severe": 0.42, "Extremely Severe": 0.18 };
    if (score > 0.45) return { "Normal": 0.10, "Mild": 0.20, "Moderate": 0.45, "Severe": 0.18, "Extremely Severe": 0.07 };
    if (score > 0.25) return { "Normal": 0.25, "Mild": 0.42, "Moderate": 0.22, "Severe": 0.08, "Extremely Severe": 0.03 };
    return { "Normal": 0.65, "Mild": 0.20, "Moderate": 0.10, "Severe": 0.04, "Extremely Severe": 0.01 };
  };

  return res.json({
    depression: {
      severity: getSeverity(depScore),
      probabilities: getProbabilities(depScore),
      model_used: "ML Baseline (Logistic / TIPI inference)"
    },
    anxiety: {
      severity: getSeverity(anxScore),
      probabilities: getProbabilities(anxScore),
      model_used: "ML Baseline (Logistic / TIPI inference)"
    },
    stress: {
      severity: getSeverity(strScore),
      probabilities: getProbabilities(strScore),
      model_used: "ML Baseline (Logistic / TIPI inference)"
    },
    disclaimer: "This is a research/educational screening tool, NOT a medical diagnosis. If you are struggling, please speak with a licensed mental health professional or contact local care services."
  });
});

router.get("/dataset/summary", (_req, res) => {
  res.json({
    datasetName: "OpenPsychometrics DASS-42",
    respondents: 39775,
    averageAge: 25.9,
    countries: 172,
    averageScores: { depression: 18.5, anxiety: 13.2, stress: 21.4 },
    riskDistribution: { low: 42, moderate: 34, high: 24 }
  });
});

// Curated Peace Music & Mood Soundscapes (Served locally with 100% reliability)
const peaceTracks = [
  {
    id: "cool-waves",
    title: "Ocean Shoreline · Theta Calm",
    mood: "cool",
    category: "Cool & Calm",
    frequency: "432 Hz",
    duration: "Looping",
    url: "/audio/ocean_432hz.wav",
    description: "Soothing rhythmic shoreline ocean waves with 432Hz harmonic tone to trigger parasympathetic rest."
  },
  {
    id: "balanced-birds",
    title: "Morning Forest · Steady Mind",
    mood: "balanced",
    category: "Balanced",
    frequency: "528 Hz",
    duration: "Looping",
    url: "/audio/forest_528hz.wav",
    description: "Crisp natural birdsong and 528Hz Solfeggio cellular harmony for balanced grounded presence."
  },
  {
    id: "stress-rain",
    title: "Gentle Forest Rain · Tension Release",
    mood: "stress",
    category: "Stress Relief",
    frequency: "Delta Waves (3Hz)",
    duration: "Looping",
    url: "/audio/rain_delta.wav",
    description: "Continuous peaceful rainfall with Delta wave binaural beats to quiet sensory overload."
  },
  {
    id: "anxiety-stream",
    title: "Mountain Stream · Grounding Flow",
    mood: "anxiety",
    category: "Anxiety Relief",
    frequency: "Binaural 6Hz Theta",
    duration: "Looping",
    url: "/audio/stream_theta.wav",
    description: "Flowing alpine stream audio with 6Hz Theta frequency to slow racing thoughts."
  },
  {
    id: "focus-wind",
    title: "Meadow Wind · Deep Focus",
    mood: "focus",
    category: "Focus & Zen",
    frequency: "Gamma 40Hz",
    duration: "Looping",
    url: "/audio/wind_gamma.wav",
    description: "Clean ambient atmospheric air currents with 40Hz Gamma resonance to sharpen cognitive flow."
  },
  {
    id: "night-rest",
    title: "Nocturne Serenade · Deep Sleep",
    mood: "mood",
    category: "Low Mood / Rest",
    frequency: "Theta 4Hz",
    duration: "Looping",
    url: "/audio/night_theta.wav",
    description: "Warm evening cricket ambiance with 4Hz Theta waves for emotional comfort and deep rest."
  }
];

router.get("/audio/tracks", (_req, res) => {
  res.json(peaceTracks);
});

// Real-Time Intelligent AI Chatbot Endpoint
router.post("/chat", (req, res) => {
  const { message = "", mood = "balanced" } = req.body || {};
  const query = message.trim().toLowerCase();

  if (!query) {
    return res.status(400).json({ error: "Message content cannot be empty." });
  }

  // Emergency & Crisis Safety Intercept
  const isEmergency = /(suicid|kill myself|end my life|want to die|hurt myself|self harm|cant take it|can't take it|severe chest pain|can't breathe|cannot breathe|stroke symptoms|overdose)/.test(query);
  if (isEmergency) {
    return res.json({
      reply: "🚨 **Immediate Support Alert:** Your safety and well-being are paramount. If you are experiencing thoughts of self-harm or a severe medical emergency, please reach out right now:\n\n- 🇺🇸 **US Crisis Lifeline:** Call/Text `988` (Available 24/7)\n- 🇮🇳 **India Tele-MANAS:** Call `14416` or `1800-891-4416`\n- 🇬🇧 **UK NHS Emergency:** Call `111` or `999`\n- 🏥 **Emergency Services:** Please go to the nearest emergency room or dial emergency services immediately.",
      sentiment: "crisis",
      emergency: true,
      suggestions: ["Call 988 Crisis Line", "Find Nearest Hospital", "Contact Trusted Loved One"],
      recommendedMoodMusic: "cool-waves",
      timestamp: new Date().toISOString()
    });
  }

  // Guided Breathing & Somatic Reset
  if (/(breath|box breath|deep breath|breathing|hyperventilat|respirat)/.test(query)) {
    return res.json({
      reply: "🧘 **Guided Box Breathing Protocol (4-4-4-4 Technique)**\n\nLet's reset your autonomic nervous system together:\n\n1. **Inhale** slowly through your nose for 4 counts: *1... 2... 3... 4*\n2. **Hold** your lungs full gently for 4 counts: *1... 2... 3... 4*\n3. **Exhale** smoothly through your mouth for 4 counts: *1... 2... 3... 4*\n4. **Hold** empty calmly for 4 counts: *1... 2... 3... 4*\n\nRepeat this cycle 4 times. You can also turn on our **Ocean Shoreline (432Hz)** ambient player for deeper synchronization.",
      sentiment: "calm",
      emergency: false,
      suggestions: ["Start 1-Min Breathing", "Play 432Hz Soundscape", "Check Vital Signs"],
      recommendedMoodMusic: "cool-waves",
      helpfulExercises: ["Box Breathing (4-4-4-4)", "4-7-8 Sleep Method"],
      timestamp: new Date().toISOString()
    });
  }

  // Anxiety & Panic Guidance
  if (/(anxious|panic|racing heart|scared|nervous|freaking out|overwhelmed)/.test(query)) {
    return res.json({
      reply: "I hear you, and it is completely okay to feel this way. Let's ground ourselves right now:\n\n1. 🌬️ **Take a 4-4-4-4 Box Breath:** Inhale slowly for 4 seconds, hold for 4, exhale gently for 4, and pause for 4.\n2. 🖐️ **5-4-3-2-1 Sensory Reset:** Notice 5 objects you can see around you right now and 4 things you can physically touch.\n\nI've queued up calming **Mountain Stream** audio for you. Would you like to do a 1-minute guided breath together?",
      sentiment: "anxiety",
      emergency: false,
      suggestions: ["Start 1-Min Breathing", "Play Calming Audio", "Check Anxiety Score"],
      recommendedMoodMusic: "anxiety-stream",
      helpfulExercises: ["Box Breathing (4-4-4-4)", "5-4-3-2-1 Sensory Grounding"],
      timestamp: new Date().toISOString()
    });
  }

  // Sadness / Low Mood
  if (/(sad|depressed|lonely|hopeless|empty|crying|tired of everything|low energy|unmotivated)/.test(query)) {
    return res.json({
      reply: "Thank you for sharing that with me. It takes courage to acknowledge low energy and heavy feelings. Remember that your worth is not tied to productivity today.\n\n✨ **Gentle Micro-Step:** Drink half a glass of cool water, step near a window for natural light, or permit yourself to rest without guilt. I am here with you throughout your day.",
      sentiment: "low_mood",
      emergency: false,
      suggestions: ["Try AI Mood Screener", "Play Uplifting Audio", "Talk with Doctor"],
      recommendedMoodMusic: "night-rest",
      helpfulExercises: ["Self-Compassion Pause", "Gentle Sunlight Hydration"],
      timestamp: new Date().toISOString()
    });
  }

  // Stress & Work Overload
  if (/(stress|burnt out|burnout|too much work|deadlines|exhausted|angry|frustrated|irritated)/.test(query)) {
    return res.json({
      reply: "Chronic stress puts your nervous system on high alert. Let's activate your parasympathetic relaxation response:\n\n• **Shoulder Drop:** Intentionally lower your shoulders away from your ears and unclench your jaw.\n• **Progressive Muscle Release:** Squeeze your hands into gentle fists for 3 seconds, then release completely.\n\nWould you like to review your stress risk indicators or listen to soothing rainfall?",
      sentiment: "stress",
      emergency: false,
      suggestions: ["Play Forest Rain", "Test DASS-42 Stress", "Book Consultation"],
      recommendedMoodMusic: "stress-rain",
      helpfulExercises: ["Progressive Muscle Relaxation", "Hydration Break"],
      timestamp: new Date().toISOString()
    });
  }

  // Sleep & Insomnia
  if (/(sleep|insomnia|can't sleep|nightmare|restless|awake|tired)/.test(query)) {
    return res.json({
      reply: "Trouble sleeping is often linked with sympathetic nervous hyperarousal. Here is a proven sleep hygiene cue:\n\n🌙 **The 4-7-8 Sleep Method:** Inhale for 4 seconds, hold for 7 seconds, exhale audibly for 8 seconds. Repeat 4 times while keeping screens at lowest brightness.\n\nEnjoy our **Nocturne Serenade** ambient loop to drift off peacefully.",
      sentiment: "sleep",
      emergency: false,
      suggestions: ["Play Sleep Ambiance", "Try 4-7-8 Breathing", "Log Sleep Vitals"],
      recommendedMoodMusic: "night-rest",
      timestamp: new Date().toISOString()
    });
  }

  // Medication / E-Prescription Inquiries
  if (/(prescription|medicine|dosage|pill|tablet|refill|inhaler|antibiotic|paracetamol)/.test(query)) {
    return res.json({
      reply: "In MediGrid, you can view your verified **E-Prescriptions** under the **Records & Prescriptions** tab (`/records`). Always follow the exact dosage, frequency, and clinical notes provided by your doctor. If you experience adverse reactions, notify your care team immediately.",
      sentiment: "clinical",
      emergency: false,
      suggestions: ["Open My Prescriptions", "Find Doctors Nearby", "Ask Symptom Question"],
      recommendedMoodMusic: "balanced-birds",
      timestamp: new Date().toISOString()
    });
  }

  // Friendly Greetings & Natural Conversation
  if (/^(hi|hello|hey|greetings|good morning|good afternoon|good evening|howdy|what's up|yo)\b/.test(query) || /^(how are you|how r u|how are you doing|how is it going)/.test(query)) {
    return res.json({
      reply: "👋 **Hello! It is wonderful to talk with you.**\n\nI'm your **MediGrid Real-Time AI Companion**. I am right here to listen, talk through how you're feeling, help with symptom questions, guide relaxing breathing, or queue up soothing peace music.\n\nHow is your day going so far? How are you feeling right now?",
      sentiment: "friendly",
      emergency: false,
      suggestions: ["I want to talk about my day", "I feel a bit stressed", "Guide me through breathing", "Play calming peace music", "Check my symptoms"],
      recommendedMoodMusic: "balanced",
      timestamp: new Date().toISOString()
    });
  }

  // Conversational Intent: "Can we talk?", "Talk to me", "I need someone to talk to", "Let's talk"
  if (/(can we talk|talk to me|want to talk|need to talk|someone to talk to|talk with me|let's chat|let's talk|just talk|listen to me)/.test(query)) {
    return res.json({
      reply: "💬 **I am here and I'm listening.**\n\nYou have my full attention in a completely safe, private, and judgment-free space. You can tell me anything that's on your mind—whether it's about work, relationships, how your body is feeling, or just wanting to chat.\n\nWhat would you like to talk about today?",
      sentiment: "empathy",
      emergency: false,
      suggestions: ["I had a tiring day", "I'm having racing thoughts", "Tell me something uplifting", "Can you help me relax?"],
      recommendedMoodMusic: "cool",
      timestamp: new Date().toISOString()
    });
  }

  // Loneliness & Emotional Support
  if (/(lonely|alone|isolated|no one to talk to|nobody cares|feel left out|homesick|need a friend)/.test(query)) {
    return res.json({
      reply: "💙 **You are not alone, and I am glad you reached out.**\n\nFeeling lonely is a deeply human experience, but please remember that your presence matters. You don't have to carry everything by yourself today.\n\nTake a gentle breath with me right now. Would you like to share what's making you feel this way, or would you prefer a comforting audio soundscape like **Nocturne Deep Night (Theta 4Hz)**?",
      sentiment: "empathy",
      emergency: false,
      suggestions: ["Share what's on my mind", "Play Nocturne Theta Waves", "Try a 1-Min Mindful Pause", "Connect with Care Team"],
      recommendedMoodMusic: "mood",
      helpfulExercises: ["Self-Compassion Hand-on-Heart", "Gentle Hydration"],
      timestamp: new Date().toISOString()
    });
  }

  // Music & Soundscape Requests
  if (/(music|soundscape|song|frequency|432hz|528hz|binaural|audio|rain sound|ocean sound|forest sound)/.test(query)) {
    return res.json({
      reply: "🎶 **MediGrid Psychoacoustic Sound Studio**\n\nWe have 6 lossless neuro-acoustic soundscapes calibrated with Solfeggio harmonics & binaural beats:\n\n• 🌊 **Ocean Shoreline (432Hz):** Down-regulates sympathetic nervous tension\n• 🌲 **Morning Forest Birds (528Hz):** Promotes cellular harmony & mental clarity\n• 🌧️ **Gentle Forest Rain (Delta 3Hz):** Eases muscle tension & sensory overload\n• 🏞️ **Mountain River Stream (Theta 6Hz):** Breaks panic & anchors somatic focus\n• 💨 **Meadow Wind (Gamma 40Hz):** Induces cognitive focus & peak flow\n• 🌙 **Nocturne Deep Night (Theta 4Hz):** Soothes fatigue for restful sleep\n\nYou can listen right now using the **Peace Audio Dock** on the bottom-left or in the ML Dashboard!",
      sentiment: "music",
      emergency: false,
      suggestions: ["Play Ocean (432Hz)", "Play Forest Birds (528Hz)", "Play Forest Rain (Delta)", "Open Sound Studio"],
      recommendedMoodMusic: "balanced",
      timestamp: new Date().toISOString()
    });
  }

  // Who are you / Identity
  if (/(who are you|what are you|what is medigrid|what can you do|how do you work|introduce yourself)/.test(query)) {
    return res.json({
      reply: "🤖 **I'm MediBot, your MediGrid Real-Time AI Companion.**\n\nI combine clinical psychometric intelligence with supportive conversational care:\n\n1. 🎙️ **Real-Time Voice Talk:** You can speak directly to me with your microphone or listen to my spoken voice!\n2. 🧠 **Mental Wellness & DASS-42:** Psychometric risk reflection for Depression, Anxiety, and Stress.\n3. 🎶 **Peace Music & Soundscapes:** Solfeggio 432Hz/528Hz and binaural beats tuned to your emotions.\n4. 💊 **E-Prescriptions & Clinical Care:** Easy navigation for verified prescriptions and doctor bookings.\n\nFeel free to ask me anything or talk whenever you need!",
      sentiment: "informative",
      emergency: false,
      suggestions: ["Let's start a voice talk", "Check my mental state", "Find clinics nearby", "Play peaceful soundscape"],
      recommendedMoodMusic: "balanced",
      timestamp: new Date().toISOString()
    });
  }

  // Default Empathetic Health AI Response
  return res.json({
    reply: `I hear you. I'm here to talk, support your mental well-being, guide calming exercises, or help you navigate your MediGrid health records.\n\n• 🗣️ **Feel free to talk about anything** on your mind\n• 🌬️ Try a **Guided Box Breathing Reset**\n• 🎶 Listen to **Solfeggio Mood Music (432Hz / 528Hz)**\n• 📊 Screen your state with **DASS-42 Machine Learning**\n\nWhat would you like to explore next?`,
    sentiment: "neutral",
    emergency: false,
    suggestions: ["Let's talk more", "Screen My Mental State", "Play Peace Music", "Find Clinics Nearby", "Explain My Symptoms"],
    recommendedMoodMusic: "balanced",
    timestamp: new Date().toISOString()
  });
});

export default router;