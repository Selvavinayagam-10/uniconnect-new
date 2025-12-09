import React, { useState } from 'react';
import { User } from '../types';
import { db } from '../services/db';
import { Search as SearchIcon, UserPlus } from 'lucide-react';

export const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  
  const users = db.users.getAll().filter(u => 
    u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.email.toLowerCase().includes(query.toLowerCase()) ||
    (u.department && u.department.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-4 rounded-lg shadow mb-6 flex items-center">
        <SearchIcon className="text-gray-400 mr-3" />
        <input 
          type="text"
          placeholder="Search by name, department, or email..."
          className="flex-1 outline-none text-gray-700"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map(u => (
          <div key={u.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                {u.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{u.name}</h3>
                <p className="text-sm text-gray-500">{u.role}</p>
                {u.department && <p className="text-xs text-indigo-500">{u.department}</p>}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
               <div className="text-center">
                  <span className="block font-bold text-gray-900">{u.followers.length}</span>
                  <span className="text-xs text-gray-500">Followers</span>
               </div>
               <button className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800">
                  <UserPlus size={16} className="mr-1" /> Follow
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
