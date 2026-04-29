import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { 
  Search, 
  Trash2, 
  PlusCircle, 
  BookOpen,
  XCircle,
  Pin,
  Pencil,
  RotateCcw
} from 'lucide-react';
import { cn, formatSafeDate, safeStorage } from '../lib/utils';
import { AuthContext } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, Timestamp, deleteDoc } from 'firebase/firestore';
import { Note, OperationType } from '../types';
import { handleFirestoreError } from '../lib/utils';

export const Notebook = () => {
  const { user, isDemo } = useContext(AuthContext);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isDemo) {
      const localNotes = JSON.parse(safeStorage.getItem('komorebi_notes') || '[]');
      setNotes(localNotes.map((n: any) => ({
        ...n,
        updatedAt: n.updatedAt?.seconds ? new Timestamp(n.updatedAt.seconds, n.updatedAt.nanoseconds) : Timestamp.now(),
        createdAt: n.createdAt?.seconds ? new Timestamp(n.createdAt.seconds, n.createdAt.nanoseconds) : Timestamp.now()
      })));
      setLoading(false);
      return;
    }

    if (!user) return;
    const notesRef = collection(db, 'users', user.uid, 'notes');
    const q = query(notesRef, orderBy('updatedAt', 'desc'));
    
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
      setNotes(list);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/notes`);
      setLoading(false);
    });

    return () => unsub();
  }, [user, isDemo]);

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const noteData = {
      title: newTitle,
      content: newContent,
      updatedAt: Timestamp.now(),
    };

    if (editingNoteId) {
      if (isDemo) {
        const localNotes = JSON.parse(safeStorage.getItem('komorebi_notes') || '[]');
        const updated = localNotes.map((n: any) => n.id === editingNoteId ? { ...n, ...noteData } : n);
        safeStorage.setItem('komorebi_notes', JSON.stringify(updated));
        setNotes(updated);
      } else if (user) {
        await updateDoc(doc(db, 'users', user.uid, 'notes', editingNoteId), noteData);
      }
    } else {
      const fullNoteData = {
        ...noteData,
        createdAt: Timestamp.now(),
        isPinned: false,
        color: ['bg-[#fdfcf0]', 'bg-[#f5f5f0]', 'bg-[#f0f4f8]', 'bg-[#f9f0ff]', 'bg-[#fff0f0]'][Math.floor(Math.random() * 5)]
      };

      if (isDemo) {
        const localNotes = JSON.parse(safeStorage.getItem('komorebi_notes') || '[]');
        const updated = [{ id: Date.now().toString(), ...fullNoteData }, ...localNotes];
        safeStorage.setItem('komorebi_notes', JSON.stringify(updated));
        setNotes(updated as any);
      } else if (user) {
        await addDoc(collection(db, 'users', user.uid, 'notes'), fullNoteData);
      }
    }

    setNewTitle('');
    setNewContent('');
    setIsAdding(false);
    setEditingNoteId(null);
  };

  const handleEdit = (note: Note) => {
    setNewTitle(note.title);
    setNewContent(note.content);
    setEditingNoteId(note.id || null);
    setIsAdding(true);
  };

  const togglePin = async (note: Note) => {
    if (!note.id) return;
    const newPinned = !note.isPinned;
    
    if (isDemo) {
      const localNotes = JSON.parse(safeStorage.getItem('komorebi_notes') || '[]');
      const updated = localNotes.map((n: any) => n.id === note.id ? { ...n, isPinned: newPinned } : n);
      safeStorage.setItem('komorebi_notes', JSON.stringify(updated));
      setNotes(updated);
    } else if (user) {
      await updateDoc(doc(db, 'users', user.uid, 'notes', note.id), { isPinned: newPinned });
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    if (isDemo) {
      const localNotes = JSON.parse(safeStorage.getItem('komorebi_notes') || '[]');
      const updated = localNotes.filter((n: any) => n.id !== id);
      safeStorage.setItem('komorebi_notes', JSON.stringify(updated));
      setNotes(updated);
    } else if (user) {
      await deleteDoc(doc(db, 'users', user.uid, 'notes', id));
    }
  };

  const filteredNotes = notes
    .filter(n => 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const timeA = a.updatedAt instanceof Timestamp ? a.updatedAt.toMillis() : 0;
      const timeB = b.updatedAt instanceof Timestamp ? b.updatedAt.toMillis() : 0;
      return timeB - timeA;
    });

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-editorial italic text-stone-900 dark:text-stone-100 mb-2">Notebook</h2>
          <p className="text-stone-500 dark:text-stone-400 font-serif italic">Your personal space for Japanese study notes.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl text-sm focus:ring-2 focus:ring-stone-100 dark:focus:ring-stone-700 outline-none transition-all text-stone-900 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-600"
            />
          </div>
          <button 
            onClick={() => {
              setIsAdding(true);
              setEditingNoteId(null);
              setNewTitle('');
              setNewContent('');
            }}
            className="p-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-2xl shadow-xl hover:bg-stone-800 dark:hover:bg-stone-200 transition-all flex items-center gap-2"
          >
            <PlusCircle className="w-6 h-6" />
            <span className="hidden sm:inline font-bold text-xs uppercase tracking-widest">New Note</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-2xl space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-stone-900 dark:bg-stone-100" />
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-editorial italic text-stone-900 dark:text-stone-100">
                {editingNoteId ? 'Edit Note' : 'Create New Note'}
              </h3>
              <button onClick={() => setIsAdding(false)} className="text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <input 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Give your note a title..."
              className="w-full p-4 bg-stone-50 dark:bg-stone-800 border-none rounded-2xl font-bold text-xl outline-none focus:ring-2 focus:ring-stone-100 dark:focus:ring-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-600"
            />
            <textarea 
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Write your thoughts, grammar rules, or vocabulary here..."
              rows={8}
              className="w-full p-4 bg-stone-50 dark:bg-stone-800 border-none rounded-2xl font-serif italic outline-none focus:ring-2 focus:ring-stone-100 dark:focus:ring-stone-700 resize-none text-stone-900 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-600"
            />
            <div className="flex gap-4">
              <button 
                onClick={() => setIsAdding(false)}
                className="flex-1 py-4 bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-full font-bold hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveNote}
                className="flex-1 py-4 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full font-bold shadow-lg hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
              >
                {editingNoteId ? 'Update Note' : 'Save Note'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-20">
          <RotateCcw className="w-8 h-8 text-stone-200 dark:text-stone-800 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.length === 0 ? (
            <div className="col-span-full text-center py-24 bg-white dark:bg-stone-900 rounded-[3rem] border border-stone-50 dark:border-stone-800 shadow-sm">
              <div className="w-20 h-20 bg-stone-50 dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10 text-stone-200 dark:text-stone-700" />
              </div>
              <p className="text-stone-400 dark:text-stone-500 font-editorial italic text-xl">
                {searchQuery ? "No notes match your search." : "Your notebook is empty. Start writing!"}
              </p>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <motion.div 
                key={note.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-8 rounded-[2.5rem] border border-stone-100 dark:border-stone-800 shadow-sm hover:shadow-xl transition-all relative group flex flex-col", 
                  note.color || 'bg-white',
                  "dark:bg-stone-900 dark:border-stone-800",
                  note.isPinned && "ring-2 ring-stone-900 dark:ring-stone-100 ring-offset-4 dark:ring-offset-stone-950"
                )}
              >
                <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => togglePin(note)}
                    className={cn("p-2 rounded-full transition-colors", note.isPinned ? "text-stone-900 dark:text-stone-100 bg-stone-100 dark:bg-stone-800" : "text-stone-300 dark:text-stone-600 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800")}
                  >
                    <Pin className={cn("w-4 h-4", note.isPinned && "fill-current")} />
                  </button>
                  <button 
                    onClick={() => handleEdit(note)}
                    className="p-2 text-stone-300 hover:text-stone-600 hover:bg-stone-50 rounded-full transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => note.id && handleDeleteNote(note.id)}
                    className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-stone-900 mb-4 pr-16">{note.title}</h3>
                  <div className="text-stone-600 font-serif italic text-sm leading-relaxed prose prose-stone max-w-none">
                    <ReactMarkdown>{note.content}</ReactMarkdown>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-stone-900/5 flex justify-between items-center">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-stone-400">
                    {formatSafeDate(note.updatedAt, 'MMM d, yyyy')}
                  </div>
                  {note.isPinned && (
                    <span className="text-[9px] font-bold uppercase tracking-widest text-stone-900 flex items-center gap-1">
                      <Pin className="w-2 h-2 fill-current" /> Pinned
                    </span>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
