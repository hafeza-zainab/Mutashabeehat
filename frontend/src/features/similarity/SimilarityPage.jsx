// FILE 3: frontend/src/features/similarity/SimilarityPage.jsx
// Keeps your existing SearchBar/AyahDisplay/SimilarityList components,
// adds coach tip injection and auto-search on navigate from CoachPage.

import React, { useEffect, useRef } from 'react';
import { useLocation }               from 'react-router-dom';
import SearchBar                     from './components/SearchBar';
import AyahDisplay                   from './components/AyahDisplay';
import SimilarityList                from './components/SimilaritiesList';
import SidePanel                     from './components/SidePanel';

export default function SimilarityPage() {
  const location = useLocation();

  // Passed from CoachPage via navigate('/similarity', { state: { ... } })
  const coachTips  = location.state?.coachTips  || {};  // { "surah:ayah": "tip text" }
  const autoSearch = location.state?.autoSearch || false;
  const autoSurah  = location.state?.surah      || null;
  const autoAyah   = location.state?.ayah       || null;

  // SearchBar exposes a trigger function through this ref
  const triggerSearchRef = useRef(null);

  useEffect(() => {
    if (autoSearch && autoSurah && autoAyah && triggerSearchRef.current) {
      setTimeout(() => {
        triggerSearchRef.current(String(autoSurah), String(autoAyah));
      }, 350);
    }
  }, [autoSearch, autoSurah, autoAyah]);

  return (
    <div className="similarity-page-wrapper">
      <SearchBar triggerSearchRef={triggerSearchRef} />

      <div className="similarity-main-grid">
        <div className="similarity-left-col">
          <AyahDisplay />
          <SimilarityList />
        </div>
        <div className="similarity-right-col">
          <SidePanel coachTips={coachTips} />
        </div>
      </div>
    </div>
  );
}