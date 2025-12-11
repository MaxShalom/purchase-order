import React, { useState, useEffect } from 'react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { Copy, Mail, Archive, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('new');
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch('/api/submissions');
      const data = await res.json();
      setSubmissions(data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSubmission = async (id, updates) => {
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        fetchSubmissions();
      }
    } catch (error) {
      console.error('Error updating submission:', error);
    }
  };

  const getDaysSinceSent = (dateSent) => {
    return differenceInDays(new Date(), parseISO(dateSent));
  };

  const getStatusColor = (days) => {
    if (days < 7) return 'bg-green-100 text-green-800 border-green-200';
    if (days < 14) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const filteredSubmissions = submissions.filter(sub => {
    if (activeTab === 'new') return sub.status === 'New';
    if (activeTab === 'pending') return sub.status === 'Pending';
    if (activeTab === 'archived') return sub.status === 'Archived';
    return false;
  });

  const groupedSubmissions = filteredSubmissions.reduce((acc, sub) => {
    if (!acc[sub.factory]) acc[sub.factory] = [];
    acc[sub.factory].push(sub);
    return acc;
  }, {});

  const generateEmailTable = (factorySubs) => {
    const tableRows = factorySubs.map(sub => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${sub.styleNumber}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${sub.dateSent}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${sub.sampleType}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${sub.comments || ''}</td>
      </tr>
    `).join('');

    return `
      <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Style</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Date Sent</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Sample Type</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Comment</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `;
  };

  const handleCopyEmail = (factorySubs) => {
    const html = generateEmailTable(factorySubs);
    const blob = new Blob([html], { type: 'text/html' });
    const textBlob = new Blob([html], { type: 'text/plain' });
    const item = new ClipboardItem({
      'text/html': blob,
      'text/plain': textBlob,
    });
    navigator.clipboard.write([item]).then(() => {
      alert('Email table copied to clipboard! You can paste it into your email client.');
    });
  };

  const handleOpenMail = (factorySubs) => {
     // Mailto has limited support for body formatting, so we just provide a hint
     const body = "Please see the table below regarding your submissions:\n\n[PASTE TABLE HERE]\n\n";
     window.location.href = `mailto:?subject=Submission Feedback&body=${encodeURIComponent(body)}`;
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
              </div>
              <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
                {['new', 'pending', 'archived'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`${
                      activeTab === tab
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium capitalize`}
                  >
                    {tab} Submissions
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {Object.keys(groupedSubmissions).length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No {activeTab} submissions found.
          </div>
        ) : (
          Object.entries(groupedSubmissions).map(([factory, subs]) => (
            <div key={factory} className="mb-8">
              <div className="flex items-center justify-between mb-4">
                 <h2 className="text-xl font-semibold text-gray-800 border-l-4 border-blue-500 pl-3">
                  {factory}
                </h2>
                {activeTab === 'pending' && (
                  <div className="flex space-x-2">
                    <button
                        onClick={() => handleCopyEmail(subs)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Table
                    </button>
                    <button
                        onClick={() => handleOpenMail(subs)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <Mail className="h-4 w-4 mr-2" />
                        Draft Email
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {subs.map(sub => {
                    const days = getDaysSinceSent(sub.dateSent);
                    const colorClass = getStatusColor(days);

                    return (
                        <div key={sub.id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
                                        {days} days ago
                                    </span>
                                    <span className="text-xs text-gray-500">{sub.dateSent}</span>
                                </div>

                                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 mb-4">
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">Style</dt>
                                        <dd className="mt-1 text-sm text-gray-900 font-semibold">{sub.styleNumber}</dd>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">Sample Type</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{sub.sampleType}</dd>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">Season/Year</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{sub.season} {sub.year}</dd>
                                    </div>
                                     <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">Tracking</dt>
                                        <dd className="mt-1 text-sm text-gray-900 truncate" title={sub.trackingNumber}>
                                            {sub.shipper} - {sub.trackingNumber}
                                        </dd>
                                    </div>
                                </dl>

                                <div className="mt-4">
                                    <label htmlFor={`comment-${sub.id}`} className="block text-sm font-medium text-gray-700">
                                        Comments
                                    </label>
                                    {activeTab === 'new' ? (
                                        <textarea
                                            id={`comment-${sub.id}`}
                                            rows={3}
                                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                                            placeholder="Enter feedback..."
                                            defaultValue={sub.comments || ''}
                                            onBlur={(e) => updateSubmission(sub.id, { comments: e.target.value })}
                                        />
                                    ) : (
                                        <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md min-h-[4rem]">
                                            {sub.comments || 'No comments'}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-end">
                                {activeTab === 'new' && (
                                    <button
                                        onClick={() => updateSubmission(sub.id, { status: 'Pending' })}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Submit Feedback
                                    </button>
                                )}
                                {activeTab === 'pending' && (
                                    <button
                                        onClick={() => updateSubmission(sub.id, { status: 'Archived' })}
                                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                                    >
                                        <Archive className="h-3 w-3 mr-1" />
                                        Archive
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
