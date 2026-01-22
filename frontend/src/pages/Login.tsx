import  {useState} from 'react'
import apiClient from '../api/client';
import { makeKeys } from '../crypto/kdf';
import { base64toarraybytes } from '../crypto/utils';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import "./Login.css"
import { useDocumentTitle } from '../hooks/titles';


export const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [status, setStatus] = useState('idle')
    const {setKeyB, setAccessToken} = useAuth()
    const navigate = useNavigate()

    useDocumentTitle("Login")

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault() //! prevents reload of the application so that js/ts can handle the data manually (like validation before sending it to api)
        setStatus('loading')

        try{

            const salt_b64 = (await apiClient.post('/auth/salt', { username:email })).data.salt
            const salt = base64toarraybytes(salt_b64)

            const keys = await makeKeys(password, salt)

            const hashed_key_a = keys.key_a //! already in its hashed form
            const key_b = keys.key_b //! in uniu8array/bytes form

            const loginResponse = await apiClient.post('/login', {username: email, hashed_key_a: hashed_key_a})

            const { access_token, refresh_token } = loginResponse.data

            setAccessToken(access_token)
            localStorage.setItem('refresh_token', refresh_token)

            setKeyB(key_b) //! Stored in unit8array/byes format

            console.log("Successfully logged in")
            setPassword('')
            setStatus('success')

            navigate('/dashboard') //! Navigate to dashboard page



        }
        catch(error){
            console.error("Error in handle logic of Login", error)
            setStatus('error')
        }


    }

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>Welcome Back</h1>
                    <p>Zero-knowledge secure login</p>
                </div>

                <form onSubmit={handleLogin} className="login-form">
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
                            placeholder="Enter your password"
                            required
                            disabled={status === 'loading'}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="login-btn"
                        disabled={status === 'loading'}
                    >
                        {status === 'loading' ? 'Signing in...' : 'Sign In'}
                    </button>

                    {status === 'error' && (
                        <div className="status-message error">
                            Login failed. Check your credentials.
                        </div>
                    )}
                </form>

                <div className="login-footer">
                    <p>Don't have an account? <a href="/register">Create one</a></p>
                </div>
            </div>
        </div>
    )
}