
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { db } from '../services/db';
import { Plus, Trash2, Shield, User as UserIcon, GraduationCap, Search, Key } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    role: UserRole.STUDENT,
    department: ''
  });

  useEffect(() => {
    refreshUsers();
  }, []);

  const refreshUsers = () => {
    setUsers(db.users.getAll());
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.id.trim()) {
        alert("Please enter a User ID");
        return;
    }

    const newUser: User = {
      id: formData.id.trim(), // Ensure no leading/trailing whitespace
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      department: formData.department,
      followers: [],
      following: []
    };

    // Attempt to create user
    const success = db.users.create(newUser);

    if (success) {
        // Only clear and close if successful
        setFormData({
            id: '',
            name: '',
            email: '',
            password: '',
            role: UserRole.STUDENT,
            department: ''
        });
        setShowForm(false);
        refreshUsers();
        alert('User created successfully');
    } else {
        // Failed (Duplicate ID)
        alert('Error: A user with this ID already exists. Please choose a different ID.');
    }
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (confirm(`Are you sure you want to permanently delete user "${name}" (ID: ${id})?`)) {
      db.users.delete(id);
      refreshUsers();
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return <Shield size={16} className="text-red-600" />;
      case UserRole.FACULTY: return <GraduationCap size={16} className="text-blue-600" />;
      case UserRole.STUDENT: return <UserIcon size={16} className="text-green-600" />;
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(filter.toLowerCase()) || 
    u.email.toLowerCase().includes(filter.toLowerCase()) ||
    u.id.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Add User
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Create New User</h3>
          <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">User ID</label>
              <input
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.id}
                onChange={e => setFormData({...formData,id: e.target.value})}
                placeholder="e.g. 101, 2024001, john.doe"
              />
              <p className="text-xs text-gray-500 mt-1">Unique Identifier (e.g. Roll No or Staff ID)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                required
                type="email"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                required
                type="text" 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                placeholder="Enter password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
              >
                <option value={UserRole.ADMIN}>Admin</option>
                <option value={UserRole.FACULTY}>Faculty</option>
                <option value={UserRole.STUDENT}>Student</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Department <span className="text-xs text-gray-400">(Optional for Admin)</span></label>
              <input
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.department}
                onChange={e => setFormData({...formData, department: e.target.value})}
                placeholder="e.g. Computer Science"
              />
            </div>
            <div className="md:col-span-2 flex justify-end space-x-3 mt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Create User</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
           <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
              </div>
              <input
                  type="text"
                  placeholder="Filter by Name, ID or Email..."
                  className="pl-10 block w-full border-gray-300 rounded-md border py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
              />
           </div>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name / Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Password</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                    <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                            No users found.
                        </td>
                    </tr>
                ) : (
                    filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-bold text-gray-900 font-mono">{user.id}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 border border-indigo-100 mr-3">
                            {user.name.charAt(0)}
                            </div>
                            <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                            </div>
                        </div>
                        </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded w-fit">
                                <Key size={12} className="mr-1 text-gray-400"/>
                                <span className="font-mono">{user.password || '****'}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                        <span className="flex items-center text-sm text-gray-700">
                            {getRoleIcon(user.role)}
                            <span className="ml-2 capitalize font-medium">{user.role.toLowerCase()}</span>
                        </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.department ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {user.department}
                            </span>
                        ) : (
                            <span className="text-gray-400">-</span>
                        )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                            onClick={() => handleDeleteUser(user.id, user.name)} 
                            className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-full hover:bg-red-100 transition-colors"
                            title="Delete User"
                        >
                            <Trash2 size={18} />
                        </button>
                        </td>
                    </tr>
                    ))
                )}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
