import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
// import { supabase } from '../../lib/supabase'; // Using Firebase instead
import { requestTypeService, departmentService } from '../../services/firebaseService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface RequestType {
  id: string;
  name: string;
  description: string;
}

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'issue' | 'equipment' | 'emergency';
  onSuccess: () => void;
}

const RequestModal: React.FC<RequestModalProps> = ({ isOpen, onClose, type, onSuccess }) => {
  const { profile } = useAuth();
  const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    requestTypeId: '',
    departmentId: '',
    title: '',
    description: '',
    priority: 'medium',
    urgencyLevel: 'routine',
    patientImpact: false,
    estimatedDowntime: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchRequestTypes();
      fetchDepartments();
      // Reset form
      setFormData({
        requestTypeId: '',
        departmentId: '',
        title: '',
        description: '',
        priority: 'medium',
        urgencyLevel: type === 'emergency' ? 'emergency' : 'routine',
        patientImpact: type === 'emergency',
        estimatedDowntime: '',
      });
    }
  }, [isOpen, type]);

  const fetchRequestTypes = async () => {
    try {
      const data = await requestTypeService.getAllRequestTypes();

      if (data) {
        setRequestTypes(data);
        // Pre-select appropriate request type based on modal type
        const defaultType = data.find(rt => {
          if (type === 'emergency') return rt.name.includes('Emergency');
          if (type === 'issue') return rt.name.includes('Failure') || rt.name.includes('Issue');
          return rt.name.includes('New Equipment');
        });
        if (defaultType) {
          setFormData(prev => ({ ...prev, requestTypeId: defaultType.id }));
        }
      }
    } catch (error) {
      console.error('Error fetching request types:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await departmentService.getAllDepartments();

      if (data) {
        setDepartments(data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    try {
      // Import requestService at the top of the file
      const { requestService } = await import('../../services/firebaseService');
      
      await requestService.createRequest({
        userId: profile.id,
        requestTypeId: formData.requestTypeId,
        departmentId: formData.departmentId || null,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        urgencyLevel: formData.urgencyLevel,
        patientImpact: formData.patientImpact,
        estimatedDowntime: formData.estimatedDowntime || null,
      });

      const message = type === 'emergency' 
        ? 'Emergency request submitted! IT team will be notified immediately.'
        : 'Request submitted successfully!';
      toast.success(message);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating request:', error);
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const getModalTitle = () => {
    switch (type) {
      case 'emergency':
        return 'Emergency Request';
      case 'issue':
        return 'Report an Issue';
      default:
        return 'Request Equipment';
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
              <Dialog.Panel className={`w-full max-w-lg transform rounded-2xl bg-white p-6 shadow-xl transition-all ${
                type === 'emergency' ? 'border-2 border-red-500' : ''
              }`}>
                <Dialog.Title as="div" className="flex items-center justify-between mb-6">
                  <h3 className={`text-lg font-medium ${
                    type === 'emergency' ? 'text-red-900' : 'text-gray-900'
                  }`}>
                    {getModalTitle()}
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </Dialog.Title>

                {type === 'emergency' && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800 font-medium">
                      ⚠️ Emergency Request - This will be prioritized and IT staff will be notified immediately.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Request Type *
                      </label>
                      <select
                        value={formData.requestTypeId}
                        onChange={(e) => setFormData(prev => ({ ...prev, requestTypeId: e.target.value }))}
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select a type</option>
                        {requestTypes.map((rt) => (
                          <option key={rt.id} value={rt.id}>
                            {rt.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                      </label>
                      <select
                        value={formData.departmentId}
                        onChange={(e) => setFormData(prev => ({ ...prev, departmentId: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select department</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name} ({dept.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Brief description of your request"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      required
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Provide detailed information about your request"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Urgency Level
                      </label>
                      <select
                        value={formData.urgencyLevel}
                        onChange={(e) => setFormData(prev => ({ ...prev, urgencyLevel: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={type === 'emergency'}
                      >
                        <option value="routine">Routine</option>
                        <option value="urgent">Urgent</option>
                        <option value="emergency">Emergency</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Downtime
                    </label>
                    <input
                      type="text"
                      value={formData.estimatedDowntime}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimatedDowntime: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 2 hours, 1 day, ongoing"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="patientImpact"
                      checked={formData.patientImpact}
                      onChange={(e) => setFormData(prev => ({ ...prev, patientImpact: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="patientImpact" className="ml-2 block text-sm text-gray-700">
                      This issue may impact patient care
                    </label>
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
                      className={`flex-1 font-medium py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 ${
                        type === 'emergency'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                      }`}
                    >
                      {loading ? 'Submitting...' : type === 'emergency' ? 'Submit Emergency Request' : 'Submit Request'}
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

export default RequestModal;