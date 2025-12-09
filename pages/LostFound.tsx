
import React, { useState, useEffect, useRef } from 'react';
import { User, LostAndFoundItem } from '../types';
import { db } from '../services/db';
import { Search, Tag, Image as ImageIcon, Video as VideoIcon, X } from 'lucide-react';

interface LostFoundProps {
  user: User;
}

export const LostFound: React.FC<LostFoundProps> = ({ user }) => {
  const [items, setItems] = useState<LostAndFoundItem[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'LOST' | 'FOUND'>('ALL');
  const [showForm, setShowForm] = useState(false);

  // Form
  const [formData, setFormData] = useState({ title: '', description: '', type: 'LOST' as 'LOST'|'FOUND' });
  
  // Media State
  const [mediaData, setMediaData] = useState<string>('');
  const [mediaType, setMediaType] = useState<'NONE' | 'IMAGE' | 'VIDEO'>('NONE');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    refreshItems();
  }, []);

  const refreshItems = () => {
    setItems(db.lostFound.getAll());
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB Limit
        alert('File size exceeds 2MB limit. Please upload a smaller file.');
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

  const handleReport = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: LostAndFoundItem = {
      id: Date.now().toString(),
      ...formData,
      imageUrl: mediaType === 'IMAGE' ? mediaData : undefined,
      videoUrl: mediaType === 'VIDEO' ? mediaData : undefined,
      reportedBy: user.id,
      status: 'OPEN',
      createdAt: new Date().toISOString()
    };
    db.lostFound.create(newItem);
    
    // Reset
    setShowForm(false);
    setFormData({ title: '', description: '', type: 'LOST' });
    setMediaData('');
    setMediaType('NONE');
    setFileName('');
    
    refreshItems();
    alert('Report submitted successfully!');
  };

  const filteredItems = filter === 'ALL' ? items : items.filter(i => i.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Lost & Found</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 shadow"
        >
          Report Item
        </button>
      </div>

      <div className="flex space-x-2 bg-white p-2 rounded shadow-sm w-fit border border-gray-200">
        {['ALL', 'LOST', 'FOUND'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${filter === f ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map(item => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-lg shadow-sm relative overflow-hidden flex flex-col">
            <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold text-white rounded-bl-lg z-10 ${item.type === 'LOST' ? 'bg-red-500' : 'bg-green-500'}`}>
              {item.type}
            </div>
            
            <div className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden border-b border-gray-100">
                {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                ) : item.videoUrl ? (
                    <video src={item.videoUrl} className="w-full h-full object-cover" controls />
                ) : (
                    <div className="text-gray-400 flex flex-col items-center">
                        <Tag size={32} />
                        <span className="text-xs mt-1">No Image</span>
                    </div>
                )}
            </div>

            <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-lg text-gray-900 mb-1">{item.title}</h3>
                <p className="text-gray-600 text-sm mb-4 flex-1">{item.description}</p>
                <div className="text-xs text-gray-500 flex items-center justify-between border-t pt-3 mt-auto">
                <span>Reported: {new Date(item.createdAt).toLocaleDateString()}</span>
                <span className={`px-2 py-0.5 rounded-full ${item.status === 'OPEN' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {item.status}
                </span>
                </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Report Item</h3>
            <form onSubmit={handleReport} className="space-y-4">
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                 <select 
                    className="w-full border border-gray-300 p-2 rounded focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as 'LOST' | 'FOUND'})}
                >
                    <option value="LOST">Lost Something</option>
                    <option value="FOUND">Found Something</option>
                </select>
              </div>
              
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    required
                    placeholder="e.g. Blue Backpack"
                    className="w-full border border-gray-300 p-2 rounded focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
              </div>
              
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    required
                    placeholder="Describe the item, location, date..."
                    rows={3}
                    className="w-full border border-gray-300 p-2 rounded focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Media</label>
                  <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                   
                   {mediaData && (
                    <div className="mb-3 relative inline-block border rounded bg-gray-50">
                        {mediaType === 'IMAGE' && (
                            <img src={mediaData} alt="Preview" className="h-32 w-auto object-contain" />
                        )}
                        {mediaType === 'VIDEO' && (
                            <video src={mediaData} className="h-32 w-auto" controls />
                        )}
                        <button 
                            type="button"
                            onClick={() => { setMediaType('NONE'); setMediaData(''); setFileName(''); }} 
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"
                        >
                            <X size={12} />
                        </button>
                    </div>
                   )}

                   <div className="flex space-x-2">
                        <button 
                            type="button"
                            onClick={() => triggerFileUpload('image')}
                            className={`flex items-center space-x-1 px-3 py-2 border rounded-md text-sm ${mediaType === 'IMAGE' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                        >
                            <ImageIcon size={16} />
                            <span>Add Photo</span>
                        </button>
                        <button 
                            type="button"
                            onClick={() => triggerFileUpload('video')}
                            className={`flex items-center space-x-1 px-3 py-2 border rounded-md text-sm ${mediaType === 'VIDEO' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                        >
                            <VideoIcon size={16} />
                            <span>Add Video</span>
                        </button>
                   </div>
                   {fileName && <p className="text-xs text-gray-500 mt-1">{fileName}</p>}
                   <p className="text-xs text-gray-400 mt-1">Max 2MB</p>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded border border-gray-300">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 shadow-sm">Submit Report</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
