
import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, Notification } from '../types';
import { db } from '../services/db';
import { 
  Menu, X, Home, Users, FileText, Calendar, 
  Shield, Upload, MessageSquare, LogOut, User as UserIcon, Search, Bell, CheckCheck
} from 'lucide-react';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  currentPage: string;
  setPage: (page: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ user, onLogout, currentPage, setPage, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Request Notification Permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }
  }, []);

  // Polling for Notifications (Simulating Real-Time)
  useEffect(() => {
    const fetchNotifications = () => {
        const notifs = db.notifications.getForUser(user.id);
        
        // Check if there are new unread notifications to trigger system push
        const currentUnread = notifs.filter(n => !n.isRead).length;
        if (currentUnread > unreadCount && "Notification" in window && Notification.permission === "granted") {
            // Find the newest unread
            const newest = notifs.find(n => !n.isRead);
            if (newest) {
                new Notification("UniConnect Alert", {
                    body: newest.message,
                    icon: '/vite.svg' // Fallback icon
                });
            }
        }

        setNotifications(notifs);
        setUnreadCount(currentUnread);
    };

    fetchNotifications(); // Initial fetch
    const interval = setInterval(fetchNotifications, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [user.id, unreadCount]);

  const handleMarkRead = (id: string) => {
      db.notifications.markAsRead(id);
      // Local update for immediate UI feel
      setNotifications(prev => prev.map(n => n.id === id ? {...n, isRead: true} : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = () => {
      db.notifications.markAllAsRead(user.id);
      setNotifications(prev => prev.map(n => ({...n, isRead: true})));
      setUnreadCount(0);
  };

  const handleNotificationClick = (notif: Notification) => {
      handleMarkRead(notif.id);
      if (notif.link) {
          setPage(notif.link);
          setShowNotifications(false);
      }
  };

  const getMenuItems = () => {
    const common = [
      { id: 'profile', label: 'My Profile', icon: UserIcon },
      { id: 'search', label: 'Search Users', icon: Search },
      { id: 'chat', label: 'Chat', icon: MessageSquare },
      { id: 'posts', label: 'Posts', icon: Home },
      { id: 'lostfound', label: 'Lost & Found', icon: Shield },
    ];

    if (user.role === UserRole.ADMIN) {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'users', label: 'User Management', icon: Users },
        ...common,
        { id: 'events', label: 'Events', icon: Calendar },
        { id: 'clubs', label: 'Clubs', icon: Users },
        { id: 'repository', label: 'Repository', icon: Upload },
      ];
    }

    if (user.role === UserRole.FACULTY) {
      return [
        { id: 'profile', label: 'My Profile', icon: UserIcon },
        { id: 'search', label: 'Search Users', icon: Search },
        { id: 'chat', label: 'Chat', icon: MessageSquare },
        { id: 'repository', label: 'Repository', icon: Upload },
        { id: 'posts', label: 'Posts', icon: FileText },
        { id: 'events', label: 'Events', icon: Calendar },
        { id: 'clubs', label: 'Clubs', icon: Users },
        { id: 'lostfound', label: 'Lost & Found', icon: Shield },
      ];
    }

    // Student
    return [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      ...common,
      { id: 'events', label: 'Events', icon: Calendar },
      { id: 'clubs', label: 'Clubs', icon: Users },
      { id: 'repository', label: 'Repository', icon: FileText },
    ];
  };

  const menuItems = getMenuItems();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 h-16 bg-slate-800 flex-shrink-0">
          <span className="text-xl font-bold tracking-wider">UniConnect</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
            <div className="px-4 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {user.role} PANEL
            </div>
            <nav className="space-y-1 px-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setPage(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors
                    ${currentPage === item.id 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                  `}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.label}
                </button>
              ))}
            </nav>
        </div>

        {/* Sidebar Footer (Pinned to bottom) */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex-shrink-0">
          <div className="flex items-center mb-4">
            <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold flex-shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="flex items-center justify-between h-16 bg-white shadow-sm px-4 lg:px-8 flex-shrink-0 z-10">
          <div className="flex items-center">
            <button
                onClick={() => setSidebarOpen(true)}
                className="text-gray-500 focus:outline-none lg:hidden mr-4"
            >
                <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold text-gray-800 capitalize">
                {menuItems.find(i => i.id === currentPage)?.label || 'Dashboard'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4 relative">
             {/* Notification Bell */}
             <div className="relative">
                 <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-full focus:outline-none"
                 >
                     <Bell size={24} />
                     {unreadCount > 0 && (
                         <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>
                     )}
                 </button>

                 {/* Notification Dropdown */}
                 {showNotifications && (
                     <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl overflow-hidden border border-gray-100 z-50">
                         <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                             <h3 className="font-semibold text-gray-700">Notifications</h3>
                             {unreadCount > 0 && (
                                 <button onClick={handleMarkAllRead} className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center">
                                     <CheckCheck size={14} className="mr-1"/> Mark all read
                                 </button>
                             )}
                         </div>
                         <div className="max-h-96 overflow-y-auto">
                             {notifications.length === 0 ? (
                                 <div className="p-4 text-center text-gray-400 text-sm">No notifications</div>
                             ) : (
                                 notifications.map(notif => (
                                     <div 
                                        key={notif.id} 
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`p-3 border-b last:border-0 cursor-pointer hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-indigo-50' : 'bg-white'}`}
                                     >
                                         <p className={`text-sm ${!notif.isRead ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                             {notif.message}
                                         </p>
                                         <p className="text-xs text-gray-400 mt-1">
                                             {new Date(notif.createdAt).toLocaleTimeString()}
                                         </p>
                                     </div>
                                 ))
                             )}
                         </div>
                     </div>
                 )}
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
};
