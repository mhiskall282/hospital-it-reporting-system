import React, { useState } from 'react';
import { 
  PlusIcon, 
  WrenchScrewdriverIcon, 
  ComputerDesktopIcon,
  ExclamationTriangleIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

interface FloatingActionButtonProps {
  onNewRequest: () => void;
  onReportIssue: () => void;
  onReportIncident: () => void;
  onEmergencyRequest: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ 
  onNewRequest, 
  onReportIssue,
  onReportIncident,
  onEmergencyRequest
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAdmin } = useAuth();

  const actions = [
    {
      label: 'Emergency Request',
      icon: HeartIcon,
      onClick: onEmergencyRequest,
      className: 'bg-red-600 hover:bg-red-700 text-white animate-pulse',
    },
    {
      label: 'Report Incident',
      icon: ExclamationTriangleIcon,
      onClick: onReportIncident,
      className: 'bg-orange-500 hover:bg-orange-600 text-white',
    },
    {
      label: 'Report Issue',
      icon: WrenchScrewdriverIcon,
      onClick: onReportIssue,
      className: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    },
    {
      label: 'Request Equipment',
      icon: ComputerDesktopIcon,
      onClick: onNewRequest,
      className: 'bg-blue-500 hover:bg-blue-600 text-white',
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="flex flex-col-reverse items-end space-y-reverse space-y-3">
        {isOpen && actions.map((action, index) => (
          <button
            key={index}
            onClick={() => {
              action.onClick();
              setIsOpen(false);
            }}
            className={`${action.className} p-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 opacity-0 animate-fade-in`}
            style={{
              animationDelay: `${index * 100}ms`,
              animationFillMode: 'forwards',
            }}
            title={action.label}
          >
            <action.icon className="h-5 w-5" />
          </button>
        ))}
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform transition-all duration-200 ${
            isOpen ? 'rotate-45' : 'hover:scale-105'
          }`}
        >
          <PlusIcon className="h-6 w-6" />
        </button>
      </div>
      
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default FloatingActionButton;