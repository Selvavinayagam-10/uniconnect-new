import React, { useState, useEffect } from 'react';
import { User, Event, UserRole } from '../types';
import { db } from '../services/db';
import { Plus, Calendar, Edit, Users, Trash2 } from 'lucide-react';

interface EventsProps {
  user: User;
}

export const Events: React.FC<EventsProps> = ({ user }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    venue: '',
    department: '',
    coordinatorId: ''
  });

  useEffect(() => {
    refreshEvents();
  }, []);

  const refreshEvents = () => {
    setEvents(db.events.getAll());
  };

  const handleCreate = () => {
    const newEvent: Event = {
      id: Date.now().toString(),
      ...formData,
      coordinatorId: formData.coordinatorId || (user.role === UserRole.FACULTY ? user.id : ''),
      studentCoordinatorIds: [],
      registeredStudentIds: [],
    };
    db.events.create(newEvent);
    setShowModal(false);
    refreshEvents();
  };

  const handleUpdate = () => {
    if (!editingEvent) return;
    const updated = { ...editingEvent, ...formData };
    db.events.update(updated);
    setShowModal(false);
    setEditingEvent(null);
    refreshEvents();
  };

  const openModal = (event?: Event) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        title: event.title,
        description: event.description,
        date: event.date,
        venue: event.venue,
        department: event.department || '',
        coordinatorId: event.coordinatorId
      });
    } else {
      setEditingEvent(null);
      setFormData({ title: '', description: '', date: '', venue: '', department: '', coordinatorId: '' });
    }
    setShowModal(true);
  };

  const registerForEvent = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event && !event.registeredStudentIds.includes(user.id)) {
      event.registeredStudentIds.push(user.id);
      db.events.update(event);
      refreshEvents();
      alert('Registered successfully!');
    }
  };

  const canEdit = (event: Event) => {
    return user.role === UserRole.ADMIN || (user.role === UserRole.FACULTY && event.coordinatorId === user.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Events</h2>
        {user.role === UserRole.ADMIN && (
          <button
            onClick={() => openModal()}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Plus size={20} className="mr-2" />
            Create Event
          </button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map(event => (
          <div key={event.id} className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
            <div className="p-5">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h3>
                {canEdit(event) && (
                  <button onClick={() => openModal(event)} className="text-gray-400 hover:text-indigo-600">
                    <Edit size={18} />
                  </button>
                )}
              </div>
              <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
              
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar size={16} className="mr-2" />
                  {event.date}
                </div>
                <div className="flex items-center">
                  <Users size={16} className="mr-2" />
                  {event.venue}
                </div>
                {event.department && (
                  <div className="inline-block px-2 py-1 bg-gray-100 rounded text-xs">
                    {event.department}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-sm text-gray-500">{event.registeredStudentIds.length} Registered</span>
                
                {user.role === UserRole.STUDENT && (
                  <button
                    onClick={() => registerForEvent(event.id)}
                    disabled={event.registeredStudentIds.includes(user.id)}
                    className={`px-3 py-1 rounded text-sm ${
                      event.registeredStudentIds.includes(user.id)
                        ? 'bg-green-100 text-green-700 cursor-default'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {event.registeredStudentIds.includes(user.id) ? 'Registered' : 'Register'}
                  </button>
                )}

                {user.role === UserRole.FACULTY && event.coordinatorId === user.id && (
                   <span className="text-xs font-bold text-indigo-600">You are Coordinator</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{editingEvent ? 'Edit Event' : 'New Event'}</h3>
            <div className="space-y-4">
              <input
                placeholder="Event Title"
                className="w-full border p-2 rounded"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
              <textarea
                placeholder="Description"
                className="w-full border p-2 rounded"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
              <input
                type="date"
                className="w-full border p-2 rounded"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
              <input
                placeholder="Venue"
                className="w-full border p-2 rounded"
                value={formData.venue}
                onChange={e => setFormData({...formData, venue: e.target.value})}
              />
              <input
                placeholder="Department"
                className="w-full border p-2 rounded"
                value={formData.department}
                onChange={e => setFormData({...formData, department: e.target.value})}
              />
              {user.role === UserRole.ADMIN && (
                 <input
                 placeholder="Faculty Coordinator ID"
                 className="w-full border p-2 rounded"
                 value={formData.coordinatorId}
                 onChange={e => setFormData({...formData, coordinatorId: e.target.value})}
               />
              )}
              
              <div className="flex justify-end space-x-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button onClick={editingEvent ? handleUpdate : handleCreate} className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
