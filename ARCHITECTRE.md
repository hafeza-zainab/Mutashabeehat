# System Architecture

## Overview

Quran Similarity Learning Web App is built on a three-tier architecture:
- **Frontend**: React-based UI
- **Backend**: Node.js/Express API
- **Database**: SQLite/PostgreSQL

## Core User Flow

1. User enters Surah and Ayah number
2. System fetches the ayah and all its pairwise similarities
3. Optional filters apply (Section, Part, Surah range)
4. Results display sorted by strength with memory tips

## Backend Architecture

### Models
- **Ayah**: Represents a Quranic verse
- **Similarity**: Stores pairwise similarities between ayahs
- **Tip**: Stores memory differentiation tips

### Controllers
- **ayahController**: Handles ayah retrieval
- **similarityController**: Handles similarity queries and filtering

### Routes
- `/api/ayah`: GET ayah details
- `/api/similarities`: GET similarities with filters

## Database Design

### Normalization
- Similarities always stored with smaller reference first
- Bidirectional lookup logic in backend

### Filtering
- Applied AFTER fetching similarities
- Section and Part filters match ayah metadata
- Range filter uses BETWEEN query

## Frontend Architecture

### Components
- **InputSection**: Surah/Ayah input fields
- **FilterPanel**: Collapsible filter controls
- **ResultsTable**: Displays similar ayahs
- **MemoryTip**: Shows pair-specific memory aids

### Pages
- **MainPage**: Core interface combining all components

### Services
- **api.js**: Centralized API communication

## Data Flow
