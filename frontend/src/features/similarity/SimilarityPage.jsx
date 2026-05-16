//C:\quran-similarity-app\frontend\src\features\similarity\SimilarityPage.jsx
import React from 'react';
import SearchBar from './components/SearchBar';
import AyahDisplay from './components/AyahDisplay';
import SimilarityList from './components/SimilaritiesList';
import SidePanel from './components/SidePanel';

export default function SimilarityPage() {
  return (
    <div className="similarity-page-wrapper">
      {/* Search bar spans full width at the top */}
      <SearchBar />
      
      {/* Grid: Left column (Source + Results), Right column (Side Panel) */}
      <div className="similarity-main-grid">
        <div className="similarity-left-col">
          <AyahDisplay />
          <SimilarityList />
        </div>
        <div className="similarity-right-col">
          <SidePanel />
        </div>
      </div>
    </div>
  );
}