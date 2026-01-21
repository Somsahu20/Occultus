import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { encryptVault, decryptVault } from "../crypto/aes";
import apiClient from "../api/client";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

interface PasswordEntry {
    website: string;
    username: string;
    password: string;
}

export const Dashboard = () => {
    const { keyB, accessToken, setKeyB, setAccessToken } = useAuth();
    const navigate = useNavigate();

    const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
    const [version, setVersion] = useState<number>(1);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

    // Form state
    const [newSite, setNewSite] = useState('');
    const [newUser, setNewUser] = useState('');
    const [newPass, setNewPass] = useState('');

    // Password visibility state
    const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set());

    // Redirect if not logged in
    useEffect(() => {
        if (!keyB) {
            console.warn("Vault Locked: No Key found in memory.");
            navigate('/login');
        }
    }, [keyB, navigate]);

    // Fetch vault on mount
    useEffect(() => {
        const fetchVault = async () => {
            if (!keyB) return;

            try {
                const response = await apiClient.get('/vaults', {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });

                if (!response.data || !response.data.encrypted_data) {
                    // New user with empty vault
                    setPasswords([]);
                    setVersion(1);
                    setLoading(false);
                    return;
                }

            
                setVersion(response.data.version || 1);

                // Decrypt the vault
                const decryptedData = await decryptVault(response.data, keyB);

                if (Array.isArray(decryptedData)) {
                    setPasswords(decryptedData);
                } else {
                    setPasswords([]);
                }

            } catch (error: any) {
                if (error.response?.status === 404) {
                    // No vault exists yet
                    setPasswords([]);
                    setVersion(1);
                } else {
                    console.error("Error fetching vault:", error);
                    setStatus('error');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchVault();
    }, [keyB, accessToken]);

    const handleAddPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!keyB || !newSite || !newUser || !newPass) return;

        setStatus('saving');

        try {
            const newEntry: PasswordEntry = {
                website: newSite,
                username: newUser,
                password: newPass
            };

            const updatedList = [...passwords, newEntry];

            // Encrypt the vault
            const encryptedVault = await encryptVault(updatedList, keyB);

            // Send to server
            const response = await apiClient.post('/vaults', {
                encrypted_data: encryptedVault.encrypted_data,
                nonce_b64: encryptedVault.nonce_b64,
                version: version
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            // Update UI - use server's returned version
            setPasswords(updatedList);
            setVersion(response.data.version);
            setNewSite('');
            setNewUser('');
            setNewPass('');
            setStatus('success');

            // Reset status after 2 seconds
            setTimeout(() => setStatus('idle'), 2000);

        } catch (error) {
            console.error("Failed to save:", error);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    const handleDeletePassword = async (index: number) => {
        if (!keyB) return;

        setStatus('saving');

        try {
            const updatedList = passwords.filter((_, i) => i !== index);

            // Encrypt and save
            const encryptedVault = await encryptVault(updatedList, keyB);

            if (updatedList.length > 0){
                const response = await apiClient.post('/vaults', {
                    encrypted_data: encryptedVault.encrypted_data,
                    nonce_b64: encryptedVault.nonce_b64,
                    version: version
                }, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                setPasswords(updatedList);
                setVersion(response.data.version);
            }
            else{
                await apiClient.delete('/delete', {
                    headers: { Authorization: `Bearer ${accessToken}`}
                })
                setPasswords([]);
                setVersion(1); // Reset to 1 since vault was deleted
            }

            setStatus('success');
            setTimeout(() => setStatus('idle'), 2000);

        } catch (error) {
            console.error("Failed to delete:", error);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setStatus('success');
            setTimeout(() => setStatus('idle'), 1500);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const togglePasswordVisibility = (index: number) => {
        setVisiblePasswords(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const handleLogout = () => {
        setKeyB(null);
        setAccessToken(null);
        localStorage.removeItem('refresh_token');
        navigate('/login');
    };

    // Loading state
    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Decrypting your vault...</p>
                </div>
            </div>
        );
    }

    
    if (!keyB) return null;

    return (
        <div className="dashboard-container">
            <div className="dashboard-content">
                {/* Header */}
                <div className="dashboard-header">
                    <div className="dashboard-title">
                        <h1>Your Vault</h1>
                        <p>Zero-knowledge encrypted passwords</p>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        Sign Out
                    </button>
                </div>

                {/* Add Password Card */}
                <div className="add-password-card">
                    <h2>Add New Password</h2>
                    <form onSubmit={handleAddPassword} className="add-password-form">
                        <div className="form-group">
                            <label htmlFor="website">Website</label>
                            <input
                                id="website"
                                type="text"
                                value={newSite}
                                onChange={(e) => setNewSite(e.target.value)}
                                placeholder="e.g., github.com"
                                required
                                disabled={status === 'saving'}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                id="username"
                                type="text"
                                value={newUser}
                                onChange={(e) => setNewUser(e.target.value)}
                                placeholder="Username or email"
                                required
                                disabled={status === 'saving'}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="newPassword">Password</label>
                            <input
                                id="newPassword"
                                type="password"
                                value={newPass}
                                onChange={(e) => setNewPass(e.target.value)}
                                placeholder="Enter password"
                                required
                                disabled={status === 'saving'}
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="add-btn"
                            disabled={status === 'saving'}
                        >
                            {status === 'saving' ? 'Saving...' : 'Add'}
                        </button>
                    </form>
                </div>

                {/* Password List Card */}
                <div className="password-list-card">
                    <div className="password-list-header">
                        <h2>Saved Passwords</h2>
                        <span className="password-count">{passwords.length} items</span>
                    </div>

                    {passwords.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🔒</div>
                            <h3>No passwords saved yet</h3>
                            <p>Add your first password above to get started</p>
                        </div>
                    ) : (
                        <div className="password-list">
                            {passwords.map((entry, index) => (
                                <div key={index} className="password-item">
                                    <div className="password-field">
                                        <span className="field-label">Website</span>
                                        <span className="field-value website">{entry.website}</span>
                                    </div>
                                    <div className="password-field">
                                        <span className="field-label">Username</span>
                                        <span className="field-value">{entry.username}</span>
                                    </div>
                                    <div className="password-field">
                                        <span className="field-label">Password</span>
                                        <span className="field-value masked">
                                            {visiblePasswords.has(index) ? entry.password : '••••••••'}
                                        </span>
                                    </div>
                                    <div className="password-actions">
                                        <button 
                                            className="action-btn"
                                            onClick={() => togglePasswordVisibility(index)}
                                            title={visiblePasswords.has(index) ? "Hide" : "Show"}
                                        >
                                            {visiblePasswords.has(index) ? '👁️' : '👁️‍🗨️'}
                                        </button>
                                        <button 
                                            className="action-btn copy"
                                            onClick={() => copyToClipboard(entry.password)}
                                            title="Copy password"
                                        >
                                            📋
                                        </button>
                                        <button 
                                            className="action-btn delete"
                                            onClick={() => handleDeletePassword(index)}
                                            title="Delete"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Status Toast */}
                {status !== 'idle' && (
                    <div className={`status-toast ${status}`}>
                        {status === 'saving' && '💾 Saving...'}
                        {status === 'success' && '✅ Saved successfully!'}
                        {status === 'error' && '❌ Something went wrong'}
                    </div>
                )}
            </div>
        </div>
    );
};