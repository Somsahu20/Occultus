import  {useState} from 'react'
import apiClient from '../api/client';
import { generateSalt, makeKeys } from '../crypto/kdf';
import { arrayBufferToBase64 } from '../crypto/utils';
import { useAuth } from '../context/AuthContext';
import { validatePassword } from './utils';
import './Register.css'
import { useDocumentTitle } from '../hooks/titles';


export const Register = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [status, setStatus] = useState('idle')
    const { setKeyB } = useAuth()
    const [passwordError, setPasswordError] = useState<string[]>([])

    useDocumentTitle("Register")

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        const validation = validatePassword(password)
        if (!validation.isValid){
            setPasswordError(validation.errors)
            return;
        }
        setPasswordError([])
        setStatus('loading');
        try {
          //! zero knowledge part
          
          
          const saltBytes = generateSalt(16);
          const salt_b64 = arrayBufferToBase64(saltBytes);

          
          const keys = await makeKeys(password, saltBytes);

        
          await apiClient.post('/auth/register', {
            username: email,
            salt_b64: salt_b64,     
            hashed_key_a: keys.key_a 
          });
          setKeyB(keys.key_b) //! The key_b gets stored here, Stored in unit8array/byes format
          setPassword('')
    
          setStatus('success');
          console.log("User created! Key B is ready in memory (but we won't use it yet).");
    
        } catch (error) {
          console.error(error);
          setStatus('error');
        }
      };

    return (
        <div className="register-container">
            <div className="register-card">
                <div className="register-header">
                    <h1>Create Account</h1>
                    <p>Secure, zero-knowledge encryption</p>
                </div>

                <form onSubmit={handleRegister} className="register-form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                            disabled={status === 'loading'}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Master Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Create a strong password"
                            required
                            disabled={status === 'loading'}
                        />
                        {passwordError.length > 0 && (
                        <ul className="password-errors">
                            {passwordError.map((err, i) => (
                                <li key={i}>{err}</li>
                            ))}
                        </ul>
                    )}
                    </div>

                    <button 
                        type="submit" 
                        className="register-btn"
                        disabled={status === 'loading'}
                    >
                        {status === 'loading' ? 'Creating Account...' : 'Register'}
                    </button>

                    {status === 'success' && (
                        <div className="status-message success">
                            Account created successfully!
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="status-message error">
                            Registration failed. Please try again.
                        </div>
                    )}
                </form>

                <div className="register-footer">
                    <p>Already have an account? <a href="/login">Sign in</a></p>
                </div>
            </div>
        </div>
    )
}