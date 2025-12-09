
export enum UserRole {
  ADMIN = 'ADMIN',
  FACULTY = 'FACULTY',
  STUDENT = 'STUDENT',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatar?: string;
  password?: string; // In a real app, never store plain text
  followers: string[]; // User IDs
  following: string[]; // User IDs
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  image?: string;
  video?: string;
  likes: string[]; // User IDs
  comments: Comment[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  coordinatorId: string; // Faculty ID
  studentCoordinatorIds: string[];
  registeredStudentIds: string[];
  department?: string;
  results?: string; // URL or text
  clubId?: string; // Link to a club
}

export interface Club {
  id: string;
  name: string;
  department: string;
  facultyInChargeId: string;
  studentMemberIds: string[];
  description: string;
  activities: string[];
}

export interface Document {
  id: string;
  title: string;
  department: string;
  courseName: string;
  year: string;
  semester: string;
  url: string; // Mock URL
  uploadedBy: string; // User ID
  createdAt: string;
}

export interface LostAndFoundItem {
  id: string;
  title: string;
  description: string;
  type: 'LOST' | 'FOUND';
  imageUrl?: string;
  videoUrl?: string;
  reportedBy: string;
  status: 'OPEN' | 'RESOLVED';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'TEXT' | 'VOICE' | 'IMAGE';
  timestamp: string;
  read: boolean;
}

export interface Notification {
  id: string;
  userId: string; // The recipient
  message: string;
  type: 'INFO' | 'ALERT' | 'SUCCESS';
  isRead: boolean;
  createdAt: string;
  link?: string; // Optional Page ID to navigate to
}
