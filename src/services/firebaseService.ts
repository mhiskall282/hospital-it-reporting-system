import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  writeBatch,
  setDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

// User Profile Service
export const profileService = {
  async createProfile(userId: string, profileData: any) {
    const profileRef = doc(db, 'profiles', userId);
    await updateDoc(profileRef, {
      ...profileData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return profileRef;
  },

  async getProfile(userId: string) {
    const profileRef = doc(db, 'profiles', userId);
    const profileSnap = await getDoc(profileRef);
    return profileSnap.exists() ? { id: profileSnap.id, ...profileSnap.data() } : null;
  },

  async updateProfile(userId: string, updates: any) {
    const profileRef = doc(db, 'profiles', userId);
    await updateDoc(profileRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  async getAllProfiles() {
    const profilesRef = collection(db, 'profiles');
    const snapshot = await getDocs(profilesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async createUser(userData: { email: string; password: string; fullName: string; role: string; department: string }) {
    try {
      // Create auth user
      const { user } = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      
      // Update display name
      await updateProfile(user, { displayName: userData.fullName });
      
      // Create profile document
      await setDoc(doc(db, 'profiles', user.uid), {
        fullName: userData.fullName,
        role: userData.role,
        department: userData.department,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  async deleteUser(userId: string) {
    try {
      // Delete profile document
      await deleteDoc(doc(db, 'profiles', userId));
      // Note: Firebase Auth user deletion requires admin SDK on backend
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
};

// Department Service
export const departmentService = {
  async createDepartment(departmentData: any) {
    const departmentsRef = collection(db, 'departments');
    const docRef = await addDoc(departmentsRef, {
      ...departmentData,
      createdAt: serverTimestamp()
    });
    return docRef;
  },

  async getAllDepartments() {
    const departmentsRef = collection(db, 'departments');
    const q = query(departmentsRef, orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async updateDepartment(departmentId: string, updates: any) {
    const departmentRef = doc(db, 'departments', departmentId);
    await updateDoc(departmentRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  async deleteDepartment(departmentId: string) {
    const departmentRef = doc(db, 'departments', departmentId);
    await deleteDoc(departmentRef);
  }
};

// Request Types Service
export const requestTypeService = {
  async createRequestType(requestTypeData: any) {
    const requestTypesRef = collection(db, 'requestTypes');
    const docRef = await addDoc(requestTypesRef, {
      ...requestTypeData,
      createdAt: serverTimestamp()
    });
    return docRef;
  },

  async getAllRequestTypes() {
    const requestTypesRef = collection(db, 'requestTypes');
    const q = query(requestTypesRef, orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};

// Device Categories Service
export const deviceCategoryService = {
  async createCategory(categoryData: any) {
    const categoriesRef = collection(db, 'deviceCategories');
    const docRef = await addDoc(categoriesRef, {
      ...categoryData,
      createdAt: serverTimestamp()
    });
    return docRef;
  },

  async getAllCategories() {
    const categoriesRef = collection(db, 'deviceCategories');
    const q = query(categoriesRef, orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};

// Device Service
export const deviceService = {
  async createDevice(deviceData: any) {
    const devicesRef = collection(db, 'devices');
    const docRef = await addDoc(devicesRef, {
      ...deviceData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef;
  },

  async getAllDevices() {
    const devicesRef = collection(db, 'devices');
    const q = query(devicesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async updateDevice(deviceId: string, updates: any) {
    const deviceRef = doc(db, 'devices', deviceId);
    await updateDoc(deviceRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  async deleteDevice(deviceId: string) {
    const deviceRef = doc(db, 'devices', deviceId);
    await deleteDoc(deviceRef);
  },

  async getDevicesByCategory(categoryId: string) {
    const devicesRef = collection(db, 'devices');
    const q = query(devicesRef, where('categoryId', '==', categoryId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};

// Request Service
export const requestService = {
  async createRequest(requestData: any) {
    const requestsRef = collection(db, 'requests');
    const docRef = await addDoc(requestsRef, {
      ...requestData,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef;
  },

  async getAllRequests() {
    const requestsRef = collection(db, 'requests');
    const q = query(requestsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getUserRequests(userId: string) {
    const requestsRef = collection(db, 'requests');
    const q = query(requestsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async updateRequest(requestId: string, updates: any) {
    const requestRef = doc(db, 'requests', requestId);
    await updateDoc(requestRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }
};

// Incident Service
export const incidentService = {
  async createIncident(incidentData: any) {
    const incidentsRef = collection(db, 'incidents');
    const docRef = await addDoc(incidentsRef, {
      ...incidentData,
      status: 'open',
      createdAt: serverTimestamp()
    });
    return docRef;
  },

  async getAllIncidents() {
    const incidentsRef = collection(db, 'incidents');
    const q = query(incidentsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async updateIncident(incidentId: string, updates: any) {
    const incidentRef = doc(db, 'incidents', incidentId);
    await updateDoc(incidentRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }
};

// Initialize sample data
export const initializeSampleData = async (userId: string) => {
  try {
    const batch = writeBatch(db);

    // Sample departments
    const sampleDepartments = [
      { name: 'Emergency Department', code: 'ED', description: 'Emergency medical services and trauma care', isCritical: true, headOfDepartment: 'Dr. Sarah Johnson', contactNumber: '(555) 123-4567', location: 'Ground Floor, Wing A' },
      { name: 'Intensive Care Unit', code: 'ICU', description: 'Critical care for severely ill patients', isCritical: true, headOfDepartment: 'Dr. Michael Chen', contactNumber: '(555) 123-4568', location: '3rd Floor, Wing B' },
      { name: 'Radiology Department', code: 'RAD', description: 'Medical imaging and diagnostic services', isCritical: false, headOfDepartment: 'Dr. Emily Rodriguez', contactNumber: '(555) 123-4569', location: '2nd Floor, Wing C' },
      { name: 'Laboratory Services', code: 'LAB', description: 'Clinical laboratory and pathology services', isCritical: false, headOfDepartment: 'Dr. James Wilson', contactNumber: '(555) 123-4570', location: 'Basement Level, Wing A' },
      { name: 'Pharmacy Department', code: 'PHARM', description: 'Hospital pharmacy and medication management', isCritical: false, headOfDepartment: 'PharmD Lisa Thompson', contactNumber: '(555) 123-4571', location: 'Ground Floor, Wing B' },
      { name: 'Surgical Department', code: 'SURG', description: 'Operating rooms and surgical services', isCritical: true, headOfDepartment: 'Dr. Robert Martinez', contactNumber: '(555) 123-4572', location: '4th Floor, Wing A' },
      { name: 'Cardiology Department', code: 'CARD', description: 'Heart and cardiovascular care services', isCritical: true, headOfDepartment: 'Dr. Amanda Davis', contactNumber: '(555) 123-4573', location: '5th Floor, Wing B' },
      { name: 'Pediatrics Department', code: 'PED', description: 'Children and adolescent medical care', isCritical: false, headOfDepartment: 'Dr. Kevin Brown', contactNumber: '(555) 123-4574', location: '6th Floor, Wing C' },
      { name: 'Oncology Department', code: 'ONC', description: 'Cancer treatment and care services', isCritical: true, headOfDepartment: 'Dr. Maria Garcia', contactNumber: '(555) 123-4575', location: '7th Floor, Wing A' },
      { name: 'Neurology Department', code: 'NEURO', description: 'Brain and nervous system disorders', isCritical: true, headOfDepartment: 'Dr. David Lee', contactNumber: '(555) 123-4576', location: '8th Floor, Wing B' },
      { name: 'Orthopedics Department', code: 'ORTHO', description: 'Bone, joint, and musculoskeletal care', isCritical: false, headOfDepartment: 'Dr. Jennifer White', contactNumber: '(555) 123-4577', location: '9th Floor, Wing C' },
      { name: 'Maternity Ward', code: 'MAT', description: 'Obstetrics and gynecology services', isCritical: true, headOfDepartment: 'Dr. Susan Taylor', contactNumber: '(555) 123-4578', location: '10th Floor, Wing A' },
      { name: 'Psychiatry Department', code: 'PSYCH', description: 'Mental health and psychiatric services', isCritical: false, headOfDepartment: 'Dr. Mark Anderson', contactNumber: '(555) 123-4579', location: '11th Floor, Wing B' },
      { name: 'Physical Therapy', code: 'PT', description: 'Rehabilitation and physical therapy services', isCritical: false, headOfDepartment: 'PT Director Rachel Green', contactNumber: '(555) 123-4580', location: '1st Floor, Wing C' },
      { name: 'IT Department', code: 'IT', description: 'Information technology and systems management', isCritical: true, headOfDepartment: 'IT Director John Smith', contactNumber: '(555) 123-4581', location: 'Basement Level, Wing B' }
    ];

    // Add sample departments
    sampleDepartments.forEach((department) => {
      const departmentRef = doc(collection(db, 'departments'));
      batch.set(departmentRef, {
        ...department,
        createdAt: serverTimestamp()
      });
    });

    // Sample device categories
    const sampleCategories = [
      { name: 'Medical Imaging Equipment', description: 'X-ray, MRI, CT scan, ultrasound equipment' },
      { name: 'Patient Monitoring Systems', description: 'Vital signs and patient monitoring devices' },
      { name: 'Laboratory Equipment', description: 'Lab testing, analysis, and diagnostic equipment' },
      { name: 'Surgical Equipment', description: 'Operating room and surgical instruments' },
      { name: 'IT Equipment', description: 'Computers, servers, network devices, and software' },
      { name: 'Life Support Systems', description: 'Ventilators, ECMO, and critical life support' },
      { name: 'Cardiac Equipment', description: 'ECG, defibrillators, and cardiac monitoring' },
      { name: 'Anesthesia Equipment', description: 'Anesthesia machines and gas monitoring' },
      { name: 'Emergency Equipment', description: 'Crash carts, emergency response equipment' },
      { name: 'Rehabilitation Equipment', description: 'Physical therapy and rehabilitation devices' }
    ];

    // Add sample categories
    sampleCategories.forEach((category) => {
      const categoryRef = doc(collection(db, 'deviceCategories'));
      batch.set(categoryRef, {
        ...category,
        createdAt: serverTimestamp()
      });
    });

    // Sample request types
    const sampleRequestTypes = [
      { name: 'Equipment Failure', description: 'Report broken or malfunctioning medical equipment' },
      { name: 'New Equipment Request', description: 'Request for new medical or IT equipment purchase' },
      { name: 'Software Issue', description: 'Problems with hospital management software systems' },
      { name: 'Network Connectivity Problem', description: 'Internet, WiFi, or network connectivity issues' },
      { name: 'Emergency Repair', description: 'Urgent equipment repair affecting patient care' },
      { name: 'Preventive Maintenance', description: 'Scheduled maintenance and calibration services' },
      { name: 'Equipment Training', description: 'Staff training on medical equipment usage' },
      { name: 'System Integration', description: 'Integration of new systems with existing infrastructure' },
      { name: 'Security Incident', description: 'IT security breaches or suspicious activities' },
      { name: 'Data Recovery', description: 'Recovery of lost or corrupted patient data' },
      { name: 'Compliance Audit', description: 'Equipment compliance and regulatory audit requests' },
      { name: 'Upgrade Request', description: 'Software or hardware upgrade requirements' }
    ];

    // Add sample request types
    sampleRequestTypes.forEach((requestType) => {
      const requestTypeRef = doc(collection(db, 'requestTypes'));
      batch.set(requestTypeRef, {
        ...requestType,
        createdAt: serverTimestamp()
      });
    });

    // Sample devices
    const sampleDevices = [
      {
        name: 'MRI Scanner - Radiology Main',
        model: 'Siemens MAGNETOM Skyra 3T',
        serialNumber: 'MRI-001-2024',
        status: 'active',
        category: 'Medical Imaging Equipment',
        location: 'Radiology Department',
        isCritical: true,
        complianceStatus: 'compliant',
        purchaseDate: '2023-01-15',
        warrantyDate: '2026-01-15',
        notes: 'Primary MRI scanner for emergency and routine imaging. Last calibration: 2024-01-15'
      },
      {
        name: 'Patient Monitor - ICU Room 101',
        model: 'Philips IntelliVue MX800',
        serialNumber: 'PM-ICU-001',
        status: 'active',
        category: 'Patient Monitoring Systems',
        location: 'ICU Room 101',
        isCritical: true,
        complianceStatus: 'compliant',
        purchaseDate: '2023-03-20',
        warrantyDate: '2026-03-20',
        notes: 'Multi-parameter patient monitor with advanced cardiac monitoring capabilities'
      },
      {
        name: 'Digital X-Ray System - Emergency',
        model: 'GE Healthcare Optima XR200amx',
        serialNumber: 'XR-ED-003',
        status: 'maintenance',
        category: 'Medical Imaging Equipment',
        location: 'Emergency Department',
        isCritical: true,
        complianceStatus: 'pending',
        purchaseDate: '2022-08-10',
        warrantyDate: '2025-08-10',
        notes: 'Currently under preventive maintenance - detector calibration and software update'
      },
      {
        name: 'Mechanical Ventilator - ICU Room 102',
        model: 'Medtronic PB980',
        serialNumber: 'VENT-ICU-002',
        status: 'active',
        category: 'Life Support Systems',
        location: 'ICU Room 102',
        isCritical: true,
        complianceStatus: 'compliant',
        purchaseDate: '2023-05-12',
        warrantyDate: '2026-05-12',
        notes: 'Advanced mechanical ventilator with lung protective ventilation modes and NIV capability'
      },
      {
        name: 'CT Scanner - Radiology',
        model: 'Siemens SOMATOM Definition AS+',
        serialNumber: 'CT-RAD-001',
        status: 'active',
        category: 'Medical Imaging Equipment',
        location: 'Radiology Department',
        isCritical: true,
        complianceStatus: 'compliant',
        purchaseDate: '2022-11-30',
        warrantyDate: '2025-11-30',
        notes: '128-slice CT scanner with advanced cardiac imaging capabilities'
      },
      {
        name: 'Portable Ultrasound - Emergency',
        model: 'Philips EPIQ CVx',
        serialNumber: 'US-PORT-001',
        status: 'active',
        category: 'Medical Imaging Equipment',
        location: 'Emergency Department',
        isCritical: false,
        complianceStatus: 'compliant',
        purchaseDate: '2023-07-18',
        warrantyDate: '2026-07-18',
        notes: 'High-end portable ultrasound system for bedside examinations and procedures'
      },
      {
        name: 'Defibrillator - Emergency Room 1',
        model: 'ZOLL X Series',
        serialNumber: 'DEFIB-ED-001',
        status: 'active',
        category: 'Emergency Equipment',
        location: 'Emergency Department',
        isCritical: true,
        complianceStatus: 'compliant',
        purchaseDate: '2023-02-28',
        warrantyDate: '2026-02-28',
        notes: 'Advanced life support defibrillator with Real CPR Help'
      },
      {
        name: 'Anesthesia Machine - OR-01',
        model: 'GE Healthcare Aisys CS2',
        serialNumber: 'ANES-OR-001',
        status: 'faulty',
        category: 'Surgical Equipment',
        location: 'Operating Room 1',
        isCritical: true,
        complianceStatus: 'non-compliant',
        purchaseDate: '2021-12-15',
        warrantyDate: '2024-12-15',
        notes: 'Oxygen sensor malfunction - requires immediate repair'
      }
    ];

    // Add sample devices
    sampleDevices.forEach((device) => {
      const deviceRef = doc(collection(db, 'devices'));
      batch.set(deviceRef, {
        ...device,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });

    // Sample requests
    const sampleRequests = [
      {
        title: 'MRI Scanner Calibration Required',
        description: 'The MRI scanner in Radiology needs routine calibration. Image quality has been slightly degraded in recent scans.',
        requestType: 'Maintenance Request',
        priority: 'medium',
        urgencyLevel: 'routine',
        patientImpact: false,
        status: 'pending',
        userId: userId
      },
      {
        title: 'Emergency: Anesthesia Machine Malfunction',
        description: 'Anesthesia machine in OR-1 showing oxygen sensor errors. Surgery scheduled in 2 hours needs immediate attention.',
        requestType: 'Emergency Repair',
        priority: 'urgent',
        urgencyLevel: 'emergency',
        patientImpact: true,
        status: 'in_progress',
        userId: userId
      }
    ];

    await batch.commit();
    console.log('Sample data initialized successfully');
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
};