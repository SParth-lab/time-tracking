import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { jobAPI } from '../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [rateHistory, setRateHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRateForm, setShowRateForm] = useState(false);
  const [newRate, setNewRate] = useState({
    hourlyRate: '',
    effectiveAt: new Date().toISOString().slice(0, 16),
  });

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      const response = await jobAPI.getJob(id);
      setJob(response.data.job);
      setRateHistory(response.data.job.rateHistory || []);
    } catch (error) {
      toast.error('Failed to fetch job details');
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRateChange = async (e) => {
    e.preventDefault();

    try {
      const dataToSend = {
        hourlyRate: Math.round(parseFloat(newRate.hourlyRate) * 100),
        effectiveAt: new Date(newRate.effectiveAt).toISOString(),
      };

      await jobAPI.addRateChange(id, dataToSend);
      toast.success('Rate change added successfully');
      setShowRateForm(false);
      setNewRate({
        hourlyRate: '',
        effectiveAt: new Date().toISOString().slice(0, 16),
      });
      fetchJobDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add rate change');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
          <div className="space-x-2">
            <Link to={`/jobs/${id}/edit`} className="btn btn-primary">
              Edit Job
            </Link>
            <Link to="/jobs" className="btn btn-secondary">
              Back to Jobs
            </Link>
          </div>
        </div>

        {/* Job Details */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Company Name</p>
              <p className="text-lg font-medium text-gray-900">{job.companyName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Company Owner</p>
              <p className="text-lg font-medium text-gray-900">{job.companyOwnerName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Contact Number</p>
              <p className="text-lg font-medium text-gray-900">{job.contactNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span
                className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
                  job.active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {job.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Rate History */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Rate History</h2>
            <button
              onClick={() => setShowRateForm(!showRateForm)}
              className="btn btn-primary"
            >
              {showRateForm ? 'Cancel' : '+ Add Rate Change'}
            </button>
          </div>

          {/* Add Rate Form */}
          {showRateForm && (
            <form onSubmit={handleAddRateChange} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Hourly Rate (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="input"
                    placeholder="e.g., 600.00"
                    value={newRate.hourlyRate}
                    onChange={(e) =>
                      setNewRate({ ...newRate, hourlyRate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="label">Effective Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    className="input"
                    value={newRate.effectiveAt}
                    onChange={(e) =>
                      setNewRate({ ...newRate, effectiveAt: e.target.value })
                    }
                  />
                </div>
              </div>
              <button type="submit" className="mt-4 btn btn-primary">
                Add Rate Change
              </button>
            </form>
          )}

          {/* Rate History Table */}
          {rateHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No rate history available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hourly Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Effective From
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Changed By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rateHistory.map((rate) => (
                    <tr key={rate._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{(rate.hourlyRate / 100).toFixed(2)}/hr
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(rate.effectiveAt), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {rate.changedBy?.firstName} {rate.changedBy?.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(rate.createdAt), 'MMM dd, yyyy HH:mm')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default JobDetail;

