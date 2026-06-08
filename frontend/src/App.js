//C:\quran-similarity-app\frontend\src\App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './shared/context/AuthContext';
import { AppProvider } from './shared/context/AppContext';
import ProtectedRoute from './shared/components/ProtectedRoute';
import Navbar from './shared/components/Navbar';

import Home from './features/auth/pages/Home';
import LoginPage from './features/auth/pages/LoginPage';
import SignupPage from './features/auth/pages/SignupPage';
import SimilarityPage from './features/similarity/SimilarityPage';
import DiaryPage from './features/diary/DiaryPage';
import FlashcardsPage from './features/flashcards/FlashcardsPage';
import BestMethodPage from './features/auth/pages/BestMethodPage';
import CoachPage from './features/coach/CoachPage';  // ← NEW
import './App.css';

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <div className="app-layout">
            <Navbar />
            <main className="app-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/similarity" element={<ProtectedRoute><SimilarityPage /></ProtectedRoute>} />
                <Route path="/diary" element={<ProtectedRoute><DiaryPage /></ProtectedRoute>} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/flashcards" element={<ProtectedRoute><FlashcardsPage /></ProtectedRoute>} />
                <Route path="/best-method" element={<BestMethodPage />} />
                <Route path="/coach" element={<ProtectedRoute><CoachPage /></ProtectedRoute>} />  {/* ← NEW */}
              </Routes>
            </main>
          </div>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}
export default App;