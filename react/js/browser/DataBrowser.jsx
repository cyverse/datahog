import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import '../axios';

/* ─────────── helpers ─────────── */
function humanSize(bytes) {
    if (bytes === 0 || bytes === undefined || bytes === null) return '—';
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
}

function humanDate(ts) {
    if (!ts) return '—';
    const d = new Date(typeof ts === 'number' ? ts : parseInt(ts));
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fileExtension(name) {
    if (!name) return '';
    const dot = name.lastIndexOf('.');
    return dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
}

function pathSegments(path) {
    return path.split('/').filter(Boolean);
}

/* ─────────── file type icons (SVG) ─────────── */
function FolderIcon({ open }) {
    if (open) {
        return (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="db-icon db-icon-folder-open">
                <path d="M5 19a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2 2h4a2 2 0 0 1 2 2v1M5 19h14a2 2 0 0 0 2-2l-3-6H6l-3 6a2 2 0 0 0 2 2z" />
            </svg>
        );
    }
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="db-icon db-icon-folder">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
    );
}

function FileIcon({ name }) {
    const ext = fileExtension(name);
    let color = 'var(--db-text-muted)';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'bmp', 'tiff', 'webp'].includes(ext)) color = 'var(--db-purple)';
    else if (['py', 'js', 'jsx', 'ts', 'r', 'sh', 'bash', 'pl'].includes(ext)) color = 'var(--db-green)';
    else if (['csv', 'tsv', 'json', 'xml', 'yaml', 'yml'].includes(ext)) color = 'var(--db-cyan)';
    else if (['md', 'txt', 'rst', 'log', 'pdf', 'doc', 'docx'].includes(ext)) color = 'var(--db-blue)';
    else if (['gz', 'tar', 'zip', 'bz2', 'xz', '7z', 'rar'].includes(ext)) color = 'var(--db-orange)';
    else if (['h5', 'hdf5', 'nc', 'npy', 'npz', 'parquet', 'feather'].includes(ext)) color = 'var(--db-red)';

    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" className="db-icon db-icon-file">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
        </svg>
    );
}

function ChevronIcon({ expanded }) {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`db-chevron ${expanded ? 'db-chevron-down' : ''}`}>
            <polyline points="9 18 15 12 9 6" />
        </svg>
    );
}

function SpinnerIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" className="db-spinner">
            <circle cx="12" cy="12" r="10" fill="none" stroke="var(--db-text-muted)" strokeWidth="2" opacity="0.3" />
            <path d="M12 2a10 10 0 0 1 10 10" fill="none" stroke="var(--db-accent)" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

/* ─────────── Login Panel ─────────── */
function LoginPanel({ onLogin, error, loading }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(username, password);
    };

    return (
        <div className="db-login-overlay">
            <div className="db-login-card">
                <div className="db-login-header">
                    <div className="db-login-logo">
                        <span style={{ fontSize: '48px' }}>🦔</span>
                    </div>
                    <h1>DataHog</h1>
                    <p className="db-login-subtitle">Connect to CyVerse Data Store</p>
                </div>
                <form onSubmit={handleSubmit} className="db-login-form">
                    <div className="db-field">
                        <label>CyVerse Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="username"
                            autoFocus
                            autoComplete="username"
                        />
                    </div>
                    <div className="db-field">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="password"
                            autoComplete="current-password"
                        />
                    </div>
                    {error && <div className="db-login-error">{error}</div>}
                    <button type="submit" className="db-login-btn" disabled={loading || !username || !password}>
                        {loading ? 'Connecting...' : 'Connect'}
                    </button>
                </form>
                <div className="db-login-footer">
                    <span>CyVerse Data Store Browser</span>
                </div>
            </div>
        </div>
    );
}

