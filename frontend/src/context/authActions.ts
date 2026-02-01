// Global auth actions for use outside React components (e.g., axios interceptor)
// This file exists to avoid Fast Refresh issues in AuthContext.tsx

type SetAccessTokenFn = (token: string | null) => void
type LogoutFn = () => void

let globalSetAccessToken: SetAccessTokenFn | null = null
let globalLogout: LogoutFn | null = null

export const getGlobalAuthActions = () => ({
    setAccessToken: globalSetAccessToken,
    logout: globalLogout
})

export const registerGlobalAuthActions = (
    setAccessToken: SetAccessTokenFn,
    logout: LogoutFn
) => {
    globalSetAccessToken = setAccessToken
    globalLogout = logout
}

export const unregisterGlobalAuthActions = () => {
    globalSetAccessToken = null
    globalLogout = null
}
