import React, { useState, useEffect } from 'react';
import { 
  ComputerDesktopIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  ClockIcon,
  PlayCircleIcon,
  HeartIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import FloatingActionButton from '../Layout/FloatingActionButton';
import RequestModal from './RequestModal';
import IncidentModal from './IncidentModal';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface Device {
  id: string;
  name: string;
  model: string | null;
  status: 'active' | 'faulty' | 'maintenance' | 'retired';
  category: string;
  location: string | null;
  is_critical: boolean;
  compliance_status: string;
}

interface Request {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  priority: string;
  urgency_level: string;
  patient_impact: boolean;
  created_at: string;
  request_types: { name: string };
}

interface Department {
  id: string;
  name: string;
  code: string;
  is_critical: boolean;
}

const UserDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [requestType, setRequestType] = useState<'issue' | 'equipment' | 'emergency'>('issue');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch devices
      const { data: devicesData } = await supabase
        .from('devices')
        .select(`
          id, name, model, status, location, is_critical, compliance_status,
          device_categories(name)
        `);

      // Fetch user's requests
      const { data: requestsData } = await supabase
        .from('requests')
        .select(`
          id, title, description, status, priority, urgency_level, patient_impact, created_at,
          request_types(name)
        `)
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false });

      // Fetch departments
      const { data: departmentsData } = await supabase
        .from('departments')
        .select('id, name, code, is_critical')
        .order('name');

      if (devicesData) {
        setDevices(devicesData.map((device: any) => ({
          ...device,
          category: device.device_categories?.name || 'Unknown'
        })));
      }

      if (requestsData) {
        setRequests(requestsData);
      }

      if (departmentsData) {
        setDepartments(departmentsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'faulty':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'maintenance':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'in_progress':
        return <PlayCircleIcon className="h-5 w-5 text-blue-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'faulty':
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'maintenance':
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
      case 'critical':
        return 'bg-red-100 text-red-700 animate-pulse';
      case 'urgent':
        return 'bg-orange-100 text-orange-700';
      case 'routine':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleNewRequest = () => {
    setRequestType('equipment');
    setShowRequestModal(true);
  };

  const handleReportIssue = () => {
    setRequestType('issue');
    setShowRequestModal(true);
  };

  const handleEmergencyRequest = () => {
    setRequestType('emergency');
    setShowRequestModal(true);
  };

  const handleReportIncident = () => {
    setShowIncidentModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activeDevices = devices.filter(d => d.status === 'active').length;
  const faultyDevices = devices.filter(d => d.status === 'faulty').length;
  const criticalDevices = devices.filter(d => d.is_critical).length;
  const complianceIssues = devices.filter(d => d.compliance_status !== 'compliant').length;
  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  const completedRequests = requests.filter(r => r.status === 'completed').length;
  const emergencyRequests = requests.filter(r => r.urgency_level === 'emergency' || r.urgency_level === 'critical').length;
  const patientImpactRequests = requests.filter(r => r.patient_impact).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Welcome Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/20">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Welcome to Hospital IT Operations, {profile?.full_name}
          </h1>
          <p className="text-gray-600">
            Manage medical equipment, IT requests, and view system status from your dashboard.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Devices</p>
                <p className="text-2xl font-bold text-gray-900">{activeDevices}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Faulty Devices</p>
                <p className="text-2xl font-bold text-gray-900">{faultyDevices}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <HeartIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Critical Equipment</p>
                <p className="text-2xl font-bold text-gray-900">{criticalDevices}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <ShieldCheckIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Compliance Issues</p>
                <p className="text-2xl font-bold text-gray-900">{complianceIssues}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900">{pendingRequests}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedRequests}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Alerts */}
        {(emergencyRequests > 0 || patientImpactRequests > 0) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-red-800">Critical Alerts</h3>
                <p className="text-red-700">
                  {emergencyRequests > 0 && `${emergencyRequests} emergency requests pending. `}
                  {patientImpactRequests > 0 && `${patientImpactRequests} requests may impact patient care.`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Requests */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800">Your Recent Requests</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {requests.length === 0 ? (
              <div className="p-6 text-center">
                <ComputerDesktopIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No requests yet. Click the floating button to create your first request!</p>
              </div>
            ) : (
              requests.slice(0, 5).map((request) => (
                <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(request.status)}
                        <h3 className="font-medium text-gray-900">{request.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}>
                          {request.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getUrgencyColor(request.urgency_level)}`}>
                          {request.urgency_level}
                        </span>
                        {request.patient_impact && (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                            Patient Impact
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mt-1">{request.description.substring(0, 100)}...</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>{request.request_types.name}</span>
                        <span>Priority: {request.priority}</span>
                        <span>{format(new Date(request.created_at), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Medical Equipment Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800">Medical Equipment Status</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {devices.slice(0, 6).map((device) => (
              <div key={device.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-gray-900">{device.name}</h3>
                    {device.is_critical && (
                      <HeartIcon className="h-4 w-4 text-red-500" title="Critical Equipment" />
                    )}
                  </div>
                  {getStatusIcon(device.status)}
                </div>
                <p className="text-sm text-gray-600">{device.model || 'No model specified'}</p>
                <p className="text-xs text-gray-500 mt-1">{device.category}</p>
                {device.location && (
                  <p className="text-xs text-gray-500">Location: {device.location}</p>
                )}
                <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${getStatusColor(device.status)}`}>
                  {device.status}
                </span>
                {device.compliance_status !== 'compliant' && (
                  <span className="inline-block px-2 py-1 text-xs rounded-full mt-2 ml-2 bg-orange-100 text-orange-700">
                    {device.compliance_status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Hospital Departments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800">Hospital Departments</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
            {departments.map((dept) => (
              <div key={dept.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{dept.name}</h3>
                  {dept.is_critical && (
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                      Critical
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">Code: {dept.code}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton
        onNewRequest={handleNewRequest}
        onReportIssue={handleReportIssue}
        onReportIncident={handleReportIncident}
        onEmergencyRequest={handleEmergencyRequest}
      />

      {/* Request Modal */}
      <RequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        type={requestType}
        onSuccess={fetchData}
      />

      {/* Incident Modal */}
      <IncidentModal
        isOpen={showIncidentModal}
        onClose={() => setShowIncidentModal(false)}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default UserDashboard;