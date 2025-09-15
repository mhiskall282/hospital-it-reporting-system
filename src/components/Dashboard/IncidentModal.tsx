import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
// import { supabase } from '../../lib/supabase'; // Using Firebase instead
import { deviceService, incidentService } from '../../services/firebaseService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Device {
  id: string;
  name: string;
  model: string | null;
}

interface IncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const IncidentModal: React.FC<IncidentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { profile } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [formData, setFormData] = useState({
    deviceId: '',
    incidentType: 'malfunction',
    severity: 'medium',
    description: '',
    impactAssessment: '',
    immediateAction: '',
    occurredAt: new Date().toISOString().slice(0, 16),
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDevices();
      // Reset form
      setFormData({
        deviceId: '',
        incidentType: 'malfunction',
        severity: 'medium',
        description: '',
        impactAssessment: '',
        immediateAction: '',
        occurredAt: new Date().toISOString().slice(0, 16),
      });
    }
  }, [isOpen]);

  const fetchDevices = async () => {
    try {
      const data = await deviceService.getAllDevices();

      if (data) {
        setDevices(data.map((device: any) => ({
          id: device.id,
          name: device.name,
          model: device.model
        })));
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    try {
      await incidentService.createIncident({
        deviceId: formData.deviceId || null,
        reportedBy: profile.id,
        incidentType: formData.incidentType,
        severity: formData.severity,
        description: formData.description,
        impactAssessment: formData.impactAssessment || null,
        immediateActionTaken: formData.immediateAction || null,
        occurredAt: formData.occurredAt,
      });

      toast.success('Incident report submitted successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating incident report:', error);
      toast.error(error.message || 'Failed to submit incident report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform rounded-2xl bg-white p-6 shadow-xl transition-all border-2 border-orange-500">
                <Dialog.Title as="div" className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-orange-900">
                    Report Safety/Security Incident
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </Dialog.Title>

                <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800 font-medium">
                    🚨 Use this form to report safety incidents, security breaches, or critical equipment failures that require immediate attention.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Related Device (Optional)
                      </label>
                      <select
                        value={formData.deviceId}
                        onChange={(e) => setFormData(prev => ({ ...prev, deviceId: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="">Select device (if applicable)</option>
                        {devices.map((device) => (
                          <option key={device.id} value={device.id}>
                            {device.name} {device.model && `(${device.model})`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Incident Type *
                      </label>
                      <select
                        value={formData.incidentType}
                        onChange={(e) => setFormData(prev => ({ ...prev, incidentType: e.target.value }))}
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="malfunction">Equipment Malfunction</option>
                        <option value="safety_issue">Safety Issue</option>
                        <option value="data_breach">Data Breach/Security</option>
                        <option value="downtime">System Downtime</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Severity Level *
                      </label>
                      <select
                        value={formData.severity}
                        onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value }))}
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="low">Low - Minor impact</option>
                        <option value="medium">Medium - Moderate impact</option>
                        <option value="high">High - Significant impact</option>
                        <option value="critical">Critical - Patient safety risk</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        When did this occur? *
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.occurredAt}
                        onChange={(e) => setFormData(prev => ({ ...prev, occurredAt: e.target.value }))}
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Incident Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      required
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Describe what happened in detail..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Impact Assessment
                    </label>
                    <textarea
                      value={formData.impactAssessment}
                      onChange={(e) => setFormData(prev => ({ ...prev, impactAssessment: e.target.value }))}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="What was affected? Patients, staff, operations, data, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Immediate Action Taken
                    </label>
                    <textarea
                      value={formData.immediateAction}
                      onChange={(e) => setFormData(prev => ({ ...prev, immediateAction: e.target.value }))}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="What steps were taken immediately to address the incident?"
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50"
                    >
                      {loading ? 'Submitting...' : 'Submit Incident Report'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default IncidentModal;