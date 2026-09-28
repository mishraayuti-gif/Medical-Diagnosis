/**
 * MediGrid E-Prescription Data Service
 * Backend-ready abstraction layer for prescriptions
 */
const PRESCRIPTIONS_STORAGE_KEY = "medigrid_prescriptions_db";

const DEFAULT_MOCK_PRESCRIPTIONS = [
    {
        id: "RX-2026-0001",
        patientId: "p-01",
        patientName: "Demo Patient",
        patientAge: 21,
        patientGender: "Female",
        doctorId: "d-01",
        doctorName: "Dr. Sharma",
        doctorSpecialization: "General Physician",
        date: "2026-08-22",
        clinicalNotes: "Patient presents with mild acute upper respiratory symptoms. Vital signs stable.",
        medicines: [
            { name: "Paracetamol", dosage: "500 mg", frequency: "Twice daily", duration: "5 days", route: "Oral", instructions: "Take after meals" },
            { name: "Cetirizine", dosage: "10 mg", frequency: "Once daily", duration: "3 days", route: "Oral", instructions: "Take before bedtime" }
        ],
        generalInstructions: "Drink adequate water and maintain proper rest schedule.",
        followUpDate: "2026-09-05",
        status: "ACTIVE"
    }
];

const PrescriptionService = {
    getDb() {
        const data = localStorage.getItem(PRESCRIPTIONS_STORAGE_KEY);
        if (!data) {
            localStorage.setItem(PRESCRIPTIONS_STORAGE_KEY, JSON.stringify(DEFAULT_MOCK_PRESCRIPTIONS));
            return DEFAULT_MOCK_PRESCRIPTIONS;
        }
        return JSON.parse(data);
    },

    saveDb(db) {
        localStorage.setItem(PRESCRIPTIONS_STORAGE_KEY, JSON.stringify(db));
    },

    generateUniqueId() {
        const db = this.getDb();
        const year = new Date().getFullYear();
        const nextNum = String(db.length + 1).padStart(4, '0');
        return `RX-${year}-${nextNum}`;
    },

    createPrescription(payload) {
        const db = this.getDb();
        const newRx = {
            id: this.generateUniqueId(),
            ...payload,
            status: "ACTIVE"
        };
        db.unshift(newRx);
        this.saveDb(db);
        return newRx;
    },

    getPrescriptionById(rxId) {
        const db = this.getDb();
        return db.find(p => p.id === rxId) || null;
    },

    getPatientPrescriptions(patientName) {
        const db = this.getDb();
        return db.filter(p => p.patientName.toLowerCase() === patientName.toLowerCase());
    },

    getDoctorPrescriptions(doctorName) {
        const db = this.getDb();
        return db.filter(p => p.doctorName.toLowerCase() === doctorName.toLowerCase());
    }
};