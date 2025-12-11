import React, { useState } from 'react';
import { Plus, Trash2, Send } from 'lucide-react';
import { format, addMonths } from 'date-fns';

const SubmissionsForm = () => {
  const [factoryName, setFactoryName] = useState('');
  const [submissions, setSubmissions] = useState([
    {
      styleNumber: '',
      season: 'Spring',
      year: new Date().getFullYear(),
      dateSent: format(new Date(), 'yyyy-MM-dd'),
      sampleType: 'Lab Dip',
      shipper: 'DHL',
      otherShipper: '',
      trackingNumber: ''
    }
  ]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const defaultYear = new Date().getFullYear();
  // Requirement: Year default to the year in 3 months from now
  const futureYear = addMonths(new Date(), 3).getFullYear();

  const handleAddRow = () => {
    setSubmissions([
      ...submissions,
      {
        styleNumber: '',
        season: 'Spring',
        year: futureYear,
        dateSent: format(new Date(), 'yyyy-MM-dd'),
        sampleType: 'Lab Dip',
        shipper: 'DHL',
        otherShipper: '',
        trackingNumber: ''
      }
    ]);
  };

  const handleRemoveRow = (index) => {
    const newSubmissions = [...submissions];
    newSubmissions.splice(index, 1);
    setSubmissions(newSubmissions);
  };

  const handleChange = (index, field, value) => {
    const newSubmissions = [...submissions];
    newSubmissions[index][field] = value;
    setSubmissions(newSubmissions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!factoryName) {
        alert("Please enter a Factory Name");
        return;
    }
    setLoading(true);

    const payload = submissions.map(sub => ({
      factory: factoryName,
      styleNumber: sub.styleNumber,
      season: sub.season,
      year: sub.year,
      dateSent: sub.dateSent,
      sampleType: sub.sampleType,
      shipper: sub.shipper === 'Other' ? sub.otherShipper : sub.shipper,
      trackingNumber: sub.trackingNumber,
      status: 'New'
    }));

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        alert("Failed to submit");
      }
    } catch (error) {
      console.error(error);
      alert("Error submitting");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Submission Successful!</h2>
          <p className="text-gray-600 mb-6">Thank you for updating us with your samples. Your submission has been recorded.</p>
          <button
            onClick={() => {
              setSubmitted(false);
              setSubmissions([{
                styleNumber: '',
                season: 'Spring',
                year: futureYear,
                dateSent: format(new Date(), 'yyyy-MM-dd'),
                sampleType: 'Lab Dip',
                shipper: 'DHL',
                otherShipper: '',
                trackingNumber: ''
              }]);
              setFactoryName('');
            }}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Submit more samples
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight sm:text-4xl">
            Factory Submission Portal
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            Please report your sample, lab dip, and strike off submissions below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Factory Name</label>
            <input
              type="text"
              required
              value={factoryName}
              onChange={(e) => setFactoryName(e.target.value)}
              className="block w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              placeholder="Enter your factory name"
            />
          </div>

          <div className="space-y-4">
            {submissions.map((sub, index) => (
              <div key={index} className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100 transition-all hover:shadow-xl">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Submission #{index + 1}</h3>
                  {submissions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(index)}
                      className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="p-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Style Number */}
                  <div className="sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700">Style Number</label>
                    <input
                      type="text"
                      required
                      value={sub.styleNumber}
                      onChange={(e) => handleChange(index, 'styleNumber', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    />
                  </div>

                  {/* Season */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Season</label>
                    <select
                      value={sub.season}
                      onChange={(e) => handleChange(index, 'season', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    >
                      <option>Spring</option>
                      <option>Fall</option>
                    </select>
                  </div>

                  {/* Year */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Year</label>
                    <input
                      type="number"
                      required
                      value={sub.year}
                      onChange={(e) => handleChange(index, 'year', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    />
                  </div>

                  {/* Date Sent */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date Sent</label>
                    <input
                      type="date"
                      required
                      value={sub.dateSent}
                      onChange={(e) => handleChange(index, 'dateSent', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    />
                  </div>

                  {/* Sample Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sample Type</label>
                    <select
                      value={sub.sampleType}
                      onChange={(e) => handleChange(index, 'sampleType', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    >
                      <option>Lab Dip</option>
                      <option>Strike Off</option>
                      <option>PP Sample</option>
                      <option>TOP Sample</option>
                    </select>
                  </div>

                  {/* Shipper */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Shipper</label>
                    <select
                      value={sub.shipper}
                      onChange={(e) => handleChange(index, 'shipper', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    >
                      <option>DHL</option>
                      <option>FedEx</option>
                      <option>UPS</option>
                      <option>Other</option>
                    </select>
                  </div>

                  {/* Other Shipper Input */}
                  {sub.shipper === 'Other' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Specify Shipper</label>
                      <input
                        type="text"
                        required
                        value={sub.otherShipper}
                        onChange={(e) => handleChange(index, 'otherShipper', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                      />
                    </div>
                  )}

                  {/* Tracking Number */}
                  <div className="sm:col-span-1 lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Tracking Number</label>
                    <input
                      type="text"
                      required
                      value={sub.trackingNumber}
                      onChange={(e) => handleChange(index, 'trackingNumber', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 border shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              Add Another Submission
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit All'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmissionsForm;
