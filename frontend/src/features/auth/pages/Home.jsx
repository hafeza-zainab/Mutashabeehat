import React from 'react';
import DashboardCard from '../components/DashboardCard';
import { useAuthContext } from '../../../shared/context/AuthContext';

const Home = () => {
  const { user } = useAuthContext();
  return (
    <div className="home-dashboard-container">
      <div className="welcome-banner">
        <h1>Welcome to the Hifz al-Qur'an Platform</h1>
        <p>Identify structural patterns to strengthen your Hifz retention.</p>
      </div>
      <div className="dashboard-grid">
        <DashboardCard
          title="Mutashābihāt"
          description="Search for any Ayah and find its structurally similar pairs."
          linkTo="/similarity"
          buttonText="Open Tool"
          color="#F2C94C"
        />
        <DashboardCard
          title="Flashcards"
          description="Master repetitive verses."
          linkTo={user ? "/flashcards" : "/login"}
          buttonText={user ? "Open Flashcards" : "Login to Access"}
          color={user ? "#10B981" : "#9CA3AF"}
        />
        <DashboardCard
          title="My Diary"
          description="Keep a personal Hifz diary, notes, and teacher feedback."
          linkTo={user ? "/diary" : "/login"}
          buttonText={user ? "Open Diary" : "Login to Access"}
          color={user ? "#3B82F6" : "#9CA3AF"}
        />
        <DashboardCard
          title="Ustadh AI"
          description="Your personal Hifz coach. Get help with scheduling, difficult pages, similar verses, motivation, and step-by-step memorization guidance."
          linkTo={user ? "/coach" : "/login"}
          buttonText={user ? "Open Coach" : "Login to Access"}
          color={user ? "#004D40" : "#9CA3AF"}
        />
        <DashboardCard
          title="Best Method For You"
          description="Discover the most effective Hifz and Murajah techniques tailored to your pace."
          linkTo="/best-method"
          buttonText="Explore Methods"
          color="#7C3AED"
        />
      </div>
    </div>
  );
};
export default Home;