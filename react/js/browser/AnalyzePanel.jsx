import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../axios';

function humanSize(bytes) {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
}

function humanDate(str) {
    if (!str) return '—';
    const d = new Date(str);
    return isNaN(d) ? str : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function trimPath(p, max) {
    if (!p || p.length <= (max || 50)) return p;
    const parts = p.split('/');
    if (parts.length <= 3) return p;
    return '…/' + parts.slice(-3).join('/');
}

/* ── SVG Icon components (safe, no innerHTML) ── */
function FileCountIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--db-accent)" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
        </svg>
    );
}
function TotalSizeIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--db-orange)" strokeWidth="1.5">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
    );
}
function FolderCountIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--db-folder)" strokeWidth="1.5">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
    );
}
function ClockIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--db-green)" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
    );
}

/* ── Bar chart row ── */
function TypeBar({ ext, size, maxSize, totalSize }) {
    const pct = maxSize > 0 ? (size / maxSize) * 100 : 0;
    const share = totalSize > 0 ? ((size / totalSize) * 100).toFixed(1) : '0';
    return (
        <div className="ap-type-row">
            <span className="ap-type-ext">{ext || '(no ext)'}</span>
            <div className="ap-type-bar-track">
                <div className="ap-type-bar-fill" style={{ width: Math.max(2, pct) + '%' }} />
            </div>
            <span className="ap-type-size">{humanSize(size)}</span>
            <span className="ap-type-pct">{share}%</span>
        </div>
    );
}

/* ── Stat card ── */
function StatCard({ value, label, icon }) {
    return (
        <div className="ap-stat-card">
            <div className="ap-stat-icon">{icon}</div>
            <div className="ap-stat-value">{value}</div>
            <div className="ap-stat-label">{label}</div>
        </div>
    );
}

/* ── File row for top lists ── */
function TopFileRow({ rank, name, path, size, maxSize }) {
    const pct = maxSize > 0 ? (size / maxSize) * 100 : 0;
    return (
        <div className="ap-top-row">
            <span className="ap-top-rank">{rank}</span>
            <div className="ap-top-info">
                <span className="ap-top-name" title={path}>{name}</span>
                <span className="ap-top-path">{trimPath(path, 60)}</span>
            </div>
            <div className="ap-top-bar-wrap">
                <div className="ap-top-bar" style={{ width: Math.max(3, pct) + '%' }} />
            </div>
            <span className="ap-top-size">{humanSize(size)}</span>
        </div>
    );
}

