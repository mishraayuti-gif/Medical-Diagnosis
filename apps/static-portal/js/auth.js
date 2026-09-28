/**
 * MediGrid Authentication & RBAC Engine
 */
const AUTH_KEY = "medigrid_active_session";

// Demo Accounts configuration
const DEMO_ACCOUNTS = [
    { userId: "p-01", name: "Demo Patient", email: "patient@medigrid.demo", role: "patient", verificationStatus: "verified" },
    { userId: "d-01", name: "Dr. Sharma", email: "doctor@medigrid.demo", role: "doctor", verificationStatus: "verified" },
    { userId: "d-02", name: "Dr. Pending Test", email: "pending@medigrid.demo", role: "doctor", verificationStatus: "pending" },
    { userId: "d-03", name: "Dr. Rejected Test", email: "rejected@medigrid.demo", role: "doctor", verificationStatus: "rejected" },
    { userId: "r-01", name: "Demo Receptionist", email: "receptionist@medigrid.demo", role: "receptionist", verificationStatus: "verified" }
];

const AuthService = {
    getSession() {
        const session = localStorage.getItem(AUTH_KEY);
        return session ? JSON.parse(session) : null;
    },

    setSession(userObj) {
        localStorage.setItem(AUTH_KEY, JSON.stringify(userObj));
    },

    clearSession() {
        localStorage.removeItem(AUTH_KEY);
    },

    login(email, password, expectedRole) {
        // Simple demo authentication validation
        const found = DEMO_ACCOUNTS.find(acc => acc.email === email && acc.role === expectedRole);
        if (!found) {
            throw new Error("Invalid email, password, or role selection.");
        }
        if (found.role === 'doctor') {
            if (found.verificationStatus === 'pending') {
                throw new Error("Your profile is currently waiting for verification.");
            }
            if (found.verificationStatus === 'rejected') {
                throw new Error("Your verification was not approved. Please contact support.");
            }
        }
        this.setSession(found);
        return found;
    },

    registerPatient(data) {
        if (data.password !== data.confirmPassword) throw new Error("Passwords do not match.");
        if (data.password.length < 8) throw new Error("Password must be at least 8 characters.");
        
        const newUser = {
            userId: "p-" + Date.now(),
            name: data.fullName,
            email: data.email,
            role: "patient",
            verificationStatus: "verified"
        };
        DEMO_ACCOUNTS.push(newUser);
        this.setSession(newUser);
        return newUser;
    },

    registerDoctor(data) {
        if (data.password !== data.confirmPassword) throw new Error("Passwords do not match.");
        if (data.password.length < 8) throw new Error("Password must be at least 8 characters.");

        const newDoc = {
            userId: "d-" + Date.now(),
            name: data.fullName,
            email: data.email,
            role: "doctor",
            verificationStatus: "pending",
            license: data.licenseNumber,
            specialization: data.specialization
        };
        DEMO_ACCOUNTS.push(newDoc);
        this.setSession(newDoc);
        return newDoc;
    },

    logout() {
        this.clearSession();
        window.location.href = "/";
    }
};

// RBAC Route Guard
function enforceRoleGuard() {
    const path = window.location.pathname;
    const session = AuthService.getSession();

    // Protected paths mapping
    const patientRoutes = ['/patient', '/symptoms', '/appointments', '/prescriptions', '/nearby'];
    const doctorRoutes = ['/doctor', '/doctor/verification'];
    const receptionistRoutes = ['/receptionist'];
    const adminRoutes = ['/admin'];

    const isPatientPath = patientRoutes.some(r => path.includes(r));
    const isDoctorPath = doctorRoutes.some(r => path.includes(r));
    const isReceptionistPath = receptionistRoutes.some(r => path.includes(r));
    const isAdminPath = adminRoutes.some(r => path.includes(r));

    if (isPatientPath || isDoctorPath || isReceptionistPath || isAdminPath) {
        if (!session) {
            window.location.href = "/login";
            return;
        }

        // Role verification guards
        if (isPatientPath && session.role !== 'patient') {
            window.location.href = "/auth/unauthorized.html";
        }
        if (isDoctorPath && session.role !== 'doctor') {
            window.location.href = "/auth/unauthorized.html";
        }
        if (isReceptionistPath && session.role !== 'receptionist') {
            window.location.href = "/auth/unauthorized.html";
        }
        if (isAdminPath) {
            window.location.href = "/auth/unauthorized.html";
        }
    }
}

document.addEventListener('DOMContentLoaded', enforceRoleGuard);