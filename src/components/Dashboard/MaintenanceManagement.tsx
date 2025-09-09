import React, { useState, useEffect } from 'react';
import { PlusIcon, CalendarIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface MaintenanceSchedule {
  id: string;
  device_id: string;
  maintenance_type: string;
  scheduled_date: string;
  completed_date: string | null;
  technician_id: string | null;
  notes: string | null;
  cost: number | null;
  status: string;
  devices: { name: string; model: string | null };
  profiles: { full_name: string } | null;
}

interface Device {
  id: string;
  name: string;
  model: string | null;
}

interface Technician {
  id: string;
  full_name: string;
}

const MaintenanceManagement: React.FC = () => {
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<MaintenanceSchedule | null>(null);
  const [formData, setFormData] = useState({
    device_id: '',
    maintenance_type: 'preventive',
    scheduled_date: '',
    technician_id: '',
    notes: '',
    cost: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [schedulesResult, devicesResult, techniciansResult] = await Promise.all([
        supabase.from('maintenance_schedules').select(`
          *,
          devices(name, model),
          profiles(full_name)
        `).order('scheduled_date', { ascending: false }),
        supabase.from('devices').select('id, name, model').order('name'),
        supabase.from('profiles').select('id, full_name').eq('role', 'admin').order('full_name'),
      ]);

      if (schedulesResult.data) setSchedules(schedulesResult.data);
      if (devicesResult.data) setDevices(devicesResult.data);
      if (techniciansResult.data) setTechnicians(techniciansResult.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load maintenance data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const scheduleData = {
        device_id: formData.device_id,
        maintenance_type: formData.maintenance_type,
        scheduled_date: formData.scheduled_date,
        technician_id: formData.technician_id || null,
        notes: formData.notes || null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
      };

      if (editingSchedule) {
        const { error } = await supabase
          .from('maintenance_schedules')
          .update(scheduleData)
          .eq('id', editingSchedule.id);
        if (error) throw error;
        toast.success('Maintenance schedule updated successfully');
      } else {
        const { error } = await supabase.from('maintenance_schedules').insert(scheduleData);
        if (error) throw error;
        toast.success('Maintenance schedule created successfully');
      }

      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving maintenance schedule:', error);
      toast.error(error.message || 'Failed to save maintenance schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (scheduleId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'completed') {
        updateData.completed_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('maintenance_schedules')
        .update(updateData)
        .eq('id', scheduleId);

      if (error) throw error;
      toast.success('Maintenance status updated');
      fetchData();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const startEdit = (schedule: MaintenanceSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      device_id: schedule.device_id,
      maintenance_type: schedule.maintenance_type,
      scheduled_date: schedule.scheduled_date,
      technician_id: schedule.technician_id || '',
      notes: schedule.notes || '',
      cost: schedule.cost?.toString() || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingSchedule(null);
    setFormData({
      device_id: '',
      maintenance_type: 'preventive',
      scheduled_date: '',
      technician_id: '',
      notes: '',
      cost: '',
    });
  };

  const getStatusColor = (status: string, scheduledDate: string) => {
    const isOverdue = new Date(scheduledDate) < new Date() && status === 'scheduled';
    
    if (isOverdue) return 'bg-red-100 text-red-700';
    
    switch (status) {
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading && schedules.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Maintenance Management</h2>
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Maintenance Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Schedule Maintenance</span>
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingSchedule ? 'Edit Maintenance Schedule' : 'Schedule New Maintenance'}
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
                  Maintenance Type
                </label>
                <select
                  value={formData.maintenance_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, maintenance_type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="preventive">Preventive</option>
                  <option value="corrective">Corrective</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date *
                </label>
                <input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Technician
                </label>
                <select
                  value={formData.technician_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, technician_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select technician</option>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>
                      {tech.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Cost
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
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
                  placeholder="Maintenance details, special instructions, etc."
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
                {loading ? 'Saving...' : editingSchedule ? 'Update Schedule' : 'Create Schedule'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Maintenance Schedules Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Device
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scheduled Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Technician
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
              {schedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {schedule.devices.name}
                      </div>
                      {schedule.devices.model && (
                        <div className="text-sm text-gray-500">{schedule.devices.model}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                      {schedule.maintenance_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                      {format(new Date(schedule.scheduled_date), 'MMM dd, yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {schedule.profiles?.full_name || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(schedule.status, schedule.scheduled_date)}`}>
                      {schedule.status === 'scheduled' && new Date(schedule.scheduled_date) < new Date() 
                        ? 'Overdue' 
                        : schedule.status.replace('_', ' ')
                      }
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => startEdit(schedule)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                    >
                      Edit
                    </button>
                    {schedule.status === 'scheduled' && (
                      <button
                        onClick={() => handleStatusUpdate(schedule.id, 'in_progress')}
                        className="text-yellow-600 hover:text-yellow-900 transition-colors"
                      >
                        Start
                      </button>
                    )}
                    {schedule.status === 'in_progress' && (
                      <button
                        onClick={() => handleStatusUpdate(schedule.id, 'completed')}
                        className="text-green-600 hover:text-green-900 transition-colors"
                      >
                        Complete
                      </button>
                    )}
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

export default MaintenanceManagement;