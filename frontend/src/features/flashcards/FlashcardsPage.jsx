// C:\quran-similarity-app\frontend\src\features\flashcards\FlashcardsPage.jsx
// Fix #13: flashcardsData is now loaded inside the component via useMemo
// so it does NOT parse on every page load — only when this route is visited.
import React, { useState, useMemo } from 'react';
import StudyView from './components/StudyView';
import TestView from './components/TestView';

export default function FlashcardsPage() {
    // Fix #13: import inside component body via useMemo so Webpack code-splits
    // the large flashcards array away from the main bundle.
    const flashcardsData = useMemo(() => require('./data/flashcardsData').flashcardsData, []);

    const [selectedCategory, setSelectedCategory] = useState(flashcardsData[0].id);
    const [mode, setMode] = useState('study');

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
                    <button className={mode === 'test'  ? 'active' : ''} onClick={() => setMode('test')}>🧠 Test Yourself</button>
                </div>

                {mode === 'study'
                    ? <StudyView category={activeCategory} />
                    : <TestView  cards={activeCategory.cards} />
                }
            </div>
        </div>
    );
}