import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { db } from '../services/db';

interface ProfileProps {
  user: User;
  onUpdateUser: (u: User) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...user });

  const handleSave = () => {
    db.users.update(formData);
    onUpdateUser(formData);
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Header/Cover */}
        <div className="h-32 bg-indigo-600"></div>
        <div className="px-6 pb-6">
          <div className="relative flex items-end -mt-12 mb-6">
            <div className="h-24 w-24 bg-white rounded-full p-1 shadow-lg">
                <div className="h-full w-full bg-slate-200 rounded-full flex items-center justify-center text-3xl font-bold text-slate-500">
                    {user.name.charAt(0)}
                </div>
            </div>
            <div className="ml-4 flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-gray-500">{user.role} {user.department ? `• ${user.department}` : ''}</p>
            </div>
            <div>
               {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Edit Profile
                  </button>
               ) : (
                   <div className="space-x-2">
                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">Save</button>
                   </div>
               )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stats */}
            <div className="col-span-1 space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Community</h3>
                    <div className="flex justify-between text-center">
                        <div>
                            <span className="block text-xl font-bold text-gray-900">{user.followers.length}</span>
                            <span className="text-xs text-gray-500">Followers</span>
                        </div>
                        <div>
                            <span className="block text-xl font-bold text-gray-900">{user.following.length}</span>
                            <span className="text-xs text-gray-500">Following</span>
                        </div>
                        <div>
                            <span className="block text-xl font-bold text-gray-900">0</span>
                            <span className="text-xs text-gray-500">Posts</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Full Name</label>
                            {isEditing ? (
                                <input className="mt-1 block w-full border border-gray-300 rounded p-1" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            ) : (
                                <p className="mt-1 text-sm text-gray-900">{user.name}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">Email</label>
                            {isEditing ? (
                                <input className="mt-1 block w-full border border-gray-300 rounded p-1" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                            ) : (
                                <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                            )}
                        </div>
                        {(user.role === UserRole.FACULTY || user.role === UserRole.STUDENT) && (
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-500">Department</label>
                                {isEditing ? (
                                <input className="mt-1 block w-full border border-gray-300 rounded p-1" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                                ) : (
                                    <p className="mt-1 text-sm text-gray-900">{user.department}</p>
                                )}
                            </div>
                        )}
                        {isEditing && (
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-500">New Password</label>
                                <input className="mt-1 block w-full border border-gray-300 rounded p-1" type="password" placeholder="Leave blank to keep current" onChange={e => {
                                    if(e.target.value) setFormData({...formData, password: e.target.value})
                                }} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
