//C:\quran-similarity-app\frontend\src\features\flashcards\components\StudyView.jsx
import React from 'react';

export default function StudyView({ category }) {
  return (
    <div className="study-view-container" dangerouslySetInnerHTML={{ __html: category.study }} />
  );
}