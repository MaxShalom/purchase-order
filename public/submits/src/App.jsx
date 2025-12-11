import React, { useState } from 'react';
import SubmissionsForm from './components/SubmissionsForm';
import Dashboard from './components/Dashboard';
import Login from './components/Login';

function App() {
  // Simple routing based on URL params or state
  // For this demo, let's use a simple state to toggle between Factory View and Internal View
  // In a real app, use react-router-dom

  const [view, setView] = useState('factory'); // 'factory', 'login', 'admin'
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check URL for ?admin=true to switch to admin login initially, handy for testing
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin')) {
      setView('login');
    }
  }, []);

  const handleLogin = (success) => {
    if (success) {
      setIsAuthenticated(true);
      setView('admin');
    }
  };

  return (
    <div>
       {/* Navigation / Header Switcher for Demo Purposes */}
       <div className="bg-gray-800 text-white p-2 text-xs flex justify-end space-x-4">
          <button onClick={() => setView('factory')} className={`hover:text-blue-300 ${view === 'factory' ? 'font-bold' : ''}`}>Factory View</button>
          <button onClick={() => setView(isAuthenticated ? 'admin' : 'login')} className={`hover:text-blue-300 ${view === 'admin' || view === 'login' ? 'font-bold' : ''}`}>Internal Access</button>
       </div>

      {view === 'factory' && <SubmissionsForm />}
      {view === 'login' && <Login onLogin={handleLogin} />}
      {view === 'admin' && isAuthenticated && <Dashboard />}
      {view === 'admin' && !isAuthenticated && <Login onLogin={handleLogin} />}
    </div>
  );
}

export default App;
