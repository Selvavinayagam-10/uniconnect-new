
import React, { useState, useEffect } from 'react';
import { User, Club, UserRole, Event } from '../types';
import { db } from '../services/db';
import { Users, Edit, Plus, Calendar, UserCheck } from 'lucide-react';

interface ClubsProps {
  user: User;
}

export const Clubs: React.FC<ClubsProps> = ({ user }) => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  
  // State for Club Events
  const [clubEvents, setClubEvents] = useState<Event[]>([]);
  const [creatingEventForClub, setCreatingEventForClub] = useState<Club | null>(null);
  const [eventForm, setEventForm] = useState({
      title: '',
      description: '',
      date: '',
      venue: '',
      studentCoordinatorId: ''
  });

  // Data for Dropdowns
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [studentList, setStudentList] = useState<User[]>([]);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setClubs(db.clubs.getAll());
    setClubEvents(db.events.getAll().filter(e => e.clubId)); // Only get club events
    
    const allUsers = db.users.getAll();
    setFacultyList(allUsers.filter(u => u.role === UserRole.FACULTY));
    setStudentList(allUsers.filter(u => u.role === UserRole.STUDENT));
  };

  const handleSaveClub = (club: Club) => {
    if (club.id) {
        db.clubs.update(club);
    } else {
        db.clubs.create({...club, id: Date.now().toString(), studentMemberIds: [], activities: []});
    }
    setEditingClub(null);
    refreshData();
  };

  const handleCreateClubEvent = (e: React.FormEvent) => {
      e.preventDefault();
      if (!creatingEventForClub) return;

      const newEvent: Event = {
          id: Date.now().toString(),
          title: eventForm.title,
          description: eventForm.description,
          date: eventForm.date,
          venue: eventForm.venue,
          coordinatorId: user.id, // Current Faculty
          studentCoordinatorIds: eventForm.studentCoordinatorId ? [eventForm.studentCoordinatorId] : [],
          registeredStudentIds: [],
          department: creatingEventForClub.department,
          clubId: creatingEventForClub.id
      };

      db.events.create(newEvent);
      setCreatingEventForClub(null);
      setEventForm({ title: '', description: '', date: '', venue: '', studentCoordinatorId: '' });
      refreshData();
      alert('Club event created successfully!');
  };

  const getEventsForClub = (clubId: string) => {
      return clubEvents.filter(e => e.clubId === clubId);
  };

  const getFacultyName = (id: string) => {
      const f = facultyList.find(u => u.id === id);
      return f ? f.name : 'Unassigned';
  };

  const getStudentName = (id: string) => {
      const s = studentList.find(u => u.id === id);
      return s ? s.name : 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Clubs & Departments</h2>
        {user.role === UserRole.ADMIN && (
            <button 
                onClick={() => setEditingClub({id: '', name: '', department: '', facultyInChargeId: '', studentMemberIds: [], description: '', activities: []})}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex items-center"
            >
                <Plus size={18} className="mr-2" /> New Club
            </button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {clubs.map(club => {
            const isFacultyInCharge = user.role === UserRole.FACULTY && club.facultyInChargeId === user.id;
            const clubSpecificEvents = getEventsForClub(club.id);

            return (
              <div key={club.id} className="bg-white rounded-lg shadow border border-gray-200 flex flex-col">
                <div className="p-6 flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-indigo-700">{club.name}</h3>
                            <span className="inline-block mt-1 px-2 py-1 bg-gray-100 text-xs font-semibold text-gray-600 rounded">
                                {club.department}
                            </span>
                        </div>
                        {(user.role === UserRole.ADMIN || isFacultyInCharge) && (
                            <button onClick={() => setEditingClub(club)} className="text-gray-400 hover:text-indigo-600">
                                <Edit size={18} />
                            </button>
                        )}
                    </div>
                    
                    <p className="mt-4 text-gray-600 text-sm line-clamp-3">{club.description}</p>
                    
                    <div className="mt-4 flex items-center text-sm text-gray-500">
                        <Users size={16} className="mr-2 text-indigo-500" />
                        <span className="font-medium mr-1">Faculty In-Charge:</span> 
                        <span>{getFacultyName(club.facultyInChargeId)}</span>
                    </div>

                    {/* Club Events Section */}
                    <div className="mt-6 border-t border-gray-100 pt-4">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-bold text-gray-800 flex items-center">
                                <Calendar size={14} className="mr-2" /> Club Events
                            </h4>
                            {isFacultyInCharge && (
                                <button 
                                    onClick={() => setCreatingEventForClub(club)}
                                    className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 border border-indigo-200"
                                >
                                    + Add Event
                                </button>
                            )}
                        </div>
                        
                        {clubSpecificEvents.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">No upcoming events.</p>
                        ) : (
                            <ul className="space-y-2">
                                {clubSpecificEvents.map(e => (
                                    <li key={e.id} className="text-sm bg-gray-50 p-2 rounded border border-gray-100">
                                        <div className="font-medium text-gray-800">{e.title}</div>
                                        <div className="text-xs text-gray-500 flex justify-between mt-1">
                                            <span>{e.date}</span>
                                            {e.studentCoordinatorIds.length > 0 && (
                                                <span className="text-indigo-600" title="Student Coordinator">
                                                    Coord: {getStudentName(e.studentCoordinatorIds[0])}
                                                </span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {user.role === UserRole.STUDENT && (
                     <div className="bg-gray-50 p-3 border-t text-center">
                        <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                            Request to Join Club
                        </button>
                    </div>
                )}
              </div>
            );
        })}
      </div>

      {/* Admin: Create/Edit Club Modal */}
      {editingClub && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4 animate-fade-in">
                  <h3 className="text-lg font-bold text-gray-900">{editingClub.id ? 'Edit Club' : 'Create New Club'}</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Club Name</label>
                    <input 
                        className="w-full border border-gray-300 p-2 rounded focus:ring-indigo-500 focus:border-indigo-500" 
                        value={editingClub.name} 
                        onChange={e => setEditingClub({...editingClub, name: e.target.value})} 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input 
                        className="w-full border border-gray-300 p-2 rounded focus:ring-indigo-500 focus:border-indigo-500" 
                        value={editingClub.department} 
                        onChange={e => setEditingClub({...editingClub, department: e.target.value})} 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea 
                        className="w-full border border-gray-300 p-2 rounded focus:ring-indigo-500 focus:border-indigo-500" 
                        rows={3}
                        value={editingClub.description} 
                        onChange={e => setEditingClub({...editingClub, description: e.target.value})} 
                    />
                  </div>

                   {user.role === UserRole.ADMIN && (
                       <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Assign Faculty In-Charge</label>
                           <select 
                                className="w-full border border-gray-300 p-2 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                value={editingClub.facultyInChargeId} 
                                onChange={e => setEditingClub({...editingClub, facultyInChargeId: e.target.value})} 
                           >
                               <option value="">Select Faculty</option>
                               {facultyList.map(f => (
                                   <option key={f.id} value={f.id}>{f.name} ({f.department})</option>
                               ))}
                           </select>
                       </div>
                   )}
                  
                  <div className="flex justify-end space-x-3 pt-2">
                      <button onClick={() => setEditingClub(null)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">Cancel</button>
                      <button onClick={() => handleSaveClub(editingClub)} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Save Club</button>
                  </div>
              </div>
          </div>
      )}

      {/* Faculty: Create Club Event Modal */}
      {creatingEventForClub && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4 animate-fade-in">
                  <h3 className="text-lg font-bold text-gray-900">New Event for {creatingEventForClub.name}</h3>
                  <form onSubmit={handleCreateClubEvent} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Event Title</label>
                        <input 
                            required
                            className="mt-1 w-full border border-gray-300 p-2 rounded"
                            value={eventForm.title}
                            onChange={e => setEventForm({...eventForm, title: e.target.value})}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea 
                            required
                            rows={2}
                            className="mt-1 w-full border border-gray-300 p-2 rounded"
                            value={eventForm.description}
                            onChange={e => setEventForm({...eventForm, description: e.target.value})}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Date</label>
                            <input 
                                required
                                type="date"
                                className="mt-1 w-full border border-gray-300 p-2 rounded"
                                value={eventForm.date}
                                onChange={e => setEventForm({...eventForm, date: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Venue</label>
                            <input 
                                required
                                className="mt-1 w-full border border-gray-300 p-2 rounded"
                                value={eventForm.venue}
                                onChange={e => setEventForm({...eventForm, venue: e.target.value})}
                            />
                          </div>
                      </div>

                      <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Assign Student Coordinator</label>
                           <div className="relative">
                               <UserCheck size={18} className="absolute left-3 top-3 text-gray-400" />
                               <select 
                                    required
                                    className="w-full border border-gray-300 p-2 pl-10 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                    value={eventForm.studentCoordinatorId} 
                                    onChange={e => setEventForm({...eventForm, studentCoordinatorId: e.target.value})} 
                               >
                                   <option value="">Select Student</option>
                                   {studentList.map(s => (
                                       <option key={s.id} value={s.id}>{s.name} ({s.department})</option>
                                   ))}
                               </select>
                           </div>
                       </div>

                      <div className="flex justify-end space-x-3 pt-2">
                          <button type="button" onClick={() => setCreatingEventForClub(null)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">Cancel</button>
                          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Create Event</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
