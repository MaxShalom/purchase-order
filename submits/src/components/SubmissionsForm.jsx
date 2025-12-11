import React, { useState } from 'react';
import { Plus, Trash2, Send, Copy, Package, Truck, Calendar } from 'lucide-react';
import { format, addMonths } from 'date-fns';

const StyledInput = (props) => (
  <input
    {...props}
    className={`block w-full rounded-md border-slate-200 bg-white border px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm ${props.className || ''}`}
  />
);

const StyledSelect = (props) => (
  <select
    {...props}
    className={`block w-full rounded-md border-slate-200 bg-white border px-3 py-2 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm ${props.className || ''}`}
  />
);

const SubmissionsForm = () => {
  const [factoryName, setFactoryName] = useState('');

  // Year Logic: Default to the year in 3 months from now
  const getFutureYear = () => addMonths(new Date(), 3).getFullYear();

  const createEmptySubmission = () => ({
    styleNumber: '',
    season: 'Spring',
    year: getFutureYear(),
    dateSent: format(new Date(), 'yyyy-MM-dd'),
    sampleType: 'Lab Dip',
    shipper: 'DHL',
    otherShipper: '',
    trackingNumber: ''
  });

  const [submissions, setSubmissions] = useState([createEmptySubmission()]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddRow = () => {
    setSubmissions([...submissions, createEmptySubmission()]);
  };

  const handleDuplicateRow = (index) => {
    const rowToCopy = { ...submissions[index] };
    // Maybe clear unique fields like style number?
    // Usually duplicating means "same shipment, different style", so let's keep shipment details and clear style?
    // User asked "Make it easier to submit multiple styles at once".
    // Let's keep everything but style number as a copy, or just copy exact and let them edit.
    // Exact copy is often fastest.
    setSubmissions([...submissions, rowToCopy]);
  };

  const handleRemoveRow = (index) => {
    if (submissions.length === 1) return;
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-lg w-full ring-1 ring-slate-900/5">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Send className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Submission Received</h2>
          <p className="text-slate-600 mb-8 text-lg">Your samples have been logged successfully.</p>
          <button
            onClick={() => {
              setSubmitted(false);
              setSubmissions([createEmptySubmission()]);
              setFactoryName('');
            }}
            className="text-indigo-600 hover:text-indigo-800 font-semibold px-6 py-2 rounded-full hover:bg-indigo-50 transition-colors"
          >
            Submit Another Batch
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
           <div className="flex items-center space-x-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <Package className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Factory<span className="text-indigo-600">Portal</span>
              </h1>
           </div>

           <div className="flex-1 max-w-md mx-8">
             <input
                type="text"
                required
                value={factoryName}
                onChange={(e) => setFactoryName(e.target.value)}
                placeholder="Enter Factory Name..."
                className="w-full bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-0 rounded-md text-sm py-2 px-4 transition-all"
             />
           </div>

           <div>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
              >
                {loading ? 'Sending...' : 'Submit Batch'}
                <Send className="ml-2 h-4 w-4" />
              </button>
           </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto py-8 px-4 sm:px-6 lg:px-8">

        {/* Desktop Table Header */}
        <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-3 bg-slate-100 border border-slate-200 rounded-t-lg text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div className="col-span-2">Style Number</div>
            <div className="col-span-3">Sample Details (Type, Season, Year)</div>
            <div className="col-span-2">Date Sent</div>
            <div className="col-span-4">Shipment (Shipper, Tracking)</div>
            <div className="col-span-1 text-center">Actions</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-0">
            {submissions.map((sub, index) => (
                <div key={index} className="bg-white lg:border-x lg:border-b border-slate-200 lg:first:border-t p-4 lg:p-3 lg:grid lg:grid-cols-12 lg:gap-4 items-start rounded-lg lg:rounded-none shadow-sm lg:shadow-none mb-4 lg:mb-0 group hover:bg-slate-50/50 transition-colors">

                    {/* Mobile Header */}
                    <div className="lg:hidden flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                        <span className="font-semibold text-slate-700">Item #{index + 1}</span>
                        <div className="flex space-x-2">
                             <button type="button" onClick={() => handleDuplicateRow(index)} className="text-indigo-600 hover:text-indigo-800 p-1">
                                <Copy className="w-4 h-4" />
                            </button>
                            {submissions.length > 1 && (
                                <button type="button" onClick={() => handleRemoveRow(index)} className="text-red-500 hover:text-red-700 p-1">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Style Number */}
                    <div className="col-span-2 space-y-2 lg:space-y-0">
                         <label className="lg:hidden text-xs font-medium text-slate-500 uppercase">Style Number</label>
                         <StyledInput
                            placeholder="Style #"
                            value={sub.styleNumber}
                            onChange={(e) => handleChange(index, 'styleNumber', e.target.value)}
                            required
                         />
                    </div>

                    {/* Sample Details Group */}
                    <div className="col-span-3 grid grid-cols-3 gap-2 space-y-2 lg:space-y-0">
                         <div className="col-span-3 lg:col-span-1">
                            <label className="lg:hidden text-xs font-medium text-slate-500 uppercase mb-1 block">Type</label>
                            <StyledSelect
                                value={sub.sampleType}
                                onChange={(e) => handleChange(index, 'sampleType', e.target.value)}
                            >
                                <option>Lab Dip</option>
                                <option>Strike Off</option>
                                <option>PP Sample</option>
                                <option>TOP Sample</option>
                            </StyledSelect>
                         </div>
                         <div className="col-span-3 lg:col-span-1">
                             <label className="lg:hidden text-xs font-medium text-slate-500 uppercase mb-1 block">Season</label>
                             <StyledSelect
                                value={sub.season}
                                onChange={(e) => handleChange(index, 'season', e.target.value)}
                            >
                                <option>Spring</option>
                                <option>Fall</option>
                            </StyledSelect>
                         </div>
                         <div className="col-span-3 lg:col-span-1">
                             <label className="lg:hidden text-xs font-medium text-slate-500 uppercase mb-1 block">Year</label>
                             <StyledInput
                                type="number"
                                placeholder="Year"
                                value={sub.year}
                                onChange={(e) => handleChange(index, 'year', e.target.value)}
                                required
                            />
                         </div>
                    </div>

                    {/* Date Sent */}
                    <div className="col-span-2 space-y-2 lg:space-y-0">
                         <label className="lg:hidden text-xs font-medium text-slate-500 uppercase">Date Sent</label>
                         <StyledInput
                            type="date"
                            value={sub.dateSent}
                            onChange={(e) => handleChange(index, 'dateSent', e.target.value)}
                            required
                         />
                    </div>

                    {/* Shipment Group */}
                    <div className="col-span-4 grid grid-cols-3 gap-2 space-y-2 lg:space-y-0">
                         <div className="col-span-3 lg:col-span-1">
                            <label className="lg:hidden text-xs font-medium text-slate-500 uppercase mb-1 block">Shipper</label>
                             <StyledSelect
                                value={sub.shipper}
                                onChange={(e) => handleChange(index, 'shipper', e.target.value)}
                            >
                                <option>DHL</option>
                                <option>FedEx</option>
                                <option>UPS</option>
                                <option>Other</option>
                            </StyledSelect>
                         </div>

                         {sub.shipper === 'Other' && (
                             <div className="col-span-3 lg:col-span-1">
                                 <label className="lg:hidden text-xs font-medium text-slate-500 uppercase mb-1 block">Specify</label>
                                 <StyledInput
                                    placeholder="Carrier"
                                    value={sub.otherShipper}
                                    onChange={(e) => handleChange(index, 'otherShipper', e.target.value)}
                                 />
                             </div>
                         )}

                         <div className={`${sub.shipper === 'Other' ? 'col-span-3 lg:col-span-1' : 'col-span-3 lg:col-span-2'}`}>
                             <label className="lg:hidden text-xs font-medium text-slate-500 uppercase mb-1 block">Tracking</label>
                             <StyledInput
                                placeholder="Tracking Number"
                                value={sub.trackingNumber}
                                onChange={(e) => handleChange(index, 'trackingNumber', e.target.value)}
                             />
                         </div>
                    </div>

                    {/* Actions */}
                    <div className="hidden lg:flex col-span-1 justify-center space-x-2 pt-2">
                        <button
                            type="button"
                            onClick={() => handleDuplicateRow(index)}
                            className="text-slate-400 hover:text-indigo-600 transition-colors"
                            title="Duplicate Row"
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                        {submissions.length > 1 && (
                            <button
                                type="button"
                                onClick={() => handleRemoveRow(index)}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                                title="Remove Row"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                </div>
            ))}
        </form>

        <div className="mt-4">
             <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add another item
            </button>
        </div>

      </div>
    </div>
  );
};

export default SubmissionsForm;
