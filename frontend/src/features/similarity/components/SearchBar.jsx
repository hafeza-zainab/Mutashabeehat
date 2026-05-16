// C:\quran-similarity-app\frontend\src\features\similarity\components\SearchBar.jsx
import React, { useState, useEffect } from 'react';
import { fetchSurahs, fetchAyahs, fetchSimilarities } from '../../../shared/services/similarityApi';
import { useAppContext } from '../../../shared/context/AppContext';
import MARHALA_MAP from '../../../shared/utils/marhalaMapper';
import '../../../styles/SearchBar.css';

export default function SearchBar() {
    const { setSourceAyah, setResults, setIsLoading } = useAppContext();
    const [surahs, setSurahs] = useState([]);
    const [ayahs, setAyahs] = useState([]);
    const [selectedSurah, setSelectedSurah] = useState('');
    const [selectedAyah, setSelectedAyah] = useState('');
    const [inputError, setInputError] = useState('');
    const [marhala, setMarhala] = useState('');
    const [juzz, setJuzz] = useState([]);

    useEffect(() => {
        fetchSurahs().then(data => setSurahs(data));
    }, []);

    useEffect(() => {
        if (selectedSurah) {
            fetchAyahs(selectedSurah).then(data => {
                setAyahs(data);
                setSelectedAyah(''); // Reset ayah when surah changes
                setInputError('');
            });
        } else {
            setAyahs([]);
            setSelectedAyah('');
        }
    }, [selectedSurah]);

    const handleSearch = async (e) => {
        e.preventDefault();
        setInputError('');
        
        const surahNum = parseInt(selectedSurah);
        const ayahNum = parseInt(selectedAyah);
        
        if (!surahNum || !ayahNum) {
            setInputError("Please select a Surah and Ayah.");
            return;
        }
        
        const maxAyah = ayahs.length > 0 ? ayahs[ayahs.length - 1].ayah : 0;
        
        if (ayahNum > maxAyah) {
            setInputError(`Surah ${selectedSurah} only has ${maxAyah} Ayahs.`);
            return;
        }
        
        if (ayahNum < 1) {
            setInputError("Ayah must be 1 or greater.");
            return;
        }
        
        setIsLoading(true);
        try {
            const res = await fetchSimilarities(surahNum, ayahNum, marhala, juzz.join(','));
            if (res.success) {
                setSourceAyah(res.data.source);
                setResults(res.data.results);
                if (res.data.results.length === 0) {
                    setInputError(`No similarities found for Surah ${selectedSurah}, Ayah ${ayahNum}.`);
                }
            } else {
                setInputError("Failed to fetch: " + res.message);
            }
        } catch (err) {
            setInputError("Network error. Is the backend server running?");
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarhalaChange = (e) => {
        setMarhala(e.target.value);
        setJuzz([]);
    };

    return (
        <div className="search-container">
            <form onSubmit={handleSearch} className="search-form">
                {/* Surah Dropdown */}
                <select 
                    value={selectedSurah} 
                    onChange={(e) => setSelectedSurah(e.target.value)} 
                    className="surah-select"
                >
                    <option value="">Select Surah</option>
                    {surahs.map(s => (
                        <option key={s.surah} value={s.surah}>
                            {s.surah} - {s.name}
                        </option>
                    ))}
                </select>

                {/* Ayah Dropdown - Changed from datalist to select */}
                <select 
                    value={selectedAyah} 
                    onChange={(e) => setSelectedAyah(e.target.value)} 
                    className="ayah-select"
                    disabled={ayahs.length === 0}
                    required
                >
                    <option value="">
                        {ayahs.length === 0 ? 'Select Surah First' : 'Select Ayah'}
                    </option>
                    {ayahs.map(a => (
                        <option key={a.ayah} value={a.ayah}>
                            Ayah {a.ayah}
                        </option>
                    ))}
                </select>

                <button 
                    type="submit" 
                    disabled={!selectedSurah || !selectedAyah}
                >
                    Find Similarities
                </button>
            </form>

            {inputError && (
                <div className="ui-error-message">⚠️ {inputError}</div>
            )}

            <div className="filters">
                <select value={marhala} onChange={handleMarhalaChange}>
                    <option value="">Full Quran</option>
                    {Object.keys(MARHALA_MAP).map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>
                
                {marhala && (
                    <select 
                        multiple 
                        value={juzz} 
                        onChange={(e) => setJuzz(Array.from(e.target.selectedOptions, o => o.value))}
                    >
                        {MARHALA_MAP[marhala].map(j => (
                            <option key={j} value={j}>Juzz {j}</option>
                        ))}
                    </select>
                )}
            </div>
        </div>
    );
}