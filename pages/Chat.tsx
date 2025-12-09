import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage } from '../types';
import { db } from '../services/db';
import { Send, Mic, Image as ImageIcon, MessageSquare } from 'lucide-react';

interface ChatProps {
  currentUser: User;
}

export const Chat: React.FC<ChatProps> = ({ currentUser }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    // Load all users except current
    const allUsers = db.users.getAll().filter(u => u.id !== currentUser.id);
    setUsers(allUsers);
    
    // Load chat history
    const allChats = db.chats.getAll();
    setChatHistory(allChats);
  }, [currentUser.id]);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, selectedUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = () => {
    if (!message.trim() || !selectedUser) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      receiverId: selectedUser.id,
      content: message,
      type: 'TEXT',
      timestamp: new Date().toISOString(),
      read: false
    };

    db.chats.send(newMsg);
    setChatHistory([...chatHistory, newMsg]);
    setMessage('');
  };

  const getConversation = () => {
    if (!selectedUser) return [];
    return chatHistory.filter(
      m => (m.senderId === currentUser.id && m.receiverId === selectedUser.id) ||
           (m.senderId === selectedUser.id && m.receiverId === currentUser.id)
    );
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-lg shadow overflow-hidden border border-gray-200">
      {/* User List */}
      <div className="w-1/3 border-r border-gray-200 bg-gray-50">
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search users..."
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="overflow-y-auto h-full">
          {users.map(u => (
            <div
              key={u.id}
              onClick={() => setSelectedUser(u)}
              className={`p-4 flex items-center cursor-pointer hover:bg-gray-100 ${selectedUser?.id === u.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''}`}
            >
              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                {u.name.charAt(0)}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{u.name}</p>
                <p className="text-xs text-gray-500">{u.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
              <div className="flex items-center">
                 <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                    {selectedUser.name.charAt(0)}
                  </div>
                  <h3 className="ml-3 text-lg font-medium text-gray-900">{selectedUser.name}</h3>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {getConversation().length === 0 ? (
                <div className="text-center text-gray-400 mt-10">No messages yet. Say hi!</div>
              ) : (
                getConversation().map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg text-sm ${
                        msg.senderId === currentUser.id
                          ? 'bg-indigo-600 text-white rounded-br-none'
                          : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                      }`}
                    >
                      {msg.content}
                      <p className={`text-[10px] mt-1 text-right ${msg.senderId === currentUser.id ? 'text-indigo-200' : 'text-gray-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <button className="text-gray-400 hover:text-gray-600"><Mic size={20} /></button>
                <button className="text-gray-400 hover:text-gray-600"><ImageIcon size={20} /></button>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  onClick={handleSend}
                  className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageSquare size={48} className="mb-4 text-gray-300" />
            <p>Select a user to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};