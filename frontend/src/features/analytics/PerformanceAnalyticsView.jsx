import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { getTrend, getDeepDive } from './../../shared/services/analyticsApi';
import QuranMapView from './components/QuranMapView';
import './../../styles/PerformanceAnalyticsView.css';

export default function PerformanceAnalyticsView({ activeDate }) {
    const [selectedType, setSelectedType] = useState('murajah');
    const [deepDiveRange, setDeepDiveRange] = useState('7d');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [useCustomRange, setUseCustomRange] = useState(false);
    const [trendRange, setTrendRange] = useState('7d');
    const [trendData, setTrendData] = useState([]);
    const [deepDiveData, setDeepDiveData] = useState([]);
    const [activeTab, setActiveTab] = useState('assessment');
    const [selectedBarIndex, setSelectedBarIndex] = useState(null);

    const formatDate = (dateStr) => { if (!dateStr) return ''; try { return new Date(dateStr).toLocaleDateString('en-GB'); } catch { return dateStr; } };

    useEffect(() => {
        if (useCustomRange && (!customStart || !customEnd)) return;
        const loadTrend = async () => {
            try { 
                const res = await getTrend(trendRange, customStart, customEnd); 
                if (res.success) setTrendData(res.data.map(d => ({ ...d, date: formatDate(d.date), percentage: Number(d.percentage) }))); 
                else setTrendData([]); 
            } catch { setTrendData([]); }
        };
        loadTrend();
    }, [trendRange, customStart, customEnd, useCustomRange]);

    useEffect(() => {
        const loadDeepDive = async () => {
            try {
                // Juzz filter completely removed from API call
                const res = await getDeepDive(selectedType, null, deepDiveRange);
                setDeepDiveData(res.success ? (res.data || []) : []);
            } catch { setDeepDiveData([]); }
        };
        loadDeepDive();
    }, [selectedType, deepDiveRange]);

    const chartData = useMemo(() => {
        const validData = deepDiveData.filter(d => d.log_date && d.log_date.length > 5);

        // Murajah: Y-Axis = Juzz
        if (selectedType === 'murajah') {
            const grouped = {};
            validData.forEach(log => {
                const match = log.range_from?.match(/Juzz\s+(\d+)/);
                if (!match) return;
                const name = `Juzz ${match[1]}`;
                if (!grouped[name]) grouped[name] = { total: 0, count: 0, logs: [] };
                grouped[name].total += log.score;
                grouped[name].count += 1;
                grouped[name].logs.push(log);
            });
            return Object.entries(grouped)
                .sort((a, b) => parseInt(a[0].match(/\d+/)?.[0] || 0) - parseInt(b[0].match(/\d+/)?.[0] || 0))
                .map(([name, val]) => ({ name, avgScore: Number((val.total / val.count).toFixed(2)), sessions: val.count, logs: val.logs, isGrouped: true }));
        } 
        
        // Tasmee: Y-Axis = Juzz
        else if (selectedType === 'tasmee') {
            const grouped = {};
            validData.forEach(log => {
                const match = log.range_from?.match(/Juzz\s+(\d+)/);
                if (!match) return;
                const name = `Juzz ${match[1]}`;
                if (!grouped[name]) grouped[name] = { total: 0, count: 0, logs: [] };
                grouped[name].total += log.score;
                grouped[name].count += 1;
                grouped[name].logs.push(log);
            });
            return Object.entries(grouped)
                .sort((a, b) => parseInt(a[0].match(/\d+/)?.[0] || 0) - parseInt(b[0].match(/\d+/)?.[0] || 0))
                .map(([name, val]) => ({ name, avgScore: Number((val.total / val.count).toFixed(2)), sessions: val.count, logs: val.logs, isGrouped: true }));
        }

        // Jadeed: Y-Axis = Month
        else if (selectedType === 'jadeed') {
            const grouped = {};
            validData.forEach(log => {
                const dateObj = new Date(log.log_date + 'T00:00:00');
                const monthYear = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); 
                if (!grouped[monthYear]) grouped[monthYear] = { total: 0, count: 0, logs: [] };
                grouped[monthYear].total += log.score;
                grouped[monthYear].count += 1;
                grouped[monthYear].logs.push(log);
            });
            return Object.entries(grouped).map(([name, val]) => ({ name, avgScore: Number((val.total / val.count).toFixed(2)), sessions: val.count, logs: val.logs, isGrouped: true }));
        }

        // Juzz Hali: Y-Axis = Month
        else if (selectedType === 'juzz_hali') {
            const grouped = {};
            validData.forEach(log => {
                const dateObj = new Date(log.log_date + 'T00:00:00');
                const monthYear = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); 
                if (!grouped[monthYear]) grouped[monthYear] = { total: 0, count: 0, logs: [] };
                grouped[monthYear].total += log.score;
                grouped[monthYear].count += 1;
                grouped[monthYear].logs.push(log);
            });
            return Object.entries(grouped).map(([name, val]) => ({ name, avgScore: Number((val.total / val.count).toFixed(2)), sessions: val.count, logs: val.logs, isGrouped: true }));
        }

        else if (selectedType === 'ikhtebar') {
            const grouped = {};
            validData.forEach(log => {
                const match = log.range_from?.match(/Juzz\s+(\d+)/);
                const name = match ? `Juzz ${match[1]}` : "Unknown";
                if (!grouped[name]) grouped[name] = { total: 0, count: 0, logs: [] };
                grouped[name].total += log.score;
                grouped[name].count += 1;
                grouped[name].logs.push(log);
            });
            return Object.entries(grouped).sort((a, b) => parseInt(a[0].match(/\d+/)?.[0] || 0) - parseInt(b[0].match(/\d+/)?.[0] || 0)).map(([name, val]) => ({ name, avgScore: Number((val.total / val.count).toFixed(2)), sessions: val.count, logs: val.logs, isGrouped: true }));
        }

        return [];
    }, [deepDiveData, selectedType]);

    // --- PANEL LOGIC HELPERS ---
    const getMurajahPanelData = (data) => {
        const groupedByDate = {};
        data.logs.forEach(log => {
            if (!groupedByDate[log.log_date]) groupedByDate[log.log_date] = { total: 0, count: 0 };
            groupedByDate[log.log_date].total += log.score;
            groupedByDate[log.log_date].count += 1;
        });
        return Object.entries(groupedByDate).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 10)
            .map(([date, d]) => ({ date: formatDate(date), avgScore: Number((d.total / d.count).toFixed(2)) }));
    };

    const getTasmeePanelData = (data) => {
        const groupedByDate = {};
        data.logs.forEach(log => {
            if (!groupedByDate[log.log_date]) groupedByDate[log.log_date] = { total: 0, count: 0, pages: [] };
            groupedByDate[log.log_date].total += log.score;
            groupedByDate[log.log_date].count += 1;
            const pageMatch = log.range_from?.match(/Page\s*(\d+)/i);
            if (pageMatch) groupedByDate[log.log_date].pages.push(parseInt(pageMatch[1]));
        });
        return Object.entries(groupedByDate).sort((a, b) => b[0].localeCompare(a[0]))
            .map(([date, d]) => {
                d.pages.sort((a, b) => a - b);
                const minP = d.pages[0]; const maxP = d.pages[d.pages.length - 1];
                const pageRange = minP === maxP ? `Page ${minP}` : `Pages ${minP} to ${maxP}`;
                return { date: formatDate(date), pageRange, avgScore: Number((d.total / d.count).toFixed(2)) };
            });
    };

    const getJadeedPanelData = (data) => {
        const groupedByDate = {};
        data.logs.forEach(log => {
            if (!groupedByDate[log.log_date]) groupedByDate[log.log_date] = { total: 0, count: 0, entries: [] };
            groupedByDate[log.log_date].total += log.score;
            groupedByDate[log.log_date].count += 1;
            groupedByDate[log.log_date].entries.push(log);
        });
        return Object.entries(groupedByDate).sort((a, b) => b[0].localeCompare(a[0]))
            .map(([date, d]) => ({
                date: formatDate(date),
                avgScore: Number((d.total / d.count).toFixed(2)),
                rangeDisplay: d.entries[0]?.range_to || d.entries[0]?.range_from.replace("Jadeed - ", "")
            }));
    };

    const getJuzzHaliPanelData = (data) => {
        const groupedByDate = {};
        data.logs.forEach(log => {
            if (!groupedByDate[log.log_date]) groupedByDate[log.log_date] = { total: 0, count: 0, entries: [] };
            groupedByDate[log.log_date].total += log.score;
            groupedByDate[log.log_date].count += 1;
            groupedByDate[log.log_date].entries.push(log);
        });
        return Object.entries(groupedByDate).sort((a, b) => b[0].localeCompare(a[0]))
            .map(([date, d]) => {
                const pages = d.entries.map(e => {
                    const pMatch = e.range_from?.match(/Page\s*(\d+)/i);
                    return pMatch ? parseInt(pMatch[1]) : null;
                }).filter(Boolean);
                
                let pageRange = "";
                if (pages.length > 0) {
                    pages.sort((a, b) => a - b);
                    const minP = pages[0]; const maxP = pages[pages.length - 1];
                    pageRange = minP === maxP ? `Page ${minP}` : `Pages ${minP} to ${maxP}`;
                }

                // Extract Ayah info cleanly
                const ayahInfo = d.entries.map(e => e.range_to).filter(Boolean).join(' → ').replace(/Start:\s*/g, '').replace(/End:\s*/g, '');

                return {
                    date: formatDate(date),
                    avgScore: Number((d.total / d.count).toFixed(2)),
                    pageRange,
                    ayahInfo
                };
            });
    };

    const getIkhtebarPanelData = (data) => {
        const groupedByDate = {};
        data.logs.forEach(log => {
            if (!groupedByDate[log.log_date]) groupedByDate[log.log_date] = { total: 0, count: 0 };
            groupedByDate[log.log_date].total += log.score;
            groupedByDate[log.log_date].count += 1;
        });
        return Object.entries(groupedByDate).sort((a, b) => b[0].localeCompare(a[0]))
            .map(([date, d]) => ({ date: formatDate(date), avgScore: Number((d.total / d.count).toFixed(2)) }));
    };

    return (
        <div className="analytics-container">
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button onClick={() => { setActiveTab('assessment'); setSelectedBarIndex(null); }} className="deep-select" style={activeTab === 'assessment' ? { backgroundColor: '#004D40', color: 'white', borderColor: '#004D40' } : {}}>📊 Assessment Log</button>
                <button onClick={() => setActiveTab('quranmap')} className="deep-select" style={activeTab === 'quranmap' ? { backgroundColor: '#8B5CF6', color: 'white', borderColor: '#8B5CF6' } : {}}>📖 Qur’an Map</button>
            </div>

            {activeTab === 'quranmap' ? (
                <QuranMapView />
            ) : (
                <>
                    <div className="chart-card">
                        <div className="chart-header-row"><h3>📈 Assessment Log</h3>
                            <div className="trend-controls">
                                <select value={useCustomRange ? 'custom' : trendRange} onChange={(e) => { if (e.target.value === 'custom') setUseCustomRange(true); else { setUseCustomRange(false); setTrendRange(e.target.value); }}} className="deep-select">
                                    <option value="7d">7 Days</option><option value="1m">1 Month</option><option value="3m">3 Months</option><option value="6m">6 Months</option><option value="1y">1 Year</option><option value="all">All Time</option><option value="custom">Custom Range 📅</option>
                                </select>
                                {useCustomRange && (<div className="custom-date-range"><input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="date-input" /><span className="date-separator">to</span><input type="date" value={customEnd} max={new Date().toISOString().split('T')[0]} onChange={(e) => setCustomEnd(e.target.value)} className="date-input" /></div>)}
                            </div>
                        </div>
                        {trendData.length === 0 ? <p className="empty-chart">No data for this period.</p> : (
                            <ResponsiveContainer width="100%" height={300}><LineChart data={trendData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="date" /><YAxis domain={[0, 100]} /><Tooltip formatter={(value) => value == null ? 'No Data' : [`${value}%`, 'Completion %']} /><Line type="monotone" dataKey="percentage" stroke="#004D40" strokeWidth={3} dot={false} connectNulls /></LineChart></ResponsiveContainer>
                        )}
                    </div>
                    
                    <div className="chart-card deep-dive-card analytics-split-view">
                        <div style={{ flex: 1, minWidth: selectedBarIndex !== null ? '60%' : '100%', transition: 'flex 0.3s ease' }}>
                            <h3>🔍 Performance Analytics</h3>
                            <div className="deep-dive-controls">
                                <select value={selectedType} onChange={(e) => { setSelectedType(e.target.value); setSelectedBarIndex(null); }} className="deep-select">
                                    <option value="murajah">Murajah</option><option value="tasmee">Tasmee</option><option value="ikhtebar">Ikhtebar</option><option value="jadeed">Jadeed</option><option value="juzz_hali">Juzz Hali</option>
                                </select>
                                <select value={deepDiveRange} onChange={(e) => { setDeepDiveRange(e.target.value); setSelectedBarIndex(null); }} className="deep-select">
                                    <option value="7d">7 Days</option><option value="1m">1 Month</option><option value="3m">3 Months</option><option value="6m">6 Months</option><option value="1y">1 Year</option><option value="all">All Time</option>
                                </select>
                                {/* JUZZ FILTER COMPLETELY REMOVED */}
                            </div>
                            
                            {chartData.length === 0 ? <p className="empty-chart">No history found.</p> : (
                                <ResponsiveContainer width="100%" height={Math.max(400, chartData.length * 35)}>
                                    <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" domain={[0, 10]} />
                                        <YAxis dataKey="name" width={120} type="category" tick={{ fontSize: 12 }} />
                                        <Tooltip content={() => <div style={{ display: 'none' }} />} />
                                        <Bar dataKey="avgScore" radius={[6, 6, 0, 0]} cursor="pointer" onClick={(data, index) => setSelectedBarIndex(index)}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.avgScore < 5.75 ? "#FCA5A5" : entry.avgScore < 7.75 ? "#FDE68A" : "#004D40"} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* --- RIGHT SIDE PANELS --- */}
                        {selectedBarIndex !== null && chartData[selectedBarIndex] && (
                            <div className="analytics-details-panel">
                                
                                {/* MURAJAH PANEL */}
                                {selectedType === 'murajah' && (
                                    <>
                                        <div className="panel-header-row"><h3>{chartData[selectedBarIndex].name}</h3><button className="close-panel-btn" onClick={() => setSelectedBarIndex(null)}>✕</button></div>
                                        <div className="panel-stats">
                                            <div className="stat-box green-bg"><span className="stat-value">{chartData[selectedBarIndex].avgScore}/10</span><span className="stat-label">Avg Score</span></div>
                                            <div className="stat-box blue-bg"><span className="stat-value">{chartData[selectedBarIndex].sessions}</span><span className="stat-label">Sessions</span></div>
                                        </div>
                                        <div className="panel-logs"><h4>Latest 10 Sessions</h4><div className="logs-scroll-container">{getMurajahPanelData(chartData[selectedBarIndex]).map((session, i) => (<div key={i} className="log-entry-item"><div className="log-entry-top"><span className="log-date">{session.date}</span><span className="log-score">{session.avgScore}/10</span></div></div>))}</div></div>
                                    </>
                                )}

                                {/* TASMEE PANEL (Date, Page Range, Avg. NO COMMENTS) */}
                                {selectedType === 'tasmee' && (
                                    <>
                                        <div className="panel-header-row"><h3>{chartData[selectedBarIndex].name}</h3><button className="close-panel-btn" onClick={() => setSelectedBarIndex(null)}>✕</button></div>
                                        <div className="panel-stats">
                                            <div className="stat-box green-bg"><span className="stat-value">{chartData[selectedBarIndex].avgScore}/10</span><span className="stat-label">Avg Score</span></div>
                                            <div className="stat-box blue-bg"><span className="stat-value">{chartData[selectedBarIndex].sessions}</span><span className="stat-label">Pages</span></div>
                                        </div>
                                        <div className="panel-logs"><div className="logs-scroll-container">
                                            {getTasmeePanelData(chartData[selectedBarIndex]).map((day, i) => (
                                                <div key={i} className="log-entry-item">
                                                    <div className="log-entry-top"><span className="log-date">{day.date}</span><span className="log-score">{day.avgScore}/10</span></div>
                                                    <div className="log-entry-meta">{day.pageRange}</div>
                                                </div>
                                            ))}
                                        </div></div>
                                    </>
                                )}

                                {/* JADEED PANEL (Month -> Surah to Surah) */}
                                {selectedType === 'jadeed' && (
                                    <>
                                        <div className="panel-header-row"><h3>{chartData[selectedBarIndex].name}</h3><button className="close-panel-btn" onClick={() => setSelectedBarIndex(null)}>✕</button></div>
                                        <div className="panel-stats">
                                            <div className="stat-box green-bg"><span className="stat-value">{chartData[selectedBarIndex].avgScore}/10</span><span className="stat-label">Avg Marks</span></div>
                                            <div className="stat-box blue-bg"><span className="stat-value">{chartData[selectedBarIndex].sessions}</span><span className="stat-label">Entries</span></div>
                                        </div>
                                        <div className="panel-logs"><div className="logs-scroll-container">
                                            {getJadeedPanelData(chartData[selectedBarIndex]).map((day, i) => (
                                                <div key={i} className="log-entry-item">
                                                    <div className="log-entry-top"><span className="log-date">{day.date}</span><span className="log-score">{day.avgScore}/10</span></div>
                                                    <div className="log-entry-meta" style={{ color: '#004D40', fontWeight: 600 }}>{day.rangeDisplay}</div>
                                                </div>
                                            ))}
                                        </div></div>
                                    </>
                                )}

                                {/* JUZZ HALI PANEL (Month -> Pages & Surah to Surah) */}
                                {selectedType === 'juzz_hali' && (
                                    <>
                                        <div className="panel-header-row"><h3>{chartData[selectedBarIndex].name}</h3><button className="close-panel-btn" onClick={() => setSelectedBarIndex(null)}>✕</button></div>
                                        <div className="panel-stats">
                                            <div className="stat-box green-bg"><span className="stat-value">{chartData[selectedBarIndex].avgScore}/10</span><span className="stat-label">Avg Score</span></div>
                                            <div className="stat-box blue-bg"><span className="stat-value">{chartData[selectedBarIndex].sessions}</span><span className="stat-label">Pages</span></div>
                                        </div>
                                        <div className="panel-logs"><div className="logs-scroll-container">
                                            {getJuzzHaliPanelData(chartData[selectedBarIndex]).map((day, i) => (
                                                <div key={i} className="log-entry-item">
                                                    <div className="log-entry-top"><span className="log-date">{day.date}</span><span className="log-score">{day.avgScore}/10</span></div>
                                                    <div className="log-entry-meta">{day.pageRange}</div>
                                                    {day.ayahInfo && <div className="log-entry-meta" style={{ color: '#004D40', fontWeight: 600 }}>{day.ayahInfo}</div>}
                                                </div>
                                            ))}
                                        </div></div>
                                    </>
                                )}

                                {/* IKHTEBAR PANEL */}
                                {selectedType === 'ikhtebar' && (
                                    <>
                                        <div className="panel-header-row"><h3>{chartData[selectedBarIndex].name}</h3><button className="close-panel-btn" onClick={() => setSelectedBarIndex(null)}>✕</button></div>
                                        <div className="panel-stats">
                                            <div className="stat-box green-bg"><span className="stat-value">{chartData[selectedBarIndex].avgScore}/10</span><span className="stat-label">Avg Score</span></div>
                                            <div className="stat-box blue-bg"><span className="stat-value">{chartData[selectedBarIndex].sessions}</span><span className="stat-label">Entries</span></div>
                                        </div>
                                        <div className="panel-logs"><div className="logs-scroll-container">
                                            {getIkhtebarPanelData(chartData[selectedBarIndex]).map((day, i) => (
                                                <div key={i} className="log-entry-item">
                                                    <div className="log-entry-top"><span className="log-date">{day.date}</span><span className="log-score">{day.avgScore}/10</span></div>
                                                </div>
                                            ))}
                                        </div></div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}