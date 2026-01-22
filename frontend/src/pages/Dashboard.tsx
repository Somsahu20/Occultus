import { useState } from "react";
import generator from "generate-password-ts";

interface PasswordEntry {
    website: string;
    username: string;
    password: string;
}

export default function Dashboard() {
    const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
    const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

    // Form state
    const [newSite, setNewSite] = useState('');
    const [newUser, setNewUser] = useState('');
    const [newPass, setNewPass] = useState('');

    // Password visibility state
    const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set());

    const generateStrongPassword = () => {
        const customPassword: string = generator.generate({
            length: 12,
            numbers: true,
            symbols: true,
            uppercase: true,
            lowercase: true,
            excludeSimilarCharacters: true,
            strict: true
        });

        setNewPass(customPassword);
    };

    const handleAddPassword = () => {
        if (!newSite || !newUser || !newPass) return;

        setStatus('saving');

        const newEntry: PasswordEntry = {
            website: newSite,
            username: newUser,
            password: newPass
        };

        const updatedList = [...passwords, newEntry];
        setPasswords(updatedList);
        setNewSite('');
        setNewUser('');
        setNewPass('');
        setStatus('success');

        setTimeout(() => setStatus('idle'), 2000);
    };

    const handleDeletePassword = (index: number) => {
        setStatus('saving');
        const updatedList = passwords.filter((_, i) => i !== index);
        setPasswords(updatedList);
        setStatus('success');
        setTimeout(() => setStatus('idle'), 2000);
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="max-w-4xl mx-auto p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Your Vault</h1>
                        <p className="text-purple-300">Zero-knowledge encrypted passwords</p>
                    </div>
                    <button className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                        Sign Out
                    </button>
                </div>

                {/* Add Password Card */}
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
                    <h2 className="text-2xl font-semibold text-white mb-4">Add New Password</h2>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="website" className="block text-sm font-medium text-purple-200 mb-2">
                                Website
                            </label>
                            <input
                                id="website"
                                type="text"
                                value={newSite}
                                onChange={(e) => setNewSite(e.target.value)}
                                placeholder="e.g., github.com"
                                disabled={status === 'saving'}
                                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                            />
                        </div>
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-purple-200 mb-2">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={newUser}
                                onChange={(e) => setNewUser(e.target.value)}
                                placeholder="Username or email"
                                disabled={status === 'saving'}
                                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                            />
                        </div>
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-purple-200 mb-2">
                                Password
                            </label>
                            <div className="flex gap-2">
                                <input
                                    id="newPassword"
                                    type="text"
                                    value={newPass}
                                    onChange={(e) => setNewPass(e.target.value)}
                                    placeholder="Enter password"
                                    disabled={status === 'saving'}
                                    className="flex-1 px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                                />
                                <button
                                    type="button"
                                    onClick={generateStrongPassword}
                                    disabled={status === 'saving'}
                                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                    title="Generate a strong password"
                                >
                                    🎲 Generate
                                </button>
                            </div>
                            <p className="mt-1 text-xs text-purple-300">
                                Click "Generate" for a secure 12-character password
                            </p>
                        </div>
                        <button 
                            type="button"
                            onClick={handleAddPassword}
                            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all font-semibold disabled:opacity-50"
                            disabled={status === 'saving'}
                        >
                            {status === 'saving' ? 'Saving...' : '➕ Add Password'}
                        </button>
                    </div>
                </div>

                {/* Password List Card */}
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold text-white">Saved Passwords</h2>
                        <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-medium">
                            {passwords.length} items
                        </span>
                    </div>

                    {passwords.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🔒</div>
                            <h3 className="text-xl font-semibold text-white mb-2">No passwords saved yet</h3>
                            <p className="text-purple-300">Add your first password above to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {passwords.map((entry, index) => (
                                <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                        <div>
                                            <span className="text-xs text-purple-300 font-medium">Website</span>
                                            <div className="text-white font-medium mt-1">{entry.website}</div>
                                        </div>
                                        <div>
                                            <span className="text-xs text-purple-300 font-medium">Username</span>
                                            <div className="text-white mt-1">{entry.username}</div>
                                        </div>
                                        <div>
                                            <span className="text-xs text-purple-300 font-medium">Password</span>
                                            <div className="text-white mt-1 font-mono">
                                                {visiblePasswords.has(index) ? entry.password : '••••••••'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                                            onClick={() => togglePasswordVisibility(index)}
                                            title={visiblePasswords.has(index) ? "Hide" : "Show"}
                                        >
                                            {visiblePasswords.has(index) ? '👁️ Hide' : '👁️‍🗨️ Show'}
                                        </button>
                                        <button 
                                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                                            onClick={() => copyToClipboard(entry.password)}
                                            title="Copy password"
                                        >
                                            📋 Copy
                                        </button>
                                        <button 
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                                            onClick={() => handleDeletePassword(index)}
                                            title="Delete"
                                        >
                                            🗑️ Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Status Toast */}
                {status !== 'idle' && (
                    <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg transform transition-all ${
                        status === 'saving' ? 'bg-blue-600' :
                        status === 'success' ? 'bg-green-600' :
                        'bg-red-600'
                    } text-white font-medium`}>
                        {status === 'saving' && '💾 Saving...'}
                        {status === 'success' && '✅ Saved successfully!'}
                        {status === 'error' && '❌ Something went wrong'}
                    </div>
                )}
            </div>
        </div>
    );
}
