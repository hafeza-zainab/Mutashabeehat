// C:\quran-similarity-app\frontend\src\features\tasks\components\DailyTask.jsx
import React, { useState, useEffect } from 'react';
import { getTasks, addTask, updateTask, editTaskTitle, deleteTask } from '../../../shared/services/taskApi';
import '../../../styles/DailyTasks.css';

export default function DailyTasksPage({ activeDate }) {
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState('');
    const [category, setCategory] = useState('murajah');
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');
    
    const refreshTasks = () => {
        getTasks(activeDate).then(res => { 
            if (res.success) setTasks(res.data); 
        });
    };

    useEffect(() => { refreshTasks(); }, [activeDate]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newTask || newTask.length > 60) return;
        const res = await addTask({ title: newTask, category });
        if (res.success) { 
            setNewTask(''); 
            refreshTasks(); // ADDED: Refresh after add
        }
    };
    
    const handleDelete = async (id) => { 
        if(window.confirm("Delete this task?")) {
            await deleteTask(id); 
            refreshTasks(); // ADDED: Refresh after delete
        }
    };
    
    const startEdit = (task) => { 
        setEditingId(task.id); 
        setEditText(task.title); 
    };
    
    const saveEdit = async (id) => { 
        await editTaskTitle(id, editText); 
        setEditingId(null); 
        refreshTasks(); // ADDED: Refresh after edit
    };

    const handleStatusChange = async (id, status) => { 
        await updateTask(id, status); 
        refreshTasks(); // ADDED: Refresh after status change
    };

    return (
        <div className="diary-card">
            <h3>Tasks & Targets</h3>
            <form onSubmit={handleAdd} className="task-form">
                <select value={category} onChange={e => setCategory(e.target.value)}>
                    {['murajah', 'juzz_hali', 'jadeed', 'tasmee', 'general'].map(c => <option key={c} value={c}>{c.replace('_', ' ').toUpperCase()}</option>)}
                </select>
                <div className="input-wrapper">
                    <input type="text" placeholder="e.g., Revise Juzz 10" value={newTask} onChange={e => { if(e.target.value.length <= 60) setNewTask(e.target.value); }} required maxLength={60} />
                    <span className="char-limit">{newTask.length}/60</span>
                </div>
                <button type="submit">Add</button>
            </form>
            <div className="task-list">
                {tasks.length === 0 ? <p className="empty-tasks">No tasks set.</p> :
                    tasks.map(task => (
                        <div key={task.id} className={`task-item ${task.status}`}>
                            {editingId === task.id ? (
                                <div className="edit-wrapper">
                                    <input type="text" value={editText} onChange={e => setEditText(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && saveEdit(task.id)} />
                                    <button className="icon-btn save" onClick={() => saveEdit(task.id)}>✓</button>
                                </div>
                            ) : (<div className="task-title">{task.title}</div>)}
                            <span className={`task-badge ${task.category}`}>{task.category.replace('_', ' ')}</span>
                            <div className="task-actions">
                                {editingId !== task.id && <button className="icon-btn edit" onClick={() => startEdit(task)}>✏️</button>}
                                <button className="icon-btn delete" onClick={() => handleDelete(task.id)}>🗑️</button>
                                <select value={task.status} onChange={e => handleStatusChange(task.id, e.target.value)} className="task-status-select">
                                    <option value="pending">Not Started</option><option value="in_progress">In Progress</option><option value="completed">Completed ✓</option>
                                </select>
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    );
}