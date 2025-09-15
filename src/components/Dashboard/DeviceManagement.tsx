import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
// import { supabase } from '../../lib/supabase'; // Commented out - using Firebase
import { deviceService, deviceCategoryService, profileService } from '../../services/firebaseService';
import toast from 'react-hot-toast';

interface Device {
  id: string;
  name: string;
  model: string | null;
  serialNumber: string | null;
  status: 'active' | 'faulty' | 'maintenance' | 'retired';
  categoryId: string | null;
  categoryName?: string;
  assignedTo: string | null;
  assignedUserName?: string;
  purchaseDate: string | null;
  warrantyDate: string | null;
  notes: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface User {
  id: string;
  fullName: string;
}

interface DeviceManagementProps {
  onDeviceChange?: () => void;
}

const DeviceManagement: React.FC<DeviceManagementProps> = ({ onDeviceChange }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    serialNumber: '',
    status: 'active' as 'active' | 'faulty' | 'maintenance' | 'retired',
    categoryId: '',
    assignedTo: '',
    purchaseDate: '',
    warrantyDate: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [devicesData, categoriesData, usersData] = await Promise.all([
        deviceService.getAllDevices(),
        deviceCategoryService.getAllCategories(),
        profileService.getAllProfiles(),
      ]);

      if (devicesData) {
        setDevices(devicesData.map((device: any) => ({
          ...device,
          serialNumber: device.serialNumber,
          categoryId: device.categoryId,
          assignedTo: device.assignedTo,
          purchaseDate: device.purchaseDate,
          warrantyDate: device.warrantyDate,
          categoryName: device.categoryName,
          assignedUserName: device.assignedUserName,
        })));
      }

      if (categoriesData) setCategories(categoriesData);
      if (usersData) setUsers(usersData.map((user: any) => ({ id: user.id, fullName: user.fullName })));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const deviceData = {
        name: formData.name,
        model: formData.model || null,
        serialNumber: formData.serialNumber || null,
        status: formData.status,
        categoryId: formData.categoryId || null,
        assignedTo: formData.assignedTo || null,
        purchaseDate: formData.purchaseDate || null,
        warrantyDate: formData.warrantyDate || null,
        notes: formData.notes || null,
      };

      if (editingDevice) {
        await deviceService.updateDevice(editingDevice.id, deviceData);
        toast.success('Device updated successfully');
      } else {
        await deviceService.createDevice(deviceData);
        toast.success('Device created successfully');
      }

      resetForm();
      fetchData();
      onDeviceChange?.();
    } catch (error: any) {
      console.error('Error saving device:', error);
      toast.error(error.message || 'Failed to save device');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (deviceId: string) => {
    if (!confirm('Are you sure you want to delete this device?')) return;

    setLoading(true);
    try {
      await deviceService.deleteDevice(deviceId);

      toast.success('Device deleted successfully');
      fetchData();
      onDeviceChange?.();
    } catch (error: any) {
      console.error('Error deleting device:', error);
      toast.error(error.message || 'Failed to delete device');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      name: device.name,
      model: device.model || '',
      serialNumber: device.serialNumber || '',
      status: device.status,
      categoryId: device.categoryId || '',
      assignedTo: device.assignedTo || '',
      purchaseDate: device.purchaseDate || '',
      warrantyDate: device.warrantyDate || '',
      notes: device.notes || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingDevice(null);
    setFormData({
      name: '',
      model: '',
      serialNumber: '',
      status: 'active',
      categoryId: '',
      assignedTo: '',
      purchaseDate: '',
      warrantyDate: '',
      notes: '',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'faulty':
        return 'bg-red-100 text-red-700';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-700';
      case 'retired':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading && devices.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Device Management</h2>
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
        <h2 className="text-2xl font-bold text-gray-900">Device Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Add Device</span>
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingDevice ? 'Edit Device' : 'Add New Device'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Device Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="faulty">Faulty</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="retired">Retired</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned To
                </label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Not assigned</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Date
                </label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warranty Date
                </label>
                <input
                  type="date"
                  value={formData.warrantyDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, warrantyDate: e.target.value }))}
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
                {loading ? 'Saving...' : editingDevice ? 'Update Device' : 'Create Device'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Devices Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Device
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {devices.map((device) => (
                <tr key={device.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {device.name}
                      </div>
                      {device.model && (
                        <div className="text-sm text-gray-500">{device.model}</div>
                      )}
                      {device.serialNumber && (
                        <div className="text-xs text-gray-400">SN: {device.serialNumber}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {device.categoryName || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(device.status)}`}>
                      {device.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {device.assignedUserName || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => startEdit(device)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(device.id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
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

export default DeviceManagement;