//C:\quran-similarity-app\frontend\src\features\auth\pages\Home.jsx
import React from 'react';
import DashboardCard from '../components/DashboardCard';
import { useAuthContext } from '../../../shared/context/AuthContext';

const Home = () => {
  const { user } = useAuthContext();
  return (
    <div className="home-dashboard-container">
      {/* Changed Title */}
      <div className="welcome-banner">
        <h1>Welcome to the Hifz al-Qur'an Platform</h1>
        {/* Changed Subtitle */}
        <p>Identify structural patterns to strengthen your Hifz retention.</p>
      </div>
      <div className="dashboard-grid">
        {/* Changed Title to Mutashābihāt */}
        <DashboardCard title="Mutashābihāt" description="Search for any Ayah and find its structurally similar pairs." linkTo="/similarity" buttonText="Open Tool" color="#F2C94C" />
        {/* Changed Title to Flashcards (Removed "Mutashabih") */}
        <DashboardCard title="Flashcards" description="Master repetitive verses." linkTo={user ? "/flashcards" : "/login"} buttonText={user ? "Open Flashcards" : "Login to Access"} color={user ? "#10B981" : "#9CA3AF"} />
        <DashboardCard title="My Diary" description="Keep a personal Hifz diary, notes, and teacher feedback." linkTo={user ? "/diary" : "/login"} buttonText={user ? "Open Diary" : "Login to Access"} color={user ? "#3B82F6" : "#9CA3AF"} />
        <DashboardCard title="Best Method For You" description="Discover the most effective Hifz and Murajah techniques tailored to your pace." linkTo="/best-method" buttonText="Explore Methods" color="#004D40" />
      </div>
    </div>
  );
};
export default Home;