/* ── Duplicate group row ── */
function DupeRow({ group, files }) {
    const [expanded, setExpanded] = useState(false);
    return (
        <div className="ap-dupe-group">
            <div className="ap-dupe-header" onClick={() => setExpanded(!expanded)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>
                    <polyline points="9 18 15 12 9 6" />
                </svg>
                <span className="ap-dupe-count">{files.length} copies</span>
                <span className="ap-dupe-name">{group}</span>
                <span className="ap-dupe-wasted">{humanSize(files[0]?.size * (files.length - 1))} wasted</span>
            </div>
            {expanded && (
                <div className="ap-dupe-files">
                    {files.map((f, i) => (
                        <div key={i} className="ap-dupe-file">
                            <span>{trimPath(f.path, 70)}</span>
                            <span>{humanSize(f.size)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   Main AnalyzePanel
   ═══════════════════════════════════════════════════════════ */
export function AnalyzePanel({ path, onBack }) {
    const [phase, setPhase] = useState('importing'); // importing | loading | ready | error
    const [taskId, setTaskId] = useState(null);
    const [progress, setProgress] = useState({ message: 'Starting analysis...', subtitle: '' });
    const [errorMsg, setErrorMsg] = useState('');

    // Analysis data
    const [source, setSource] = useState(null);
    const [types, setTypes] = useState([]);
    const [bigFiles, setBigFiles] = useState([]);
    const [bigFolders, setBigFolders] = useState([]);
    const [dupes, setDupes] = useState([]);
    const [dupeTotal, setDupeTotal] = useState(0);
    const [metadataSummary, setMetadataSummary] = useState([]);

    /* ── Start import ── */
    useEffect(() => {
        axios.post('/api/browse/analyze', { path }).then(res => {
            setTaskId(res.data.task_id);
        }).catch(err => {
            setErrorMsg(err.response?.data?.error || 'Failed to start analysis');
            setPhase('error');
        });
    }, [path]);

    /* ── Poll task progress ── */
    useEffect(() => {
        if (!taskId) return;
        const interval = setInterval(() => {
            axios.get('/api/import/task').then(res => {
                const t = res.data;
                setProgress({ message: t.status_message, subtitle: t.status_subtitle });
                if (!t.in_progress && !t.failed) {
                    clearInterval(interval);
                    setPhase('loading');
                }
                if (t.failed) {
                    clearInterval(interval);
                    setErrorMsg(t.status_message || 'Import failed');
                    setPhase('error');
                }
            }).catch(() => {});
        }, 2000);
        return () => clearInterval(interval);
    }, [taskId]);

    /* ── Load analysis data after import completes ── */
    useEffect(() => {
        if (phase !== 'loading') return;

        axios.get('/api/filedata/sources').then(res => {
            const sources = res.data;
            const matched = sources.find(s => s.root_path === path) || sources[0];
            if (!matched) {
                setErrorMsg('No data found after import');
                setPhase('error');
                return;
            }
            setSource(matched);
            const sid = matched.id;

            Promise.all([
                axios.get('/api/filedata/types', { params: { source: sid, limit: 10 } }),
                axios.get('/api/filedata/files', { params: { source: sid, sort: '-size', limit: 10 } }),
                axios.get('/api/filedata/folders', { params: { source: sid, sort: '-total_size', limit: 10 } }),
                axios.get('/api/filedata/duplicates', { params: { 'sources[]': sid, method: matched.has_checksums ? 'checksum' : 'size', limit: 20 } }),
                axios.get('/api/filedata/metadata/summary', { params: { source: sid } }),
            ]).then(([typesRes, filesRes, foldersRes, dupesRes, metaRes]) => {
                setTypes(typesRes.data.page || typesRes.data || []);
                setBigFiles(filesRes.data.page || filesRes.data || []);
                setBigFolders(foldersRes.data.page || foldersRes.data || []);

                const dupeFiles = dupesRes.data.page || dupesRes.data || [];
                setDupeTotal(dupesRes.data.total || 0);
                const groups = {};
                dupeFiles.forEach(f => {
                    const key = f.checksum || ('size:' + f.size);
                    if (!groups[key]) groups[key] = [];
                    groups[key].push(f);
                });
                setDupes(Object.entries(groups).filter(function(entry) { return entry[1].length > 1; }).map(function(entry) { return { key: entry[0], name: entry[1][0].name, files: entry[1] }; }));
                setMetadataSummary(metaRes.data || []);
                setPhase('ready');
            }).catch(() => {
                setErrorMsg('Failed to load analysis data');
                setPhase('error');
            });
        });
    }, [phase, path]);

    const folderName = path.replace(/\/$/, '').split('/').filter(Boolean).pop();

    /* ── Importing phase ── */
    if (phase === 'importing') {
        return (
            <div className="ap-layout">
                <div className="ap-toolbar">
                    <button className="ap-back-btn" onClick={onBack}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                        Back
                    </button>
                    <span className="ap-toolbar-title">Analyzing {folderName}</span>
                </div>
                <div className="ap-center">
                    <div className="ap-progress-card">
                        <div className="ap-spinner-lg" />
                        <h2>{progress.message}</h2>
                        {progress.subtitle && <p>{progress.subtitle}</p>}
                        <p className="ap-progress-path">{path}</p>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Loading phase ── */
    if (phase === 'loading') {
        return (
            <div className="ap-layout">
                <div className="ap-toolbar">
                    <button className="ap-back-btn" onClick={onBack}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                        Back
                    </button>
                    <span className="ap-toolbar-title">Analyzing {folderName}</span>
                </div>
                <div className="ap-center">
                    <div className="ap-progress-card">
                        <div className="ap-spinner-lg" />
                        <h2>Loading results...</h2>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Error phase ── */
    if (phase === 'error') {
        return (
            <div className="ap-layout">
                <div className="ap-toolbar">
                    <button className="ap-back-btn" onClick={onBack}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                        Back
                    </button>
                    <span className="ap-toolbar-title">Analysis Failed</span>
                </div>
                <div className="ap-center">
                    <div className="ap-error-card">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--db-red)" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                        <h2>{errorMsg}</h2>
                        <button className="ap-retry-btn" onClick={onBack}>Return to Browser</button>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Ready phase — show analysis ── */
    const maxTypeSize = types.length > 0 ? types[0].total_size : 1;
    const totalTypeSize = types.reduce(function(sum, t) { return sum + (t.total_size || 0); }, 0);
    const maxFileSize = bigFiles.length > 0 ? bigFiles[0].size : 1;
    const maxFolderSize = bigFolders.length > 0 ? bigFolders[0].total_size : 1;

    return (
        <div className="ap-layout">
            <div className="ap-toolbar">
                <button className="ap-back-btn" onClick={onBack}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                    Back
                </button>
                <span className="ap-toolbar-title">
                    Analysis of <strong>{folderName}</strong>
                </span>
                <span className="ap-toolbar-path">{path}</span>
            </div>

            <div className="ap-content">
                {/* ── Stats row ── */}
                <div className="ap-stats-row">
                    <StatCard value={source.file_count?.toLocaleString() || '0'} label="Files" icon={<FileCountIcon />} />
                    <StatCard value={humanSize(source.total_size)} label="Total Size" icon={<TotalSizeIcon />} />
                    <StatCard value={source.folder_count?.toLocaleString() || '0'} label="Folders" icon={<FolderCountIcon />} />
                    <StatCard value={humanDate(source.date_scanned)} label="Scanned" icon={<ClockIcon />} />
                </div>

                <div className="ap-grid">
                    {/* ── File Types ── */}
                    <div className="ap-section">
                        <h3 className="ap-section-title">File Types</h3>
                        <div className="ap-type-list">
                            {types.map((t, i) => (
                                <TypeBar key={i} ext={t.extension} size={t.total_size} maxSize={maxTypeSize} totalSize={totalTypeSize} />
                            ))}
                            {types.length === 0 && <p className="ap-empty">No file type data</p>}
                        </div>
                    </div>

                    {/* ── Duplicates ── */}
                    <div className="ap-section">
                        <h3 className="ap-section-title">
                            Duplicates
                            {dupeTotal > 0 && <span className="ap-badge">{dupeTotal}</span>}
                        </h3>
                        <div className="ap-dupe-list">
                            {dupes.length === 0 && <p className="ap-empty">No duplicates found</p>}
                            {dupes.map((d, i) => (
                                <DupeRow key={i} group={d.name} files={d.files} />
                            ))}
                        </div>
                    </div>

                    {/* ── Biggest Files ── */}
                    <div className="ap-section">
                        <h3 className="ap-section-title">Largest Files</h3>
                        <div className="ap-top-list">
                            {bigFiles.map((f, i) => (
                                <TopFileRow key={f.id || i} rank={i + 1} name={f.name} path={f.path} size={f.size} maxSize={maxFileSize} />
                            ))}
                            {bigFiles.length === 0 && <p className="ap-empty">No files found</p>}
                        </div>
                    </div>

                    {/* ── Biggest Folders ── */}
                    <div className="ap-section">
                        <h3 className="ap-section-title">Largest Folders</h3>
                        <div className="ap-top-list">
                            {bigFolders.map((f, i) => (
                                <TopFileRow key={f.id || i} rank={i + 1} name={f.name} path={f.path} size={f.total_size} maxSize={maxFolderSize} />
                            ))}
                            {bigFolders.length === 0 && <p className="ap-empty">No folders found</p>}
                        </div>
                    </div>

                    {/* ── Metadata Summary ── */}
                    {metadataSummary.length > 0 && (
                        <div className="ap-section ap-section-full">
                            <h3 className="ap-section-title">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--db-accent)" strokeWidth="2">
                                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                                    <line x1="7" y1="7" x2="7.01" y2="7" />
                                </svg>
                                iRODS Metadata (AVUs)
                                <span className="ap-badge">{metadataSummary.reduce(function(s, m) { return s + m.count; }, 0)}</span>
                            </h3>
                            <div className="ap-meta-summary">
                                {metadataSummary.map((m, i) => (
                                    <div key={i} className="ap-meta-row">
                                        <span className="ap-meta-attr">{m.attribute}</span>
                                        <div className="ap-meta-bar-track">
                                            <div className="ap-meta-bar-fill" style={{ width: Math.max(3, (m.count / metadataSummary[0].count) * 100) + '%' }} />
                                        </div>
                                        <span className="ap-meta-count">{m.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
