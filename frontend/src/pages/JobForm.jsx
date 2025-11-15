import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import { jobAPI } from '../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { FaBuilding, FaUser, FaPhone, FaBriefcase, FaDollarSign, FaCalendar, FaArrowRight, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';

const JobForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    companyName: '',
    companyOwnerName: '',
    contactNumber: '',
    initialHourlyRate: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      fetchJob();
    }
  }, [id]);

  const fetchJob = async () => {
    try {
      const response = await jobAPI.getJob(id);
      const job = response.data.job;
      setFormData({
        title: job.title,
        companyName: job.companyName,
        companyOwnerName: job.companyOwnerName,
        contactNumber: job.contactNumber,
        initialHourlyRate: '', // Not editable in edit mode
      });
    } catch (error) {
      toast.error('Failed to fetch job');
      navigate('/jobs');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const canProceedToStep2 = () => {
    return formData.title && formData.companyName && formData.companyOwnerName && formData.contactNumber;
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (canProceedToStep2()) {
      setCurrentStep(2);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        await jobAPI.updateJob(id, formData);
        toast.success('✅ Job updated successfully!');
      } else {
        // Convert hourly rate to cents
        const dataToSend = {
          ...formData,
          initialHourlyRate: Math.round(parseFloat(formData.initialHourlyRate) * 100),
        };
        await jobAPI.createJob(dataToSend);
        toast.success('🎉 Job created successfully!');
      }
      navigate('/jobs');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save job');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  // For edit mode, skip step system
  if (isEdit) {
  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 sm:px-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Job</h1>

        <form onSubmit={handleSubmit} className="card space-y-6">
          <div>
            <label htmlFor="title" className="label">
                  Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              className="input"
              placeholder="e.g., Frontend Developer"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="companyName" className="label">
                  Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              required
              className="input"
              placeholder="e.g., Acme Corp"
              value={formData.companyName}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="companyOwnerName" className="label">
                  Contact Person <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="companyOwnerName"
              name="companyOwnerName"
              required
              className="input"
              placeholder="e.g., John Doe"
              value={formData.companyOwnerName}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="contactNumber" className="label">
                  Contact Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="contactNumber"
              name="contactNumber"
              required
              className="input"
                  placeholder="e.g., +91 98765 43210"
              value={formData.contactNumber}
              onChange={handleChange}
            />
          </div>

              <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn btn-primary"
            >
                  {loading ? 'Updating...' : 'Update Job'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/jobs')}
              className="flex-1 btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
          </motion.div>
        </div>
      </Layout>
    );
  }

  // Create mode - 2-step form
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Job</h1>
          <p className="text-gray-600 mb-8">Let's set up your new job in just 2 simple steps</p>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between max-w-md mx-auto">
              <div className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {currentStep > 1 ? <FaCheckCircle /> : '1'}
                </div>
                <div className="flex-1 mx-2">
                  <div className={`h-2 rounded-full ${
                    currentStep >= 2 ? 'bg-primary-600' : 'bg-gray-300'
                  }`}></div>
                </div>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
            </div>
            <div className="flex justify-between max-w-md mx-auto mt-2">
              <span className={`text-sm font-semibold ${currentStep === 1 ? 'text-primary-600' : 'text-gray-600'}`}>
                Company Info
              </span>
              <span className={`text-sm font-semibold ${currentStep === 2 ? 'text-primary-600' : 'text-gray-600'}`}>
                Rate Setup
              </span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                onSubmit={handleNextStep}
                className="card space-y-6"
              >
                <div className="info-box mb-6">
                  <p className="text-sm text-blue-800 font-semibold mb-1">
                    📋 Step 1: Company Information
                  </p>
                  <p className="text-sm text-blue-700">
                    Tell us about the company you're working with
                  </p>
                </div>

                <div>
                  <label htmlFor="title" className="label flex items-center gap-2">
                    <FaBriefcase className="text-primary-600" />
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    className="input"
                    placeholder="e.g., Frontend Developer, Content Writer"
                    value={formData.title}
                    onChange={handleChange}
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="companyName" className="label flex items-center gap-2">
                    <FaBuilding className="text-primary-600" />
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    required
                    className="input"
                    placeholder="e.g., Acme Corp, TechStart Inc"
                    value={formData.companyName}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="companyOwnerName" className="label flex items-center gap-2">
                    <FaUser className="text-primary-600" />
                    Contact Person <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="companyOwnerName"
                    name="companyOwnerName"
                    required
                    className="input"
                    placeholder="e.g., John Doe"
                    value={formData.companyOwnerName}
                    onChange={handleChange}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    The main person you'll be working with
                  </p>
                </div>

                <div>
                  <label htmlFor="contactNumber" className="label flex items-center gap-2">
                    <FaPhone className="text-primary-600" />
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="contactNumber"
                    name="contactNumber"
                    required
                    className="input"
                    placeholder="e.g., +91 98765 43210"
                    value={formData.contactNumber}
                    onChange={handleChange}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={!canProceedToStep2()}
                    className="flex-1 btn btn-primary flex items-center justify-center gap-2"
                  >
                    Next: Set Hourly Rate <FaArrowRight />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/jobs')}
                    className="flex-1 btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </motion.form>
            )}

            {currentStep === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                onSubmit={handleSubmit}
                className="card space-y-6"
              >
                <div className="success-box mb-6">
                  <p className="text-sm text-green-800 font-semibold mb-1">
                    ✅ Step 2: Rate Setup
                  </p>
                  <p className="text-sm text-green-700">
                    Set your hourly rate for this job
                  </p>
                </div>

                <div>
                  <label htmlFor="initialHourlyRate" className="label flex items-center gap-2">
                    <FaDollarSign className="text-primary-600" />
                    Hourly Rate (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold">
                      ₹
                    </span>
                    <input
                      type="number"
                      id="initialHourlyRate"
                      name="initialHourlyRate"
                      required
                      step="0.01"
                      min="0"
                      className="input pl-10"
                      placeholder="500.00"
                      value={formData.initialHourlyRate}
                      onChange={handleChange}
                      autoFocus
                    />
                  </div>
                  <div className="info-box mt-3">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Good to know:</strong> You can change this rate anytime. The salary will be calculated correctly even if rates change later.
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <FaCalendar className="text-gray-600" />
                    <p className="font-semibold text-gray-900">Effective From</p>
                  </div>
                  <p className="text-gray-700">
                    <strong>{format(new Date(), 'MMMM dd, yyyy')}</strong> (Today)
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    This rate will apply to all time entries starting from today
                  </p>
                </div>

                {formData.initialHourlyRate && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-primary-50 p-4 rounded-xl border-2 border-primary-200"
                  >
                    <p className="text-sm text-primary-700 mb-1">Example calculation:</p>
                    <p className="text-lg text-primary-900">
                      <strong>8 hours</strong> of work = <strong>₹{(parseFloat(formData.initialHourlyRate) * 8).toFixed(2)}</strong>
                    </p>
                  </motion.div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="flex-1 btn btn-secondary flex items-center justify-center gap-2"
                  >
                    <FaArrowLeft /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.initialHourlyRate}
                    className="flex-1 btn btn-primary"
                  >
                    {loading ? 'Creating Job...' : 'Create Job'}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </Layout>
  );
};

export default JobForm;

