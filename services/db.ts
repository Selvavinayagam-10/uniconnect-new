
import { User, Post, Event, Club, Document, LostAndFoundItem, ChatMessage, UserRole, Notification } from '../types';

// Keys for LocalStorage
const KEYS = {
  USERS: 'cms_users',
  POSTS: 'cms_posts',
  EVENTS: 'cms_events',
  CLUBS: 'cms_clubs',
  DOCS: 'cms_docs',
  LOST_FOUND: 'cms_lost_found',
  CHATS: 'cms_chats',
  NOTIFICATIONS: 'cms_notifications',
  CURRENT_USER: 'cms_current_user',
};

// Store class to handle in-memory caching and persistence
class Store {
  private data: Record<string, any[]> = {};

  constructor() {
    this.loadAll();
  }

  loadAll() {
    Object.values(KEYS).forEach(key => {
      try {
        const raw = localStorage.getItem(key);
        this.data[key] = raw ? JSON.parse(raw) : [];
      } catch (e) {
        console.error(`Error loading ${key}`, e);
        this.data[key] = [];
      }
    });
  }

  get<T>(key: string): T[] {
    return this.data[key] || [];
  }

  save<T>(key: string, items: T[]) {
    this.data[key] = items;
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        alert('Storage full! Please delete some posts, files, or clear browser data.');
      } else {
        console.error(`Error saving ${key}`, e);
      }
    }
  }

  init(key: string, defaults: any[]) {
     // Only seed if the key doesn't exist in localStorage at all
     if (localStorage.getItem(key) === null) {
         this.save(key, defaults);
     }
  }
}

const store = new Store();

// Initial Seed Data
const seedData = () => {
    store.init(KEYS.USERS, [
        { id: 'u1', name: 'Admin User', email: 'admin@college.edu', role: UserRole.ADMIN, password: 'password', followers: [], following: [] },
        { id: 'u2', name: 'Dr. John Smith', email: 'faculty@college.edu', role: UserRole.FACULTY, department: 'Computer Science', password: 'password', followers: [], following: [] },
        { id: 'u3', name: 'Jane Doe', email: 'student@college.edu', role: UserRole.STUDENT, department: 'Computer Science', password: 'password', followers: [], following: [] },
    ]);

    store.init(KEYS.POSTS, [
        { id: 'p1', userId: 'u1', content: 'Welcome to the new semester!', likes: [], comments: [], status: 'APPROVED', createdAt: new Date().toISOString() },
    ]);

    store.init(KEYS.EVENTS, [
        { id: 'e1', title: 'Tech Symposium 2024', description: 'Annual tech fest.', date: '2024-12-01', venue: 'Auditorium', coordinatorId: 'u2', studentCoordinatorIds: ['u3'], registeredStudentIds: [], department: 'Computer Science' }
    ]);

    store.init(KEYS.CLUBS, [
        { id: 'c1', name: 'Coding Club', department: 'Computer Science', facultyInChargeId: 'u2', studentMemberIds: [], description: 'For code enthusiasts.', activities: [] }
    ]);

    store.init(KEYS.DOCS, [
        { 
            id: 'd1', 
            title: 'Data Structures Intro', 
            department: 'Computer Science', 
            courseName: 'CS101', 
            year: '1', 
            semester: '1', 
            url: '#', 
            uploadedBy: 'u2', 
            createdAt: new Date().toISOString() 
        }
    ]);

    store.init(KEYS.NOTIFICATIONS, []);
};

// Initialize DB
seedData();

// Helper to Create Notification internally
const createNotification = (userId: string, message: string, type: 'INFO' | 'ALERT' | 'SUCCESS' = 'INFO', link?: string) => {
    const notifications = store.get<Notification>(KEYS.NOTIFICATIONS);
    notifications.unshift({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        userId,
        message,
        type,
        isRead: false,
        createdAt: new Date().toISOString(),
        link
    });
    store.save(KEYS.NOTIFICATIONS, notifications);
};

