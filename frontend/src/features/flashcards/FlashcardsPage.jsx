//C:\quran-similarity-app\frontend\src\features\flashcards\FlashcardsPage.jsx
import React, { useState } from 'react';
import { flashcardsData } from './data/flashcardsData';
import StudyView from './components/StudyView';
import TestView from './components/TestView';

export default function FlashcardsPage() {
  const [selectedCategory, setSelectedCategory] = useState(flashcardsData[0].id);
  const [mode, setMode] = useState('study'); // 'study' or 'test'

  const activeCategory = flashcardsData.find(c => c.id === selectedCategory);

  return (
    <div className="flashcards-page-wrapper">
      <div className="flashcards-sidebar">
        <h2 style={{ marginBottom: '20px', color: '#004D40' }}>📚 Master Mutashābihāt</h2>
        
        {flashcardsData.map(cat => (
          <button 
            key={cat.id} 
            className={`sidebar-btn ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => { setSelectedCategory(cat.id); setMode('study'); }}
          >
            {cat.title}
          </button>
        ))}
      </div>

      <div className="flashcards-main-content">
        <h1>{activeCategory.title}</h1>
        
        <div className="mode-toggle">
          <button className={mode === 'study' ? 'active' : ''} onClick={() => setMode('study')}>📖 Study Material</button>
          <button className={mode === 'test' ? 'active' : ''} onClick={() => setMode('test')}>🧠 Test Yourself</button>
        </div>

        {mode === 'study' ? <StudyView category={activeCategory} /> : <TestView cards={activeCategory.cards} />}
      </div>
    </div>
  );
}