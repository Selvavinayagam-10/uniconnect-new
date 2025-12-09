
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Profile } from './pages/Profile';
import { Events } from './pages/Events';
import { Repository } from './pages/Repository';
import { Chat } from './pages/Chat';
import { Posts } from './pages/Posts';
import { Clubs } from './pages/Clubs';
import { LostFound } from './pages/LostFound';
import { Search } from './pages/Search';
import { UserManagement } from './pages/UserManagement';
import { db } from './services/db';
import { User, UserRole } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState('dashboard');

  // Check for persisted session (simple implementation)
  useEffect(() => {
    const savedUser = localStorage.getItem('cms_current_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('cms_current_user', JSON.stringify(loggedInUser));
    setPage(loggedInUser.role === UserRole.ADMIN ? 'dashboard' : 'profile');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('cms_current_user');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('cms_current_user', JSON.stringify(updatedUser));
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return (
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-800">Welcome, {user.name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-white p-6 rounded-lg shadow border-l-4 border-indigo-600">
                      <h3 className="text-gray-600 font-semibold uppercase tracking-wider text-sm">Total Users</h3>
                      <p className="text-4xl font-extrabold text-indigo-900 mt-2">{db.users.getAll().length}</p>
                   </div>
                   <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-600">
                      <h3 className="text-gray-600 font-semibold uppercase tracking-wider text-sm">Active Events</h3>
                      <p className="text-4xl font-extrabold text-green-900 mt-2">{db.events.getAll().length}</p>
                   </div>
                   <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-600">
                      <h3 className="text-gray-600 font-semibold uppercase tracking-wider text-sm">Posts Today</h3>
                      <p className="text-4xl font-extrabold text-purple-900 mt-2">{db.posts.getAll().length}</p>
                   </div>
                </div>
                {user.role === UserRole.ADMIN && (
                   <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                       <h3 className="font-bold text-blue-900 text-lg mb-2">Quick Actions</h3>
                       <p className="text-blue-800">Navigate to <span className="font-bold">User Management</span> to add Students, Faculty, or other Admins.</p>
                       <button onClick={() => setPage('users')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
                           Go to User Management
                       </button>
                   </div>
                )}
            </div>
        );
      case 'profile':
        return <Profile user={user} onUpdateUser={handleUpdateUser} />;
      case 'events':
        return <Events user={user} />;
      case 'repository':
        return <Repository user={user} />;
      case 'chat':
        return <Chat currentUser={user} />;
      case 'posts':
        return <Posts user={user} />;
      case 'clubs':
        return <Clubs user={user} />;
      case 'lostfound':
        return <LostFound user={user} />;
      case 'search':
        return <Search />;
      case 'users':
        return user.role === UserRole.ADMIN ? <UserManagement /> : <div>Access Denied</div>;
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <Layout user={user} onLogout={handleLogout} currentPage={page} setPage={setPage}>
      {renderPage()}
    </Layout>
  );
};

export default App;
