
import React, { useState, useEffect, useRef } from 'react';
import { User, Post, UserRole, ChatMessage, Comment } from '../types';
import { db } from '../services/db';
import { ThumbsUp, MessageCircle, Trash2, Check, X, Share2, Image as ImageIcon, Video as VideoIcon, Send, Upload, MoreHorizontal } from 'lucide-react';

interface PostsProps {
  user: User;
}

export const Posts: React.FC<PostsProps> = ({ user }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newContent, setNewContent] = useState('');
  
  // Media State
  const [mediaData, setMediaData] = useState<string>(''); // Base64 string
  const [mediaType, setMediaType] = useState<'NONE' | 'IMAGE' | 'VIDEO'>('NONE');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [postToShare, setPostToShare] = useState<Post | null>(null);
  const [usersToShareWith, setUsersToShareWith] = useState<User[]>([]);

  // Comment State
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    refreshPosts();
  }, []);

  const refreshPosts = () => {
    let allPosts = db.posts.getAll();
    if (user.role === UserRole.STUDENT) {
       allPosts = allPosts.filter(p => p.status === 'APPROVED' || p.userId === user.id);
    }
    setPosts(allPosts);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB Limit
        alert('File size exceeds 2MB. Please upload smaller files.');
        if(fileInputRef.current) fileInputRef.current.value = '';
        return;
    }

    setFileName(file.name);
    
    if (file.type.startsWith('image/')) {
        setMediaType('IMAGE');
    } else if (file.type.startsWith('video/')) {
        setMediaType('VIDEO');
    } else {
        alert('Unsupported file type');
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
        setMediaData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileUpload = (type: 'image' | 'video') => {
      if (fileInputRef.current) {
          fileInputRef.current.accept = type === 'image' ? 'image/*' : 'video/*';
          fileInputRef.current.click();
      }
  };

  const handleCreatePost = () => {
    if (!newContent.trim() && !mediaData) return;

    const newPost: Post = {
      id: Date.now().toString(),
      userId: user.id,
      content: newContent,
      image: mediaType === 'IMAGE' ? mediaData : undefined,
      video: mediaType === 'VIDEO' ? mediaData : undefined,
      likes: [],
      comments: [],
      status: user.role === UserRole.STUDENT ? 'PENDING' : 'APPROVED',
      createdAt: new Date().toISOString()
    };
    
    db.posts.create(newPost);
    
    setNewContent('');
    setMediaData('');
    setMediaType('NONE');
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';

    refreshPosts();
    if (user.role === UserRole.STUDENT) {
      alert('Post submitted for Faculty approval.');
    }
  };

  const handleDeletePost = (id: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      db.posts.delete(id);
      refreshPosts();
    }
  };

  const updateStatus = (post: Post, status: 'APPROVED' | 'REJECTED') => {
    post.status = status;
    db.posts.update(post);
    refreshPosts();
  };

  const toggleLike = (post: Post) => {
      const idx = post.likes.indexOf(user.id);
      if (idx === -1) post.likes.push(user.id);
      else post.likes.splice(idx, 1);
      db.posts.update(post);
      refreshPosts();
  };

  const toggleComments = (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
    } else {
      setExpandedPostId(postId);
      setCommentText(''); 
    }
  };

  const handleAddComment = (post: Post) => {
    if (!commentText.trim()) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      userId: user.id,
      content: commentText,
      createdAt: new Date().toISOString()
    };

    const updatedPost = {
      ...post,
      comments: [...post.comments, newComment]
    };

    db.posts.update(updatedPost);
    setCommentText('');
    refreshPosts();
  };

  const handleDeleteComment = (post: Post, commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    const updatedComments = post.comments.filter(c => c.id !== commentId);
    const updatedPost = { ...post, comments: updatedComments };
    
    db.posts.update(updatedPost);
    refreshPosts();
  };

  const handleShareClick = (post: Post) => {
    setPostToShare(post);
    const allUsers = db.users.getAll().filter(u => u.id !== user.id);
    setUsersToShareWith(allUsers);
    setShowShareModal(true);
  };

  const confirmShare = (receiverId: string) => {
    if (!postToShare) return;
    
    const content = `Shared a Post:\n"${postToShare.content}"\n${postToShare.image ? '[Image Attached]' : ''} ${postToShare.video ? '[Video Attached]' : ''}`;
    
    const msg: ChatMessage = {
      id: Date.now().toString(),
      senderId: user.id,
      receiverId: receiverId,
      content: content,
      type: 'TEXT',
      timestamp: new Date().toISOString(),
      read: false
    };
    
    db.chats.send(msg);
    alert('Post shared via Chat!');
    setShowShareModal(false);
    setPostToShare(null);
  };

  const getUserName = (id: string) => {
    const u = db.users.getById(id);
    return u ? u.name : 'Unknown User';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <textarea
          className="w-full border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
          rows={3}
          placeholder="What's on your mind? Share text, photos, or videos..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
        />
        
        <input 
            type="file" 
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileSelect}
        />

        {mediaData && (
           <div className="mt-3 relative inline-block">
              {mediaType === 'IMAGE' && (
                  <img src={mediaData} alt="Preview" className="h-32 w-auto rounded border border-gray-200" />
              )}
              {mediaType === 'VIDEO' && (
                  <video src={mediaData} className="h-32 w-auto rounded border border-gray-200" controls />
              )}
              <button 
                onClick={() => { setMediaType('NONE'); setMediaData(''); setFileName(''); }} 
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"
              >
                <X size={12} />
              </button>
              <p className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">{fileName}</p>
           </div>
        )}

        <div className="mt-3 flex justify-between items-center">
          <div className="flex space-x-2">
             <button 
                onClick={() => triggerFileUpload('image')}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm ${mediaType === 'IMAGE' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
             >
                <ImageIcon size={18} />
                <span>Photo</span>
             </button>
             <button 
                onClick={() => triggerFileUpload('video')}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm ${mediaType === 'VIDEO' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
             >
                <VideoIcon size={18} />
                <span>Video</span>
             </button>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="text-xs text-gray-500 hidden sm:inline">
                {user.role === UserRole.STUDENT ? 'Requires Approval' : 'Public Post'}
            </span>
            <button
                onClick={handleCreatePost}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
            >
                Post
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {posts.length === 0 && <p className="text-center text-gray-500">No posts yet.</p>}
        {posts.map(post => (
          <div key={post.id} className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                   <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                       {getUserName(post.userId).charAt(0)}
                   </div>
                   <div className="ml-3">
                       <p className="text-sm font-medium text-gray-900">{getUserName(post.userId)}</p>
                       <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                   </div>
                </div>
                
                {post.status === 'PENDING' && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">Pending Faculty Approval</span>
                )}

                {(user.role === UserRole.ADMIN || post.userId === user.id) && (
                    <button 
                      onClick={() => handleDeletePost(post.id)} 
                      className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-gray-100 transition-colors" 
                      title="Delete Post"
                    >
                        <Trash2 size={18} />
                    </button>
                )}
              </div>
              
              <p className="text-gray-800 whitespace-pre-wrap mb-4">{post.content}</p>

              {post.image && (
                 <img src={post.image} alt="Post content" className="w-full h-auto max-h-96 object-contain rounded-lg mb-4 bg-gray-50 border border-gray-100" />
              )}
              {post.video && (
                 <video src={post.video} controls className="w-full h-auto max-h-96 rounded-lg mb-4 bg-black" />
              )}

              {post.status === 'PENDING' && (user.role === UserRole.ADMIN || user.role === UserRole.FACULTY) && (
                <div className="mb-4 flex space-x-2 border p-2 rounded bg-gray-50">
                  <span className="text-sm text-gray-600 flex items-center mr-2 font-medium">Approval Required:</span>
                  <button onClick={() => updateStatus(post, 'APPROVED')} className="px-3 py-1 bg-green-100 text-green-700 rounded flex items-center hover:bg-green-200 text-sm">
                    <Check size={14} className="mr-1" /> Approve
                  </button>
                  <button onClick={() => updateStatus(post, 'REJECTED')} className="px-3 py-1 bg-red-100 text-red-700 rounded flex items-center hover:bg-red-200 text-sm">
                    <X size={14} className="mr-1" /> Reject
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                 <div className="flex space-x-4 sm:space-x-6 w-full">
                    <button onClick={() => toggleLike(post)} className={`flex items-center text-sm font-medium ${post.likes.includes(user.id) ? 'text-indigo-600' : 'text-gray-500 hover:text-indigo-600'}`}>
                        <ThumbsUp size={18} className="mr-1.5" /> <span className="hidden sm:inline">Likes</span> ({post.likes.length})
                    </button>
                    
                    <button 
                      onClick={() => toggleComments(post.id)} 
                      className={`flex items-center text-sm font-medium ${expandedPostId === post.id ? 'text-indigo-600' : 'text-gray-500 hover:text-indigo-600'}`}
                    >
                        <MessageCircle size={18} className="mr-1.5" /> <span className="hidden sm:inline">Comments</span> ({post.comments.length})
                    </button>

                    <button onClick={() => handleShareClick(post)} className="flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 ml-auto sm:ml-0">
                        <Share2 size={18} className="mr-1.5" /> <span className="hidden sm:inline">Share</span>
                    </button>
                 </div>
              </div>

              {expandedPostId === post.id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                    {post.comments.length === 0 && <p className="text-xs text-gray-400 text-center">No comments yet. Be the first!</p>}
                    {post.comments.map(comment => (
                      <div key={comment.id} className="flex space-x-2 text-sm">
                        <div className="font-bold text-gray-700">{getUserName(comment.userId)}:</div>
                        <div className="flex-1 text-gray-800 break-words">{comment.content}</div>
                        {(user.role === UserRole.ADMIN || comment.userId === user.id) && (
                          <button onClick={() => handleDeleteComment(post, comment.id)} className="text-gray-400 hover:text-red-500">
                             <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="Write a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post)}
                    />
                    <button 
                      onClick={() => handleAddComment(post)}
                      className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-indigo-700"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-semibold text-gray-700">Share to Chat</h3>
                    <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>
                <div className="p-0 max-h-96 overflow-y-auto">
                    {usersToShareWith.map(u => (
                        <button 
                            key={u.id}
                            onClick={() => confirmShare(u.id)}
                            className="w-full flex items-center p-3 hover:bg-indigo-50 transition-colors border-b last:border-0"
                        >
                            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-600">
                                {u.name.charAt(0)}
                            </div>
                            <div className="ml-3 text-left">
                                <p className="text-sm font-medium text-gray-800">{u.name}</p>
                                <p className="text-xs text-gray-500">{u.role}</p>
                            </div>
                            <Send size={16} className="ml-auto text-gray-400" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
