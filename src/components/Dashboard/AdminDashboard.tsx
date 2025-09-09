import React, { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  ComputerDesktopIcon, 
  DocumentTextIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import Analytics from './Analytics';
import UserManagement from './UserManagement';
import DeviceManagement from './DeviceManagement';
import RequestManagement from './RequestManagement';
import MaintenanceManagement from './MaintenanceManagement';
import ComplianceManagement from './ComplianceManagement';
import IncidentManagement from './IncidentManagement';

type TabType = 'overview' | 'requests' | 'devices' | 'users' | 'maintenance' | 'compliance' | 'incidents' | 'analytics';

interface Stats {
  totalUsers: number;
  totalDevices: number;
  pendingRequests: number;
  emergencyRequests: number;
  activeDevices: number;
  faultyDevices: number;
  criticalDevices: number;
  complianceIssues: number;
  overdueMaintenances: number;
  openIncidents: number;
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalDevices: 0,
    pendingRequests: 0,
    emergencyRequests: 0,
    activeDevices: 0,
    faultyDevices: 0,
    criticalDevices: 0,
    complianceIssues: 0,
    overdueMaintenances: 0,
    openIncidents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [usersResult, devicesResult, requestsResult, maintenanceResult, incidentsResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('devices').select('id, status, is_critical, compliance_status', { count: 'exact' }),
        supabase.from('requests').select('id, status, urgency_level', { count: 'exact' }),
        supabase.from('maintenance_schedules').select('id, status, scheduled_date', { count: 'exact' }),
        supabase.from('incident_reports').select('id, status', { count: 'exact' }),
      ]);

      const devices = devicesResult.data || [];
      const requests = requestsResult.data || [];
      const maintenances = maintenanceResult.data || [];
      const incidents = incidentsResult.data || [];

      setStats({
        totalUsers: usersResult.count || 0,
        totalDevices: devicesResult.count || 0,
        pendingRequests: requests.filter(r => r.status === 'pending').length,
        emergencyRequests: requests.filter(r => r.urgency_level === 'emergency' || r.urgency_level === 'critical').length,
        activeDevices: devices.filter(d => d.status === 'active').length,
        faultyDevices: devices.filter(d => d.status === 'faulty').length,
        criticalDevices: devices.filter(d => d.is_critical).length,
        complianceIssues: devices.filter(d => d.compliance_status !== 'compliant').length,
        overdueMaintenances: maintenances.filter(m => 
          m.status === 'scheduled' && new Date(m.scheduled_date) < new Date()
        ).length,
        openIncidents: incidents.filter(i => i.status === 'open' || i.status === 'investigating').length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'requests', name: 'Requests', icon: DocumentTextIcon },
    { id: 'devices', name: 'Devices', icon: ComputerDesktopIcon },
    { id: 'maintenance', name: 'Maintenance', icon: Cog6ToothIcon },
    { id: 'compliance', name: 'Compliance', icon: Cog6ToothIcon },
    { id: 'incidents', name: 'Incidents', icon: DocumentTextIcon },
    { id: 'users', name: 'Users', icon: UsersIcon },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
  ];

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: UsersIcon,
      color: 'blue',
    },
    {
      title: 'Total Devices',
      value: stats.totalDevices,
      icon: ComputerDesktopIcon,
      color: 'indigo',
    },
    {
      title: 'Pending Requests',
      value: stats.pendingRequests,
      icon: DocumentTextIcon,
      color: 'yellow',
    },
    {
      title: 'Emergency Requests',
      value: stats.emergencyRequests,
      icon: DocumentTextIcon,
      color: 'red',
    },
    {
      title: 'Active Devices',
      value: stats.activeDevices,
      icon: Cog6ToothIcon,
      color: 'green',
    },
    {
      title: 'Critical Equipment',
      value: stats.criticalDevices,
      icon: ComputerDesktopIcon,
      color: 'purple',
    },
    {
      title: 'Compliance Issues',
      value: stats.complianceIssues,
      icon: DocumentTextIcon,
      color: 'orange',
    },
    {
      title: 'Overdue Maintenance',
      value: stats.overdueMaintenances,
      icon: Cog6ToothIcon,
      color: 'red',
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'requests':
        return <RequestManagement />;
      case 'devices':
        return <DeviceManagement onDeviceChange={fetchStats} />;
      case 'maintenance':
        return <MaintenanceManagement />;
      case 'compliance':
        return <ComplianceManagement />;
      case 'incidents':
        return <IncidentManagement />;
      case 'users':
        return <UserManagement />;
      case 'analytics':
        return <Analytics />;
      default:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Hospital IT Operations Dashboard</h2>
            
            {/* Emergency Alerts */}
            {(stats.emergencyRequests > 0 || stats.openIncidents > 0 || stats.overdueMaintenances > 0) && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-8 w-8 text-red-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-800">Critical Alerts</h3>
                    <div className="text-red-700 space-y-1">
                      {stats.emergencyRequests > 0 && (
                        <p>🚨 {stats.emergencyRequests} emergency requests require immediate attention</p>
                      )}
                      {stats.openIncidents > 0 && (
                        <p>⚠️ {stats.openIncidents} open incidents need investigation</p>
                      )}
                      {stats.overdueMaintenances > 0 && (
                        <p>🔧 {stats.overdueMaintenances} maintenance tasks are overdue</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map((stat) => (
                <div
                  key={stat.title}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                      <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {loading ? '...' : stat.value}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Hospital IT Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('requests')}
                  className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                >
                  <DocumentTextIcon className="h-8 w-8 text-blue-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">IT Requests</p>
                    <p className="text-sm text-gray-600">Process equipment and support requests</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab('devices')}
                  className="flex items-center p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors duration-200"
                >
                  <ComputerDesktopIcon className="h-8 w-8 text-indigo-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Medical Equipment</p>
                    <p className="text-sm text-gray-600">Manage hospital IT and medical devices</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab('maintenance')}
                  className="flex items-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors duration-200"
                >
                  <Cog6ToothIcon className="h-8 w-8 text-yellow-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Maintenance</p>
                    <p className="text-sm text-gray-600">Schedule and track equipment maintenance</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab('incidents')}
                  className="flex items-center p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200"
                >
                  <DocumentTextIcon className="h-8 w-8 text-red-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Incidents</p>
                    <p className="text-sm text-gray-600">Manage safety and security incidents</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab('users')}
                  className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200"
                >
                  <UsersIcon className="h-8 w-8 text-green-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">User Management</p>
                    <p className="text-sm text-gray-600">Manage hospital staff accounts</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto">
        {/* Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-16 z-30">
          <div className="px-6">
            <div className="flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;