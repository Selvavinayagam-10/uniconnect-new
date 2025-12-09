
import React, { useState, useEffect, useRef } from 'react';
import { User, Document, UserRole } from '../types';
import { db } from '../services/db';
import { Upload, FileText, Trash2, Download, Edit, X } from 'lucide-react';

interface RepositoryProps {
  user: User;
}

export const Repository: React.FC<RepositoryProps> = ({ user }) => {
  const [docs, setDocs] = useState<Document[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    courseName: '',
    year: '1',
    semester: '1',
    department: '',
  });

  const [fileData, setFileData] = useState<string>('');
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    refreshDocs();
  }, [user]);

  const refreshDocs = () => {
    let allDocs = db.docs.getAll();
    if (user.role === UserRole.STUDENT && user.department) {
      // Case insensitive match
      allDocs = allDocs.filter(d => d.department.toLowerCase() === user.department?.toLowerCase());
    }
    setDocs(allDocs);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB Limit
        alert('File size exceeds 2MB limit. Please upload a smaller file.');
        if(fileInputRef.current) fileInputRef.current.value = '';
        return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
        setFileData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const openModal = (doc?: Document) => {
    if (doc) {
      setEditingDoc(doc);
      setFormData({
        title: doc.title,
        courseName: doc.courseName,
        year: doc.year,
        semester: doc.semester,
        department: doc.department
      });
      setFileData(doc.url); // Keep existing URL
      setFileName('Existing File');
    } else {
      setEditingDoc(null);
      setFormData({
        title: '',
        courseName: '',
        year: '1',
        semester: '1',
        department: user.department || ''
      });
      setFileData('');
      setFileName('');
      if(fileInputRef.current) fileInputRef.current.value = '';
    }
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingDoc) {
      // Edit Mode
      const updatedDoc: Document = {
        ...editingDoc,
        title: formData.title,
        courseName: formData.courseName,
        year: formData.year,
        semester: formData.semester,
        department: formData.department,
        url: fileData || editingDoc.url
      };
      db.docs.update(updatedDoc);
    } else {
      // Create Mode
      if (!fileData) {
          alert('Please select a file to upload.');
          return;
      }
      if (!user.department && user.role === UserRole.FACULTY) {
        alert("Please update your profile with a department first.");
        return;
      }
      
      const newDoc: Document = {
        id: Date.now().toString(),
        title: formData.title,
        department: user.department || formData.department,
        courseName: formData.courseName,
        year: formData.year,
        semester: formData.semester,
        url: fileData, // Store Base64
        uploadedBy: user.id,
        createdAt: new Date().toLocaleDateString()
      };
      db.docs.create(newDoc);
    }
    
    setShowModal(false);
    refreshDocs();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      db.docs.delete(id);
      refreshDocs();
    }
  };

  const canEdit = (doc: Document) => {
    return user.role === UserRole.ADMIN || (user.role === UserRole.FACULTY && doc.uploadedBy === user.id);
  };

  const canDelete = (doc: Document) => {
     return user.role === UserRole.ADMIN || (user.role === UserRole.FACULTY && doc.uploadedBy === user.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">
            {user.role === UserRole.ADMIN ? 'Central Repository' : 'Academic Repository'}
            </h2>
            <p className="text-gray-500 text-sm">
                {user.role === UserRole.FACULTY ? 'Manage course materials (Max 2MB).' : 'Access academic documents.'}
            </p>
        </div>
        
        {user.role === UserRole.FACULTY && (
          <button
            onClick={() => openModal()}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Upload size={20} className="mr-2" />
            Upload Material
          </button>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-bold">
                   {editingDoc ? 'Edit Document Details' : 'Upload New Document'}
               </h3>
               <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Document Title</label>
                <input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="e.g., Lecture 1 Notes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Course Name</label>
                <input
                  required
                  value={formData.courseName}
                  onChange={(e) => setFormData({...formData, courseName: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="e.g., Computer Networks"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Year</label>
                    <select
                        value={formData.year}
                        onChange={(e) => setFormData({...formData, year: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    >
                        {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Semester</label>
                    <select
                        value={formData.semester}
                        onChange={(e) => setFormData({...formData, semester: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                    </select>
                  </div>
              </div>

              <div>
                 <label className="block text-sm font-medium text-gray-700">Department</label>
                 <input
                   disabled={user.role === UserRole.FACULTY && !editingDoc} 
                   value={formData.department}
                   onChange={(e) => setFormData({...formData, department: e.target.value})}
                   className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-50"
                 />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">File {editingDoc && '(Leave empty to keep existing)'}</label>
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md" 
                />
                <p className="text-xs text-gray-500 mt-1">Max size: 2MB</p>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    {editingDoc ? 'Update Details' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
        <ul className="divide-y divide-gray-200">
          {docs.length === 0 ? (
            <li className="p-6 text-center text-gray-500">No documents found for your department.</li>
          ) : (
            docs.map((doc) => (
              <li key={doc.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                    <FileText size={20} />
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-gray-900">{doc.title}</h4>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                            {doc.courseName}
                        </span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-1 space-x-3">
                         <span>{doc.department}</span>
                         <span>&bull;</span>
                         <span>Year {doc.year}</span>
                         <span>&bull;</span>
                         <span>Sem {doc.semester}</span>
                         <span>&bull;</span>
                         <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* View/Download */}
                  <a 
                    href={doc.url} 
                    download={doc.title} // Prompt download for Base64
                    className="flex items-center px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 rounded hover:bg-indigo-100 transition-colors"
                    title="Download"
                  >
                    <Download size={16} className="mr-1" />
                    <span className="hidden sm:inline">Download</span>
                  </a>

                  {/* Edit */}
                  {canEdit(doc) && (
                    <button 
                        onClick={() => openModal(doc)} 
                        className="text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Edit Details"
                    >
                      <Edit size={18} />
                    </button>
                  )}

                  {/* Delete */}
                  {canDelete(doc) && (
                    <button 
                        onClick={() => handleDelete(doc.id)} 
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};
