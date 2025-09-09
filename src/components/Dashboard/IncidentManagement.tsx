import React, { useState, useEffect } from 'react';
import { ExclamationTriangleIcon, EyeIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface IncidentReport {
  id: string;
  device_id: string | null;
  reported_by: string;
  incident_type: string;
  severity: string;
  description: string;
  impact_assessment: string | null;
  immediate_action_taken: string | null;
  root_cause: string | null;
  corrective_action: string | null;
  status: string;
  occurred_at: string;
  resolved_at: string | null;
  created_at: string;
  devices: { name: string; model: string | null } | null;
  profiles: { full_name: string; email: string };
}

const IncidentManagement: React.FC = () => {
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [resolutionData, setResolutionData] = useState({
    rootCause: '',
    correctiveAction: '',
  });

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const { data, error } = await supabase
        .from('incident_reports')
        .select(`
          *,
          devices(name, model),
          profiles(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setIncidents(data);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      toast.error('Failed to load incident reports');
    } finally {
      setLoading(false);
    }
  };

  const updateIncidentStatus = async (incidentId: string, newStatus: string) => {
    setLoading(true);
    try {
      const updateData: any = {
        status: newStatus,
      };

      if (newStatus === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
        updateData.root_cause = resolutionData.rootCause;
        updateData.corrective_action = resolutionData.correctiveAction;
      }

      const { error } = await supabase
        .from('incident_reports')
        .update(updateData)
        .eq('id', incidentId);

      if (error) throw error;

      toast.success('Incident status updated successfully');
      fetchIncidents();
      setSelectedIncident(null);
      setResolutionData({ rootCause: '', correctiveAction: '' });
    } catch (error: any) {
      console.error('Error updating incident:', error);
      toast.error(error.message || 'Failed to update incident');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-600 animate-pulse" />;
      case 'high':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
      case 'medium':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <ExclamationTriangleIcon className="h-5 w-5 text-green-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700 animate-pulse';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-700';
      case 'investigating':
        return 'bg-yellow-100 text-yellow-700';
      case 'resolved':
        return 'bg-green-100 text-green-700';
      case 'closed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredIncidents = incidents.filter(incident => {
    const statusMatch = statusFilter === 'all' || incident.status === statusFilter;
    const severityMatch = severityFilter === 'all' || incident.severity === severityFilter;
    return statusMatch && severityMatch;
  });

  if (loading && incidents.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Incident Management</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const criticalIncidents = incidents.filter(i => i.severity === 'critical' && i.status !== 'resolved').length;
  const openIncidents = incidents.filter(i => i.status === 'open').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Incident Management</h2>
        
        <div className="flex space-x-4">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalIncidents > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mr-3 animate-pulse" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Critical Incidents Alert</h3>
              <p className="text-red-700">
                🚨 {criticalIncidents} critical incidents require immediate attention
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Incidents List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="divide-y divide-gray-100">
          {filteredIncidents.length === 0 ? (
            <div className="p-6 text-center">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">
                {statusFilter === 'all' && severityFilter === 'all' 
                  ? 'No incident reports found' 
                  : 'No incidents match the selected filters'
                }
              </p>
            </div>
          ) : (
            filteredIncidents.map((incident) => (
              <div key={incident.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getSeverityIcon(incident.severity)}
                      <h3 className="font-medium text-gray-900">
                        {incident.incident_type.replace('_', ' ')} Incident
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(incident.severity)}`}>
                        {incident.severity}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(incident.status)}`}>
                        {incident.status}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{incident.description.substring(0, 200)}...</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Reported by: {incident.profiles.full_name}</span>
                      {incident.devices && (
                        <span>Device: {incident.devices.name}</span>
                      )}
                      <span>Occurred: {format(new Date(incident.occurred_at), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                    
                    {incident.impact_assessment && (
                      <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                        <p className="text-sm font-medium text-yellow-800">Impact Assessment:</p>
                        <p className="text-sm text-yellow-700">{incident.impact_assessment}</p>
                      </div>
                    )}
                    
                    {incident.immediate_action_taken && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-800">Immediate Action Taken:</p>
                        <p className="text-sm text-blue-700">{incident.immediate_action_taken}</p>
                      </div>
                    )}
                    
                    {incident.root_cause && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium text-green-800">Root Cause & Resolution:</p>
                        <p className="text-sm text-green-700">{incident.root_cause}</p>
                        {incident.corrective_action && (
                          <p className="text-sm text-green-700 mt-1">
                            <strong>Corrective Action:</strong> {incident.corrective_action}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4 flex space-x-2">
                    <button
                      onClick={() => setSelectedIncident(incident)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    
                    {incident.status === 'open' && (
                      <button
                        onClick={() => updateIncidentStatus(incident.id, 'investigating')}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                        title="Start Investigation"
                      >
                        Start Investigation
                      </button>
                    )}
                    
                    {incident.status === 'investigating' && (
                      <button
                        onClick={() => {
                          setSelectedIncident(incident);
                          setResolutionData({ rootCause: '', correctiveAction: '' });
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Resolve"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Incident Detail/Resolution Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Incident Details</h3>
                <button
                  onClick={() => {
                    setSelectedIncident(null);
                    setResolutionData({ rootCause: '', correctiveAction: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ExclamationTriangleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Incident Type</label>
                    <p className="text-gray-900">{selectedIncident.incident_type.replace('_', ' ')}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                    <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(selectedIncident.severity)}`}>
                      {selectedIncident.severity}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedIncident.status)}`}>
                      {selectedIncident.status}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reported by</label>
                    <p className="text-gray-900">{selectedIncident.profiles.full_name} ({selectedIncident.profiles.email})</p>
                  </div>

                  {selectedIncident.devices && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Related Device</label>
                      <p className="text-gray-900">
                        {selectedIncident.devices.name} 
                        {selectedIncident.devices.model && ` (${selectedIncident.devices.model})`}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Occurred At</label>
                    <p className="text-gray-900">{format(new Date(selectedIncident.occurred_at), 'PPP pp')}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedIncident.description}</p>
                  </div>

                  {selectedIncident.impact_assessment && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Impact Assessment</label>
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedIncident.impact_assessment}</p>
                    </div>
                  )}

                  {selectedIncident.immediate_action_taken && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Immediate Action Taken</label>
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedIncident.immediate_action_taken}</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedIncident.status === 'investigating' && (
                <div className="mt-6 space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">Resolution Details</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Root Cause Analysis *
                    </label>
                    <textarea
                      value={resolutionData.rootCause}
                      onChange={(e) => setResolutionData(prev => ({ ...prev, rootCause: e.target.value }))}
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe the root cause of the incident..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Corrective Action *
                    </label>
                    <textarea
                      value={resolutionData.correctiveAction}
                      onChange={(e) => setResolutionData(prev => ({ ...prev, correctiveAction: e.target.value }))}
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe the corrective actions taken..."
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                {selectedIncident.status === 'investigating' && (
                  <button
                    onClick={() => updateIncidentStatus(selectedIncident.id, 'resolved')}
                    disabled={!resolutionData.rootCause.trim() || !resolutionData.correctiveAction.trim()}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Resolve Incident
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentManagement;