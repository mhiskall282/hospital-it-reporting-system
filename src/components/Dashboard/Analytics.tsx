import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
// import { supabase } from '../../lib/supabase'; // Commented out - using Firebase
import { deviceService, requestService } from '../../services/firebaseService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface AnalyticsData {
  requestsByType: { type: string; count: number }[];
  requestsByStatus: { status: string; count: number }[];
  devicesByStatus: { status: string; count: number }[];
  requestsByUrgency: { urgency: string; count: number }[];
  requestsByDepartment: { department: string; count: number }[];
  incidentsBySeverity: { severity: string; count: number }[];
  complianceStatus: { status: string; count: number }[];
  requestsOverTime: { date: string; count: number }[];
}

const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData>({
    requestsByType: [],
    requestsByStatus: [],
    devicesByStatus: [],
    requestsByUrgency: [],
    requestsByDepartment: [],
    incidentsBySeverity: [],
    complianceStatus: [],
    requestsOverTime: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch data from Firebase
      const [devices, requests] = await Promise.all([
        deviceService.getAllDevices(),
        requestService.getAllRequests(),
      ]);

      // Process requests by type
      const requestsByType = requests.reduce((acc: any, req: any) => {
        const typeName = req.requestType || 'General Request';
        acc[typeName] = (acc[typeName] || 0) + 1;
        return acc;
      }, {});

      // Process requests by status
      const requestsByStatus = requests.reduce((acc: any, req: any) => {
        acc[req.status] = (acc[req.status] || 0) + 1;
        return acc;
      }, {});

      // Process requests by urgency
      const requestsByUrgency = requests.reduce((acc: any, req: any) => {
        const urgency = req.urgencyLevel || 'routine';
        acc[urgency] = (acc[urgency] || 0) + 1;
        return acc;
      }, {});

      // Process devices by status
      const devicesByStatus = devices.reduce((acc: any, device: any) => {
        acc[device.status] = (acc[device.status] || 0) + 1;
        return acc;
      }, {});

      // Process compliance status
      const complianceStatus = devices.reduce((acc: any, device: any) => {
        const status = device.complianceStatus || 'compliant';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      setData({
        requestsByType: Object.entries(requestsByType || {}).map(([type, count]) => ({
          type,
          count: count as number,
        })),
        requestsByStatus: Object.entries(requestsByStatus || {}).map(([status, count]) => ({
          status,
          count: count as number,
        })),
        requestsByUrgency: Object.entries(requestsByUrgency || {}).map(([urgency, count]) => ({
          urgency,
          count: count as number,
        })),
        requestsByDepartment: [], // TODO: Implement departments in Firebase
        devicesByStatus: Object.entries(devicesByStatus || {}).map(([status, count]) => ({
          status,
          count: count as number,
        })),
        complianceStatus: Object.entries(complianceStatus || {}).map(([status, count]) => ({
          status,
          count: count as number,
        })),
        incidentsBySeverity: [], // TODO: Implement incidents in Firebase
        requestsOverTime: [], // TODO: Implement time-based analytics
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const requestTypeChart = {
    labels: data.requestsByType.map(item => item.type),
    datasets: [
      {
        label: 'Request Count',
        data: data.requestsByType.map(item => item.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(99, 102, 241, 0.8)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(99, 102, 241, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const requestUrgencyChart = {
    labels: data.requestsByUrgency.map(item => item.urgency),
    datasets: [
      {
        data: data.requestsByUrgency.map(item => item.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)', // routine
          'rgba(245, 158, 11, 0.8)', // urgent
          'rgba(239, 68, 68, 0.8)', // emergency
          'rgba(220, 38, 38, 0.8)', // critical
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(220, 38, 38, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const departmentChart = {
    labels: data.requestsByDepartment.map(item => item.department),
    datasets: [
      {
        label: 'Requests by Department',
        data: data.requestsByDepartment.map(item => item.count),
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 2,
      },
    ],
  };

  const requestStatusChart = {
    labels: data.requestsByStatus.map(item => item.status.replace('_', ' ')),
    datasets: [
      {
        data: data.requestsByStatus.map(item => item.count),
        backgroundColor: [
          'rgba(245, 158, 11, 0.8)', // pending
          'rgba(59, 130, 246, 0.8)', // in_progress
          'rgba(16, 185, 129, 0.8)', // completed
          'rgba(239, 68, 68, 0.8)', // rejected
        ],
        borderColor: [
          'rgba(245, 158, 11, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const deviceStatusChart = {
    labels: data.devicesByStatus.map(item => item.status),
    datasets: [
      {
        data: data.devicesByStatus.map(item => item.count),
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)', // active
          'rgba(239, 68, 68, 0.8)', // faulty
          'rgba(245, 158, 11, 0.8)', // maintenance
          'rgba(107, 114, 128, 0.8)', // retired
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(107, 114, 128, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const complianceChart = {
    labels: data.complianceStatus.map(item => item.status),
    datasets: [
      {
        data: data.complianceStatus.map(item => item.count),
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)', // compliant
          'rgba(245, 158, 11, 0.8)', // pending
          'rgba(239, 68, 68, 0.8)', // non-compliant
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const incidentChart = {
    labels: data.incidentsBySeverity.map(item => item.severity),
    datasets: [
      {
        data: data.incidentsBySeverity.map(item => item.count),
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)', // low
          'rgba(245, 158, 11, 0.8)', // medium
          'rgba(249, 115, 22, 0.8)', // high
          'rgba(239, 68, 68, 0.8)', // critical
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(249, 115, 22, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Hospital IT Analytics & Reports</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Requests by Type</h3>
          <div className="h-64">
            <Bar data={requestTypeChart} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Request Urgency Levels</h3>
          <div className="h-64">
            <Doughnut data={requestUrgencyChart} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Requests by Department</h3>
          <div className="h-64">
            <Bar data={departmentChart} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Request Status Distribution</h3>
          <div className="h-64">
            <Doughnut data={requestStatusChart} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Equipment Status Overview</h3>
          <div className="h-64">
            <Doughnut data={deviceStatusChart} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Compliance Status</h3>
          <div className="h-64">
            <Doughnut data={complianceChart} options={chartOptions} />
          </div>
        </div>

        {data.incidentsBySeverity.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Incident Reports by Severity</h3>
            <div className="h-64">
              <Doughnut data={incidentChart} options={chartOptions} />
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Request Trends (Last 7 Days)</h3>
          <div className="h-64">
            {data.requestsOverTime.length > 0 ? (
              <Line 
                data={{
                  labels: data.requestsOverTime.map(item => new Date(item.date).toLocaleDateString()),
                  datasets: [{
                    label: 'Requests',
                    data: data.requestsOverTime.map(item => item.count),
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                  }]
                }} 
                options={chartOptions} 
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No recent requests to display
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;