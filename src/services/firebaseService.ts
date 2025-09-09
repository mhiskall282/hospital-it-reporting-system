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
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';

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

    // Sample devices
    const sampleDevices = [
      {
        name: 'MRI Scanner',
        model: 'Siemens MAGNETOM',
        serialNumber: 'MRI-001',
        status: 'active',
        category: 'Medical Imaging',
        location: 'Radiology Department',
        isCritical: true,
        complianceStatus: 'compliant'
      },
      {
        name: 'Patient Monitor',
        model: 'Philips IntelliVue',
        serialNumber: 'PM-002',
        status: 'active',
        category: 'Patient Monitoring',
        location: 'ICU',
        isCritical: true,
        complianceStatus: 'compliant'
      },
      {
        name: 'X-Ray Machine',
        model: 'GE Healthcare',
        serialNumber: 'XR-003',
        status: 'maintenance',
        category: 'Medical Imaging',
        location: 'Emergency Department',
        isCritical: false,
        complianceStatus: 'pending'
      }
    ];

    // Add sample devices
    sampleDevices.forEach((device, index) => {
      const deviceRef = doc(collection(db, 'devices'));
      batch.set(deviceRef, {
        ...device,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });

    await batch.commit();
    console.log('Sample data initialized successfully');
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
};