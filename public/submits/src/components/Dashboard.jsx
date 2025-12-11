import React, { useState, useEffect } from 'react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { Copy, Mail, Archive, AlertCircle, Package, Clock, CheckCircle, Inbox, LogOut, Truck } from 'lucide-react';

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
    if (days < 7) return 'bg-emerald-100 text-emerald-800 ring-emerald-600/20';
    if (days < 14) return 'bg-amber-100 text-amber-800 ring-amber-600/20';
    return 'bg-rose-100 text-rose-800 ring-rose-600/20';
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
        <td style="border: 1px solid #e2e8f0; padding: 12px; color: #1e293b;">${sub.styleNumber}</td>
        <td style="border: 1px solid #e2e8f0; padding: 12px; color: #1e293b;">${sub.dateSent}</td>
        <td style="border: 1px solid #e2e8f0; padding: 12px; color: #1e293b;">${sub.sampleType}</td>
        <td style="border: 1px solid #e2e8f0; padding: 12px; color: #1e293b;">${sub.comments || ''}</td>
      </tr>
    `).join('');

    return `
      <table style="border-collapse: collapse; width: 100%; font-family: sans-serif; font-size: 14px;">
        <thead>
          <tr style="background-color: #f8fafc;">
            <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left; color: #475569; font-weight: 600;">Style</th>
            <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left; color: #475569; font-weight: 600;">Date Sent</th>
            <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left; color: #475569; font-weight: 600;">Sample Type</th>
            <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left; color: #475569; font-weight: 600;">Comment</th>
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
     const body = "Please see the table below regarding your submissions:\n\n[PASTE TABLE HERE]\n\n";
     window.location.href = `mailto:?subject=Submission Feedback&body=${encodeURIComponent(body)}`;
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">

      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col justify-between">
        <div>
            <div className="h-20 flex items-center px-6 border-b border-slate-800">
                <Package className="h-6 w-6 text-indigo-400 mr-3" />
                <span className="text-lg font-bold tracking-tight">Admin<span className="text-indigo-400">Panel</span></span>
            </div>
            <div className="p-4 space-y-1">
                {[
                    { id: 'new', label: 'New Submissions', icon: Inbox },
                    { id: 'pending', label: 'Pending Review', icon: Clock },
                    { id: 'archived', label: 'Archived', icon: Archive }
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                            activeTab === item.id
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                        <item.icon className={`h-5 w-5 mr-3 ${activeTab === item.id ? 'text-white' : 'text-slate-500'}`} />
                        {item.label}
                    </button>
                ))}
            </div>
        </div>
        <div className="p-4 border-t border-slate-800">
             <button onClick={() => window.location.reload()} className="w-full flex items-center px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
                <LogOut className="h-4 w-4 mr-3" />
                Sign Out
             </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shadow-sm z-10">
            <h2 className="text-xl font-bold text-slate-800 capitalize">{activeTab.replace('-', ' ')} Submissions</h2>
            <div className="flex items-center space-x-4">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs border border-indigo-200">
                    JD
                </div>
            </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
            {Object.keys(groupedSubmissions).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                    <Inbox className="h-12 w-12 text-slate-300" />
                </div>
                <p className="text-lg font-medium">No {activeTab} submissions found.</p>
                <p className="text-sm">New items will appear here.</p>
            </div>
            ) : (
            Object.entries(groupedSubmissions).map(([factory, subs]) => (
                <div key={factory} className="mb-10 last:mb-0">
                <div className="flex items-center justify-between mb-5 sticky top-0 bg-slate-50/95 backdrop-blur py-2 z-10 border-b border-slate-200/50">
                    <div className="flex items-center">
                        <div className="w-1 h-6 bg-indigo-500 rounded-full mr-3"></div>
                        <h2 className="text-lg font-bold text-slate-800">{factory}</h2>
                        <span className="ml-3 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
                            {subs.length} items
                        </span>
                    </div>
                    {activeTab === 'pending' && (
                    <div className="flex space-x-3">
                        <button
                            onClick={() => handleCopyEmail(subs)}
                            className="inline-flex items-center px-3 py-1.5 border border-slate-200 shadow-sm text-xs font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                        >
                            <Copy className="h-3.5 w-3.5 mr-2" />
                            Copy Table
                        </button>
                        <button
                            onClick={() => handleOpenMail(subs)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                        >
                            <Mail className="h-3.5 w-3.5 mr-2" />
                            Draft Email
                        </button>
                    </div>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {subs.map(sub => {
                        const days = getDaysSinceSent(sub.dateSent);
                        const colorClass = getStatusColor(days);

                        return (
                            <div key={sub.id} className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all duration-300 flex flex-col">
                                <div className="p-5 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ring-1 ring-inset ${colorClass}`}>
                                            <Clock className="w-3 h-3 mr-1" />
                                            {days} days ago
                                        </div>
                                        <span className="text-xs font-medium text-slate-400">{sub.dateSent}</span>
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-900 mb-1">{sub.styleNumber}</h3>
                                    <p className="text-sm text-slate-500 mb-4">{sub.season} {sub.year} • {sub.sampleType}</p>

                                    <div className="space-y-3 border-t border-slate-100 pt-3">
                                        <div className="flex items-center text-xs text-slate-600">
                                            <Truck className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                            <span className="font-medium mr-1">{sub.shipper}</span>
                                            <span className="text-slate-400 truncate max-w-[100px]" title={sub.trackingNumber}>{sub.trackingNumber}</span>
                                        </div>
                                    </div>

                                    <div className="mt-5">
                                        <label htmlFor={`comment-${sub.id}`} className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                            Internal Feedback
                                        </label>
                                        {activeTab === 'new' ? (
                                            <textarea
                                                id={`comment-${sub.id}`}
                                                rows={3}
                                                className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm p-3 placeholder-slate-400 bg-slate-50 focus:bg-white transition-all resize-none"
                                                placeholder="Write your feedback here..."
                                                defaultValue={sub.comments || ''}
                                                onBlur={(e) => updateSubmission(sub.id, { comments: e.target.value })}
                                            />
                                        ) : (
                                            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 border border-slate-100 min-h-[4rem]">
                                                {sub.comments || <span className="text-slate-400 italic">No comments provided.</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-slate-50/50 px-5 py-3 border-t border-slate-100 rounded-b-xl flex justify-end">
                                    {activeTab === 'new' && (
                                        <button
                                            onClick={() => updateSubmission(sub.id, { status: 'Pending' })}
                                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow transition-all"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Submit Review
                                        </button>
                                    )}
                                    {activeTab === 'pending' && (
                                        <button
                                            onClick={() => updateSubmission(sub.id, { status: 'Archived' })}
                                            className="inline-flex items-center px-3 py-1.5 border border-slate-200 text-xs font-medium rounded-md text-slate-600 bg-white hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                                        >
                                            <Archive className="h-3.5 w-3.5 mr-1.5" />
                                            Archive
                                        </button>
                                    )}
                                     {activeTab === 'archived' && (
                                        <span className="text-xs text-slate-400 italic">Archived</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                </div>
            ))
            )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