// Database Service Interface
export const db = {
  users: {
    getAll: () => store.get<User>(KEYS.USERS),
    getById: (id: string) => store.get<User>(KEYS.USERS).find(u => u.id === id),
    update: (user: User) => {
      const users = store.get<User>(KEYS.USERS);
      const index = users.findIndex(u => u.id === user.id);
      if (index !== -1) {
        users[index] = user;
        store.save(KEYS.USERS, users);
      }
    },
    create: (user: User): boolean => {
        const users = store.get<User>(KEYS.USERS);
        // Prevent duplicate IDs
        if (users.some(u => u.id === user.id)) {
            return false; // Failed
        }
        users.push(user);
        store.save(KEYS.USERS, users);
        return true; // Success
    },
    delete: (id: string) => {
      const users = store.get<User>(KEYS.USERS).filter(u => u.id !== id);
      store.save(KEYS.USERS, users);
    }
  },
  posts: {
    getAll: () => store.get<Post>(KEYS.POSTS),
    create: (post: Post) => {
      const posts = store.get<Post>(KEYS.POSTS);
      posts.unshift(post);
      store.save(KEYS.POSTS, posts);

      // NOTIFICATION LOGIC
      if (post.status === 'PENDING') {
          // Notify Faculty and Admins about pending post
          const staff = store.get<User>(KEYS.USERS).filter(u => u.role === UserRole.ADMIN || u.role === UserRole.FACULTY);
          staff.forEach(u => {
              createNotification(u.id, `New post requires approval from User ${post.userId}`, 'ALERT', 'posts');
          });
      } else {
          // Public post? Maybe notify followers (Skipped for simplicity, notifying all students)
          // const students = store.get<User>(KEYS.USERS).filter(u => u.role === UserRole.STUDENT && u.id !== post.userId);
          // students.forEach(u => createNotification(u.id, `New post: ${post.content.substring(0, 20)}...`, 'INFO', 'posts'));
      }
    },
    update: (post: Post) => {
      const posts = store.get<Post>(KEYS.POSTS);
      const index = posts.findIndex(p => p.id === post.id);
      if (index !== -1) {
        // Check if status changed
        const oldStatus = posts[index].status;
        posts[index] = post;
        store.save(KEYS.POSTS, posts);

        // NOTIFICATION LOGIC (Approval/Rejection)
        if (oldStatus === 'PENDING' && post.status !== 'PENDING') {
            createNotification(post.userId, `Your post was ${post.status.toLowerCase()}.`, post.status === 'APPROVED' ? 'SUCCESS' : 'ALERT', 'posts');
        }
        // Comment Logic is handled in component, but typically DB service shouldn't know about component state. 
        // Assuming update() is called for comments too.
        if (post.comments.length > posts[index].comments.length) {
             // New comment added
             if (post.userId !== 'current_user_placeholder') { // Hard to detect current user here without passing it
                 // Simplified: Notify post owner if someone else commented (requires logic check in component or passing modifier ID)
                 createNotification(post.userId, `New comment on your post.`, 'INFO', 'posts');
             }
        }
      }
    },
    delete: (id: string) => {
      const posts = store.get<Post>(KEYS.POSTS).filter(p => p.id !== id);
      store.save(KEYS.POSTS, posts);
    }
  },
  events: {
    getAll: () => store.get<Event>(KEYS.EVENTS),
    create: (event: Event) => {
      const events = store.get<Event>(KEYS.EVENTS);
      events.push(event);
      store.save(KEYS.EVENTS, events);

      // NOTIFICATION LOGIC
      const users = store.get<User>(KEYS.USERS);
      users.forEach(u => {
          if (u.id !== event.coordinatorId) {
             createNotification(u.id, `New Event: ${event.title}`, 'INFO', 'events');
          }
      });
    },
    update: (event: Event) => {
      const events = store.get<Event>(KEYS.EVENTS);
      const index = events.findIndex(e => e.id === event.id);
      if (index !== -1) {
        events[index] = event;
        store.save(KEYS.EVENTS, events);
      }
    }
  },
  clubs: {
    getAll: () => store.get<Club>(KEYS.CLUBS),
    create: (club: Club) => {
        const clubs = store.get<Club>(KEYS.CLUBS);
        clubs.push(club);
        store.save(KEYS.CLUBS, clubs);
        
        // Notify Faculty In Charge
        createNotification(club.facultyInChargeId, `You have been assigned as In-Charge for ${club.name}`, 'SUCCESS', 'clubs');
    },
    update: (club: Club) => {
      const clubs = store.get<Club>(KEYS.CLUBS);
      const index = clubs.findIndex(c => c.id === club.id);
      if (index !== -1) {
        clubs[index] = club;
        store.save(KEYS.CLUBS, clubs);
      }
    }
  },
  docs: {
    getAll: () => store.get<Document>(KEYS.DOCS),
    create: (doc: Document) => {
      const docs = store.get<Document>(KEYS.DOCS);
      docs.push(doc);
      store.save(KEYS.DOCS, docs);

      // NOTIFICATION LOGIC
      // Notify students in that department
      const students = store.get<User>(KEYS.USERS).filter(u => u.role === UserRole.STUDENT && u.department === doc.department);
      students.forEach(u => {
          createNotification(u.id, `New Document uploaded in ${doc.department}: ${doc.title}`, 'INFO', 'repository');
      });
    },
    update: (doc: Document) => {
      const docs = store.get<Document>(KEYS.DOCS);
      const index = docs.findIndex(d => d.id === doc.id);
      if (index !== -1) {
        docs[index] = doc;
        store.save(KEYS.DOCS, docs);
      }
    },
    delete: (id: string) => {
      const docs = store.get<Document>(KEYS.DOCS).filter(d => d.id !== id);
      store.save(KEYS.DOCS, docs);
    }
  },
  lostFound: {
    getAll: () => store.get<LostAndFoundItem>(KEYS.LOST_FOUND),
    create: (item: LostAndFoundItem) => {
      const items = store.get<LostAndFoundItem>(KEYS.LOST_FOUND);
      items.push(item);
      store.save(KEYS.LOST_FOUND, items);

      // NOTIFY ADMINS
      const admins = store.get<User>(KEYS.USERS).filter(u => u.role === UserRole.ADMIN);
      admins.forEach(u => {
          createNotification(u.id, `New Lost & Found Report: ${item.title}`, 'ALERT', 'lostfound');
      });
    },
    update: (item: LostAndFoundItem) => {
      const items = store.get<LostAndFoundItem>(KEYS.LOST_FOUND);
      const index = items.findIndex(i => i.id === item.id);
      if (index !== -1) {
        items[index] = item;
        store.save(KEYS.LOST_FOUND, items);
      }
    }
  },
  chats: {
    getAll: () => store.get<ChatMessage>(KEYS.CHATS),
    send: (msg: ChatMessage) => {
      const chats = store.get<ChatMessage>(KEYS.CHATS);
      chats.push(msg);
      store.save(KEYS.CHATS, chats);

      // NOTIFY RECEIVER
      const sender = store.get<User>(KEYS.USERS).find(u => u.id === msg.senderId);
      const senderName = sender ? sender.name : 'Someone';
      createNotification(msg.receiverId, `New message from ${senderName}`, 'INFO', 'chat');
    }
  },
  notifications: {
      getForUser: (userId: string) => {
          const all = store.get<Notification>(KEYS.NOTIFICATIONS);
          // Return unread first, then by date
          return all.filter(n => n.userId === userId).sort((a,b) => {
              if (a.isRead === b.isRead) {
                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              }
              return a.isRead ? 1 : -1;
          });
      },
      markAsRead: (id: string) => {
          const all = store.get<Notification>(KEYS.NOTIFICATIONS);
          const index = all.findIndex(n => n.id === id);
          if (index !== -1) {
              all[index].isRead = true;
              store.save(KEYS.NOTIFICATIONS, all);
          }
      },
      markAllAsRead: (userId: string) => {
          const all = store.get<Notification>(KEYS.NOTIFICATIONS);
          all.forEach(n => {
              if (n.userId === userId) n.isRead = true;
          });
          store.save(KEYS.NOTIFICATIONS, all);
      }
  }
};