/* ─────────── Tree Node (recursive) ─────────── */
function TreeNode({ node, depth, selectedPath, onSelect, onToggle, loadingPaths }) {
    const isSelected = selectedPath === node.path;
    const isLoading = loadingPaths.has(node.path);
    const hasChildren = node.children && node.children.length > 0;

    return (
        <>
            <div
                className={`db-tree-node ${isSelected ? 'db-tree-node-selected' : ''}`}
                style={{ paddingLeft: (12 + depth * 16) + 'px' }}
                onClick={() => {
                    onSelect(node.path);
                    if (node.type === 'folder') onToggle(node.path);
                }}
                title={node.path}
            >
                {node.type === 'folder' && (
                    isLoading
                        ? <SpinnerIcon />
                        : <ChevronIcon expanded={node.expanded} />
                )}
                {node.type === 'folder'
                    ? <FolderIcon open={node.expanded} />
                    : <FileIcon name={node.name} />
                }
                <span className="db-tree-label">{node.name}</span>
            </div>
            {node.expanded && hasChildren && node.children.map(child => (
                <TreeNode
                    key={child.path}
                    node={child}
                    depth={depth + 1}
                    selectedPath={selectedPath}
                    onSelect={onSelect}
                    onToggle={onToggle}
                    loadingPaths={loadingPaths}
                />
            ))}
        </>
    );
}

/* ─────────── Breadcrumbs ─────────── */
function Breadcrumbs({ path, onNavigate }) {
    const segs = pathSegments(path);
    const crumbs = segs.map((seg, i) => ({
        label: seg,
        path: '/' + segs.slice(0, i + 1).join('/'),
    }));

    return (
        <div className="db-breadcrumbs">
            {crumbs.map((c, i) => (
                <React.Fragment key={c.path}>
                    {i > 0 && <span className="db-breadcrumb-sep">/</span>}
                    <button
                        className={`db-breadcrumb ${i === crumbs.length - 1 ? 'db-breadcrumb-active' : ''}`}
                        onClick={() => onNavigate(c.path)}
                    >
                        {c.label}
                    </button>
                </React.Fragment>
            ))}
        </div>
    );
}

/* ─────────── Extension Badge ─────────── */
function ExtBadge({ name }) {
    const ext = fileExtension(name);
    if (!ext) return null;
    return <span className="db-ext-badge">{ext}</span>;
}

/* ─────────── Size Bar (relative to largest file) ─────────── */
function SizeBar({ size, maxSize }) {
    if (!size || !maxSize) return null;
    const pct = Math.max(2, (size / maxSize) * 100);
    let color = 'var(--db-accent)';
    if (size > 1e9) color = 'var(--db-red)';
    else if (size > 100e6) color = 'var(--db-orange)';
    else if (size > 1e6) color = 'var(--db-cyan)';
    return (
        <div className="db-size-bar" style={{ width: pct + '%', background: color }} />
    );
}

/* ─────────── Sort Header ─────────── */
function SortHeader({ label, field, sortField, sortDir, onSort, className }) {
    const active = sortField === field;
    return (
        <th
            className={`db-sortable ${className || ''} ${active ? 'db-sort-active' : ''}`}
            onClick={() => onSort(field)}
        >
            {label}
            {active && (
                <span className="db-sort-arrow">{sortDir === 'ASC' ? ' ↑' : ' ↓'}</span>
            )}
        </th>
    );
}

