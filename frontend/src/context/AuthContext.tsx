import { createContext, useContext, useState, type ReactNode } from 'react'

interface AuthContextType {
    keyB: Uint8Array | null
    setKeyB: (key: Uint8Array | null) => void
    accessToken: string | null
    setAccessToken: (token: string | null) => void
    isAuthenticated: boolean
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [keyB, setKeyB] = useState<Uint8Array | null>(null)
    const [accessToken, setAccessToken] = useState<string | null>(null)

    const logout = () => {
        setKeyB(null)
        setAccessToken(null)
        localStorage.removeItem('refresh_token')
    }

    return (
        <AuthContext.Provider value={{
            keyB,
            setKeyB,
            accessToken,
            setAccessToken,
            isAuthenticated: keyB !== null && accessToken !== null,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    )
}

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}
