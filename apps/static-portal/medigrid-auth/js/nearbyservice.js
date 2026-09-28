/**
 * MediGrid Nearby Healthcare Data Service
 * Backend-ready data layer abstraction
 */

const MOCK_NEARBY_DATA = {
    doctors: [
        { id: 'doc-1', name: 'Dr. Sharma', type: 'doctor', specialization: 'Cardiologist', rating: 4.8, distance: 1.2, availability: 'Available Today', address: '124 Medical Plaza, Sector 4', contact: '+1 (555) 234-5678' },
        { id: 'doc-2', name: 'Dr. Mehta', type: 'doctor', specialization: 'Neurologist', rating: 4.6, distance: 3.5, availability: 'Next Available: Tomorrow', address: '88 Health Avenue, Suite 200', contact: '+1 (555) 345-6789' },
        { id: 'doc-3', name: 'Dr. Priya', type: 'doctor', specialization: 'Pediatrician', rating: 4.9, distance: 0.8, availability: 'Available Today', address: '12 Care Street, Block B', contact: '+1 (555) 456-7890' }
    ],
    clinics: [
        { id: 'cli-1', name: 'HealthCare Clinic', type: 'clinic', specialization: 'General Healthcare', rating: 4.6, distance: 1.8, availability: 'Open Today • Closes 8 PM', address: '45 Wellness Boulevard', contact: '+1 (555) 567-8901' },
        { id: 'cli-2', name: 'MediCare Clinic', type: 'clinic', specialization: 'Family Practice & Diagnostics', rating: 4.4, distance: 4.1, availability: 'Open Today • Closes 6 PM', address: '909 Recovery Road', contact: '+1 (555) 678-9012' }
    ],
    hospitals: [
        { id: 'hosp-1', name: 'City Hospital', type: 'hospital', specialization: 'Multi-Specialty & Trauma', rating: 4.7, distance: 2.4, availability: 'Emergency Services Available 24/7', address: '1 Central Emergency Way', contact: '+1 (555) 911-0000' },
        { id: 'hosp-2', name: 'Metro Hospital', type: 'hospital', specialization: 'Advanced Cardiac & Critical Care', rating: 4.8, distance: 5.6, availability: 'Emergency Services Available 24/7', address: '500 Metro Parkway', contact: '+1 (555) 911-1111' }
    ]
};

const NearbyService = {
    async getNearbyDoctors(filters = {}) {
        // Simulating async API call
        let results = [...MOCK_NEARBY_DATA.doctors];
        if (filters.search) {
            const q = filters.search.toLowerCase();
            results = results.filter(d => d.name.toLowerCase().includes(q) || d.specialization.toLowerCase().includes(q) || d.address.toLowerCase().includes(q));
        }
        if (filters.maxDistance) {
            results = results.filter(d => d.distance <= filters.maxDistance);
        }
        return results;
    },

    async getNearbyClinics(filters = {}) {
        let results = [...MOCK_NEARBY_DATA.clinics];
        if (filters.search) {
            const q = filters.search.toLowerCase();
            results = results.filter(c => c.name.toLowerCase().includes(q) || c.specialization.toLowerCase().includes(q));
        }
        if (filters.maxDistance) {
            results = results.filter(c => c.distance <= filters.maxDistance);
        }
        return results;
    },

    async getNearbyHospitals(filters = {}) {
        let results = [...MOCK_NEARBY_DATA.hospitals];
        if (filters.search) {
            const q = filters.search.toLowerCase();
            results = results.filter(h => h.name.toLowerCase().includes(q) || h.specialization.toLowerCase().includes(q));
        }
        if (filters.maxDistance) {
            results = results.filter(h => h.distance <= filters.maxDistance);
        }
        return results;
    },

    async getAllHealthcare(filters = {}) {
        const [docs, clin, hosp] = await Promise.all([
            this.getNearbyDoctors(filters),
            this.getNearbyClinics(filters),
            this.getNearbyHospitals(filters)
        ]);
        return [...docs, ...clin, ...hosp];
    }
};