/* ─────────── Main DataBrowser component ─────────── */
export function DataBrowser({ onAnalyze }) {
    const [authState, setAuthState] = useState({ checking: true, authenticated: false, username: '', homePath: '' });
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);

    // Tree state: map of path -> { name, path, type, expanded, loaded, children }
    const [treeNodes, setTreeNodes] = useState({});
    const [rootPaths, setRootPaths] = useState([]);
    const [loadingPaths, setLoadingPaths] = useState(new Set());

    // File list state
    const [currentPath, setCurrentPath] = useState('');
    const [items, setItems] = useState({ folders: [], files: [] });
    const [listLoading, setListLoading] = useState(false);
    const [listError, setListError] = useState('');
    const [totalItems, setTotalItems] = useState(0);

    // Sort state
    const [sortField, setSortField] = useState('NAME');
    const [sortDir, setSortDir] = useState('ASC');

    // Detail / metadata panel
    const [selectedItem, setSelectedItem] = useState(null);
    const [metadata, setMetadata] = useState([]);
    const [metadataLoading, setMetadataLoading] = useState(false);

    // Theme
    const [theme, setTheme] = useState(() => {
        if (typeof localStorage !== 'undefined') return localStorage.getItem('dh-theme') || 'dark';
        return 'dark';
    });

    /* ── Apply theme to document root ── */
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('dh-theme', theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    }, []);

    /* ── Auth check on mount — auto-login when running in CyVerse VICE ── */
    useEffect(() => {
        axios.get('/api/browse/status').then(res => {
            const d = res.data;
            if (d.authenticated) {
                setAuthState({ checking: false, authenticated: true, username: d.username, homePath: d.home_path });
            } else if (d.is_vice) {
                // Running in VICE — try to get a Terrain token via the
                // browser's existing KeyCloak session (same-origin when
                // accessed through de.cyverse.org/dl/...).
                attemptViceAutoLogin();
            } else {
                setAuthState({ checking: false, authenticated: false, username: '', homePath: '' });
            }
        }).catch(() => {
            setAuthState({ checking: false, authenticated: false, username: '', homePath: '' });
        });
    }, []);

    /* ── VICE auto-login: fetch Terrain token via browser KeyCloak session ── */
    const attemptViceAutoLogin = useCallback(() => {
        // Try fetching a Terrain token using the browser's KeyCloak cookies.
        // This works when the app is accessed through the DE proxy at
        // de.cyverse.org/dl/... (same origin as Terrain).
        fetch('/terrain/token/keycloak', { credentials: 'include' })
            .then(r => {
                if (!r.ok) throw new Error('No KeyCloak token');
                return r.json();
            })
            .then(data => {
                const token = data.access_token;
                if (!token) throw new Error('No access_token in response');
                // Send the token to our backend
                return axios.post('/api/browse/autologin', { token });
            })
            .then(res => {
                const d = res.data;
                setAuthState({ checking: false, authenticated: true, username: d.username, homePath: d.home_path });
            })
            .catch(() => {
                // Auto-login failed — fall back to manual login form
                setAuthState({ checking: false, authenticated: false, username: '', homePath: '' });
            });
    }, []);

    /* ── Initialize tree when authenticated ── */
    useEffect(() => {
        if (authState.authenticated && authState.username) {
            const home = `/iplant/home/${authState.username}`;
            const shared = '/iplant/home/shared';
            setRootPaths([home, shared]);
            setTreeNodes({
                [home]: { name: authState.username, path: home, type: 'folder', expanded: false, loaded: false, children: [] },
                [shared]: { name: 'shared', path: shared, type: 'folder', expanded: false, loaded: false, children: [] },
            });
            // Auto-navigate to home
            navigateTo(home);
        }
    }, [authState.authenticated, authState.username]);

    /* ── Login handler ── */
    const handleLogin = useCallback((username, password) => {
        setLoginLoading(true);
        setLoginError('');
        axios.post('/api/browse/login', { username, password }).then(res => {
            const d = res.data;
            setAuthState({ checking: false, authenticated: true, username: d.username, homePath: d.home_path });
            setLoginLoading(false);
        }).catch(err => {
            const msg = err.response?.data?.error || 'Connection failed';
            setLoginError(msg);
            setLoginLoading(false);
        });
    }, []);

    /* ── Logout handler ── */
    const handleLogout = useCallback(() => {
        axios.post('/api/browse/logout').then(() => {
            setAuthState({ checking: false, authenticated: false, username: '', homePath: '' });
            setTreeNodes({});
            setRootPaths([]);
            setCurrentPath('');
            setItems({ folders: [], files: [] });
        });
    }, []);

    /* ── Load directory contents for file list ── */
    const navigateTo = useCallback((path, sf, sd) => {
        setCurrentPath(path);
        setListLoading(true);
        setListError('');
        const useSortField = sf || sortField;
        const useSortDir = sd || sortDir;
        axios.get('/api/browse/ls', {
            params: { path, sort_col: useSortField, sort_dir: useSortDir }
        }).then(res => {
            setItems({ folders: res.data.folders, files: res.data.files });
            setTotalItems(res.data.total);
            setListLoading(false);
        }).catch(err => {
            if (err.response?.status === 401) {
                setAuthState(prev => ({ ...prev, authenticated: false }));
            }
            setListError(err.response?.data?.error || 'Failed to load directory');
            setListLoading(false);
        });
    }, [sortField, sortDir]);

    /* ── Load tree node children ── */
    const loadTreeChildren = useCallback((path) => {
        setLoadingPaths(prev => new Set(prev).add(path));
        axios.get('/api/browse/ls', { params: { path } }).then(res => {
            const children = [
                ...res.data.folders.map(f => ({
                    name: f.name, path: f.path, type: 'folder',
                    expanded: false, loaded: false, children: [],
                })),
            ];
            setTreeNodes(prev => {
                const updated = { ...prev };
                // Add child nodes
                children.forEach(c => {
                    if (!updated[c.path]) {
                        updated[c.path] = c;
                    }
                });
                // Update parent
                if (updated[path]) {
                    updated[path] = { ...updated[path], loaded: true, expanded: true, children };
                }
                return updated;
            });
            setLoadingPaths(prev => {
                const next = new Set(prev);
                next.delete(path);
                return next;
            });
        }).catch(() => {
            setLoadingPaths(prev => {
                const next = new Set(prev);
                next.delete(path);
                return next;
            });
        });
    }, []);

    /* ── Toggle tree node ── */
    const handleTreeToggle = useCallback((path) => {
        setTreeNodes(prev => {
            const node = prev[path];
            if (!node || node.type !== 'folder') return prev;
            if (!node.loaded) {
                loadTreeChildren(path);
                return prev;
            }
            return { ...prev, [path]: { ...node, expanded: !node.expanded } };
        });
    }, [loadTreeChildren]);

    /* ── Select a path (tree click) ── */
    const handleTreeSelect = useCallback((path) => {
        navigateTo(path);
    }, [navigateTo]);

    /* ── Fetch metadata when item is selected ── */
    useEffect(() => {
        if (!selectedItem) { setMetadata([]); return; }
        setMetadataLoading(true);
        axios.get('/api/browse/metadata', { params: { path: selectedItem.path } })
            .then(res => {
                setMetadata(res.data.avus || []);
                setMetadataLoading(false);
            })
            .catch(() => {
                setMetadata([]);
                setMetadataLoading(false);
            });
    }, [selectedItem?.path]);

    /* ── Handle sort ── */
    const handleSort = useCallback((field) => {
        let newDir = 'ASC';
        if (field === sortField) {
            newDir = sortDir === 'ASC' ? 'DESC' : 'ASC';
        }
        setSortField(field);
        setSortDir(newDir);
        if (currentPath) {
            navigateTo(currentPath, field, newDir);
        }
    }, [sortField, sortDir, currentPath, navigateTo]);

    /* ── Select item (show metadata) ── */
    const handleItemClick = useCallback((item) => {
        setSelectedItem(prev => prev?.path === item.path ? null : item);
    }, []);

    /* ── Navigate into a folder from the file list (double-click) ── */
    const handleItemDblClick = useCallback((item) => {
        if (item.type === 'folder') {
            setSelectedItem(null);
            navigateTo(item.path);
            setTreeNodes(prev => {
                if (prev[item.path]) {
                    if (!prev[item.path].loaded) {
                        loadTreeChildren(item.path);
                    } else {
                        return { ...prev, [item.path]: { ...prev[item.path], expanded: true } };
                    }
                }
                return prev;
            });
        }
    }, [navigateTo, loadTreeChildren]);

    /* ── Copy path to clipboard ── */
    const handleCopyPath = useCallback((path, e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(path).catch(() => { });
    }, []);

    /* ── Build tree structure for rendering ── */
    const buildTreeForRender = () => {
        return rootPaths.map(rp => {
            const node = treeNodes[rp];
            if (!node) return null;
            const enriched = enrichNode(node);
            return enriched;
        }).filter(Boolean);
    };

    const enrichNode = (node) => {
        if (!node) return null;
        return {
            ...node,
            children: (node.children || []).map(child => {
                const full = treeNodes[child.path] || child;
                return enrichNode(full);
            }),
        };
    };

    /* ── Render ── */
    if (authState.checking) {
        return (
            <div className="db-layout">
                <div className="db-loading-full">
                    <SpinnerIcon /><span>Connecting...</span>
                </div>
            </div>
        );
    }

    if (!authState.authenticated) {
        return <LoginPanel onLogin={handleLogin} error={loginError} loading={loginLoading} />;
    }

    const treeRoots = buildTreeForRender();
    const allItems = [...items.folders, ...items.files];
    const parentPath = currentPath ? currentPath.split('/').slice(0, -1).join('/') : '';
    const maxFileSize = Math.max(1, ...items.files.map(f => f.size || 0));

    return (
        <div className="db-layout">
            {/* ── Toolbar ── */}
            <div className="db-toolbar">
                <div className="db-toolbar-left">
                    <div className="db-app-title">
                        <span style={{ fontSize: '20px' }}>🦔</span>
                        <span>DataHog</span>
                    </div>
                    <Breadcrumbs path={currentPath} onNavigate={navigateTo} />
                </div>
                <div className="db-toolbar-right">
                    {onAnalyze && currentPath && (
                        <button className="db-analyze-btn" onClick={() => onAnalyze(currentPath)} title={'Analyze ' + currentPath}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="20" x2="18" y2="10" />
                                <line x1="12" y1="20" x2="12" y2="4" />
                                <line x1="6" y1="20" x2="6" y2="14" />
                            </svg>
                            Analyze
                        </button>
                    )}
                    <button className="db-theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to daylight' : 'Switch to night'}>
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                    <span className="db-user-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                        {authState.username}
                    </span>
                    <button className="db-btn-icon" onClick={handleLogout} title="Disconnect">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="db-body">
                {/* ── Sidebar tree ── */}
                <div className="db-sidebar">
                    <div className="db-sidebar-header">
                        <span>Navigator</span>
                    </div>
                    <div className="db-tree">
                        {/* Root: /iplant */}
                        <div className="db-tree-section">
                            <div className="db-tree-section-label">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--db-accent)" strokeWidth="2">
                                    <path d="M22 12H2M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                </svg>
                                CyVerse Data Store
                            </div>
                        </div>
                        {treeRoots.map(node => (
                            <TreeNode
                                key={node.path}
                                node={node}
                                depth={0}
                                selectedPath={currentPath}
                                onSelect={handleTreeSelect}
                                onToggle={handleTreeToggle}
                                loadingPaths={loadingPaths}
                            />
                        ))}
                    </div>
                </div>

                {/* ── Main file list ── */}
                <div className="db-main">
                    {listError && (
                        <div className="db-error-banner">{listError}</div>
                    )}
                    <div className="db-file-list-wrapper">
                        <table className="db-file-table">
                            <thead>
                                <tr>
                                    <SortHeader label="Name" field="NAME" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="db-col-name" />
                                    <th className="db-col-ext">Type</th>
                                    <SortHeader label="Size" field="SIZE" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="db-col-size" />
                                    <SortHeader label="Modified" field="DATECREATED" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="db-col-date" />
                                    <th className="db-col-actions"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {listLoading && (
                                    <tr className="db-loading-row">
                                        <td colSpan="5">
                                            <div className="db-loading-inline"><SpinnerIcon /> Loading...</div>
                                        </td>
                                    </tr>
                                )}
                                {!listLoading && parentPath && (
                                    <tr className="db-file-row db-file-row-parent" onClick={() => { setSelectedItem(null); navigateTo(parentPath); }}>
                                        <td className="db-col-name">
                                            <span className="db-file-name">
                                                <FolderIcon open={false} />
                                                <span>..</span>
                                            </span>
                                        </td>
                                        <td className="db-col-ext"></td>
                                        <td className="db-col-size"></td>
                                        <td className="db-col-date"></td>
                                        <td className="db-col-actions"></td>
                                    </tr>
                                )}
                                {!listLoading && allItems.map(item => (
                                    <tr
                                        key={item.path}
                                        className={`db-file-row ${item.type === 'folder' ? 'db-file-row-folder' : ''} ${selectedItem?.path === item.path ? 'db-file-row-selected' : ''}`}
                                        onClick={() => handleItemClick(item)}
                                        onDoubleClick={() => handleItemDblClick(item)}
                                    >
                                        <td className="db-col-name">
                                            <span className="db-file-name">
                                                {item.type === 'folder'
                                                    ? <FolderIcon open={false} />
                                                    : <FileIcon name={item.name} />
                                                }
                                                <span>{item.name}</span>
                                            </span>
                                        </td>
                                        <td className="db-col-ext">
                                            {item.type === 'folder'
                                                ? <span className="db-ext-badge db-ext-folder">dir</span>
                                                : <ExtBadge name={item.name} />
                                            }
                                        </td>
                                        <td className="db-col-size">
                                            <div className="db-size-cell">
                                                {item.type === 'file' && <SizeBar size={item.size} maxSize={maxFileSize} />}
                                                <span>{item.type === 'file' ? humanSize(item.size) : '—'}</span>
                                            </div>
                                        </td>
                                        <td className="db-col-date">
                                            {humanDate(item.date_modified)}
                                        </td>
                                        <td className="db-col-actions">
                                            <button
                                                className="db-btn-copy"
                                                onClick={(e) => handleCopyPath(item.path, e)}
                                                title="Copy path"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {!listLoading && allItems.length === 0 && currentPath && (
                                    <tr>
                                        <td colSpan="5" className="db-empty-message">
                                            This directory is empty
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── Metadata Detail Panel ── */}
                {selectedItem && (
                    <div className="db-detail-panel">
                        <div className="db-detail-header">
                            <div className="db-detail-title">
                                {selectedItem.type === 'folder'
                                    ? <FolderIcon open={false} />
                                    : <FileIcon name={selectedItem.name} />
                                }
                                <span>{selectedItem.name}</span>
                            </div>
                            <button className="db-btn-icon" onClick={() => setSelectedItem(null)} title="Close">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="db-detail-body">
                            <div className="db-detail-section">
                                <div className="db-detail-label">Path</div>
                                <div className="db-detail-value db-detail-path">{selectedItem.path}</div>
                            </div>
                            {selectedItem.type === 'file' && (
                                <>
                                    <div className="db-detail-section">
                                        <div className="db-detail-label">Size</div>
                                        <div className="db-detail-value">{humanSize(selectedItem.size)}</div>
                                    </div>
                                    <div className="db-detail-section">
                                        <div className="db-detail-label">Modified</div>
                                        <div className="db-detail-value">{humanDate(selectedItem.date_modified)}</div>
                                    </div>
                                </>
                            )}
                            <div className="db-detail-divider" />
                            <div className="db-detail-section">
                                <div className="db-detail-label">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--db-accent)" strokeWidth="2">
                                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                                        <line x1="7" y1="7" x2="7.01" y2="7" />
                                    </svg>
                                    iRODS Metadata (AVUs)
                                </div>
                                {metadataLoading && (
                                    <div className="db-detail-meta-loading"><SpinnerIcon /> Loading...</div>
                                )}
                                {!metadataLoading && metadata.length === 0 && (
                                    <div className="db-detail-meta-empty">No metadata</div>
                                )}
                                {!metadataLoading && metadata.length > 0 && (
                                    <table className="db-meta-table">
                                        <thead>
                                            <tr>
                                                <th>Attribute</th>
                                                <th>Value</th>
                                                <th>Unit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {metadata.map((avu, i) => (
                                                <tr key={i}>
                                                    <td className="db-meta-attr">{avu.attribute}</td>
                                                    <td className="db-meta-val">{avu.value}</td>
                                                    <td className="db-meta-unit">{avu.unit || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Status Bar ── */}
            <div className="db-statusbar">
                <span>{totalItems} items</span>
                <span className="db-statusbar-sep">|</span>
                <span>{currentPath}</span>
                <span className="db-statusbar-right">
                    Connected as {authState.username}
                </span>
            </div>
        </div>
    );
}
