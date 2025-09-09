import React, { useState, useEffect } from 'react';
import { PlusIcon, ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import toast from 'react-hot-toast';

interface ComplianceRecord {
  id: string;
  device_id: string;
  compliance_type: string;
  certificate_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  status: string;
  auditor_name: string | null;
  notes: string | null;
  devices: { name: string; model: string | null };
}

interface Device {
  id: string;
  name: string;
  model: string | null;
}

const ComplianceManagement: React.FC = () => {
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ComplianceRecord | null>(null);
  const [formData, setFormData] = useState({
    device_id: '',
    compliance_type: 'FDA',
    certificate_number: '',
    issue_date: '',
    expiry_date: '',
    auditor_name: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [recordsResult, devicesResult] = await Promise.all([
        supabase.from('compliance_records').select(`
          *,
          devices(name, model)
        `).order('expiry_date', { ascending: true }),
        supabase.from('devices').select('id, name, model').order('name'),
      ]);

      if (recordsResult.data) setRecords(recordsResult.data);
      if (devicesResult.data) setDevices(devicesResult.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const recordData = {
        device_id: formData.device_id,
        compliance_type: formData.compliance_type,
        certificate_number: formData.certificate_number || null,
        issue_date: formData.issue_date || null,
        expiry_date: formData.expiry_date || null,
        auditor_name: formData.auditor_name || null,
        notes: formData.notes || null,
        status: getComplianceStatus(formData.expiry_date),
      };

      if (editingRecord) {
        const { error } = await supabase
          .from('compliance_records')
          .update(recordData)
          .eq('id', editingRecord.id);
        if (error) throw error;
        toast.success('Compliance record updated successfully');
      } else {
        const { error } = await supabase.from('compliance_records').insert(recordData);
        if (error) throw error;
        toast.success('Compliance record created successfully');
      }

      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving compliance record:', error);
      toast.error(error.message || 'Failed to save compliance record');
    } finally {
      setLoading(false);
    }
  };

  const getComplianceStatus = (expiryDate: string | null) => {
    if (!expiryDate) return 'valid';
    
    const expiry = new Date(expiryDate);
    const now = new Date();
    const thirtyDaysFromNow = addDays(now, 30);

    if (isBefore(expiry, now)) return 'expired';
    if (isBefore(expiry, thirtyDaysFromNow)) return 'pending_renewal';
    return 'valid';
  };

  const startEdit = (record: ComplianceRecord) => {
    setEditingRecord(record);
    setFormData({
      device_id: record.device_id,
      compliance_type: record.compliance_type,
      certificate_number: record.certificate_number || '',
      issue_date: record.issue_date || '',
      expiry_date: record.expiry_date || '',
      auditor_name: record.auditor_name || '',
      notes: record.notes || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingRecord(null);
    setFormData({
      device_id: '',
      compliance_type: 'FDA',
      certificate_number: '',
      issue_date: '',
      expiry_date: '',
      auditor_name: '',
      notes: '',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-700';
      case 'pending_renewal':
        return 'bg-yellow-100 text-yellow-700';
      case 'expired':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <ShieldCheckIcon className="h-5 w-5 text-green-500" />;
      case 'pending_renewal':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'expired':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ShieldCheckIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading && records.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Compliance Management</h2>
          <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
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

  const expiredRecords = records.filter(r => r.status === 'expired').length;
  const pendingRenewal = records.filter(r => r.status === 'pending_renewal').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Compliance Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Add Compliance Record</span>
        </button>
      </div>

      {/* Compliance Alerts */}
      {(expiredRecords > 0 || pendingRenewal > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Compliance Alerts</h3>
              <div className="text-red-700 space-y-1">
                {expiredRecords > 0 && (
                  <p>🚨 {expiredRecords} compliance certificates have expired</p>
                )}
                {pendingRenewal > 0 && (
                  <p>⚠️ {pendingRenewal} certificates require renewal within 30 days</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingRecord ? 'Edit Compliance Record' : 'Add New Compliance Record'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Device *
                </label>
                <select
                  value={formData.device_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, device_id: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select device</option>
                  {devices.map(device => (
                    <option key={device.id} value={device.id}>
                      {device.name} {device.model && `(${device.model})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compliance Type *
                </label>
                <select
                  value={formData.compliance_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, compliance_type: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="FDA">FDA</option>
                  <option value="Joint Commission">Joint Commission</option>
                  <option value="HIPAA">HIPAA</option>
                  <option value="State">State Regulation</option>
                  <option value="ISO">ISO Certification</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Certificate Number
                </label>
                <input
                  type="text"
                  value={formData.certificate_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, certificate_number: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Auditor Name
                </label>
                <input
                  type="text"
                  value={formData.auditor_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, auditor_name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional compliance notes or requirements"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                {loading ? 'Saving...' : editingRecord ? 'Update Record' : 'Create Record'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Compliance Records Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Device
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Compliance Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Certificate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {record.devices.name}
                      </div>
                      {record.devices.model && (
                        <div className="text-sm text-gray-500">{record.devices.model}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.compliance_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.certificate_number || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.expiry_date ? format(new Date(record.expiry_date), 'MMM dd, yyyy') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(record.status)}
                      <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                        {record.status.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => startEdit(record)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ComplianceManagement;