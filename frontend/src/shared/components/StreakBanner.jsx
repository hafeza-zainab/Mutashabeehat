//C:\quran-similarity-app\frontend\src\shared\components\StreakBanner.jsx
import React, { useState, useEffect } from "react";
import { getStreak } from "../services/taskApi";
import "../../styles/StreakBanner.css";

const QUOTES = [
  "The deed dearest to Allah is that which is most consistent, even if it is small.",
  "Planning is one half of life.",
  "Seeking knowledge is obligatory upon every Muslim.",
  "Al Quran itself is the cure.",
  "Speak al-Haq even though it may be bitter.",
  "Taufeeq always accompanies good intent.",
  "Facilitate, do not Hinder."
];

const StreakBanner = () => {
  const [streak, setStreak] = useState(0);
  const [dailyQuote, setDailyQuote] = useState("");

  useEffect(() => {
    const fetchStreak = async () => {
      try {
        const res = await getStreak();
        if (res?.success) setStreak(res.data.streak);
      } catch (err) {
        console.error("Failed to fetch streak:", err);
      }
    };

    fetchStreak();

    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

    setDailyQuote(QUOTES[dayOfYear % QUOTES.length]);
  }, []);

  return (
    <div className="streak-banner">
      <div className="streak-info">
        <div className="streak-fire">🔥</div>
        <div>
          <h2>{streak} Days Consistent!</h2>
          <p>Keep up the amazing work.</p>
        </div>
      </div>
      <div className="daily-quote">
        <p>"{dailyQuote}"</p>
      </div>
    </div>
  );
};

export default StreakBanner;