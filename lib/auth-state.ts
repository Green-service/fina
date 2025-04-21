import { createClient } from '@/lib/supabase/client'

// Create a singleton to store auth state
class AuthStateManager {
  private static instance: AuthStateManager
  private isAuthenticated: boolean = false
  private user: any = null
  private userRole: string | null = null
  private supabase = createClient()

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeAuthState()
    }
  }

  public static getInstance(): AuthStateManager {
    if (!AuthStateManager.instance) {
      AuthStateManager.instance = new AuthStateManager()
    }
    return AuthStateManager.instance
  }

  private initializeAuthState() {
    if (typeof window === 'undefined') return

    // Try to get stored user data
    const storedUserData = localStorage.getItem('userData')
    if (storedUserData) {
      try {
        const userData = JSON.parse(storedUserData)
        this.user = userData.user
        this.userRole = userData.role
        this.isAuthenticated = true
        this.emitAuthStateChange()
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        this.logout()
      }
    }

    // Listen for storage events from other tabs
    window.addEventListener('storage', this.handleStorageEvent)
  }

  private handleStorageEvent = (event: StorageEvent) => {
    if (event.key === 'userData') {
      if (!event.newValue) {
        this.logout()
      } else {
        try {
          const userData = JSON.parse(event.newValue)
          this.user = userData.user
          this.userRole = userData.role
          this.isAuthenticated = true
          this.emitAuthStateChange()
        } catch (error) {
          console.error('Error parsing stored user data:', error)
          this.logout()
        }
      }
    }
  }

  public cleanup() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageEvent)
    }
  }

  public setAuthenticated(value: boolean) {
    this.isAuthenticated = value
  }

  public setUser(user: any) {
    this.user = user
    this.isAuthenticated = true
    // Store complete user data in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('userData', JSON.stringify({
        user: this.user,
        role: this.userRole
      }))
    }
  }

  public setUserRole(role: string) {
    this.userRole = role
    if (this.user && typeof window !== 'undefined') {
      localStorage.setItem('userData', JSON.stringify({
        user: this.user,
        role: this.userRole
      }))
    }
  }

  public logout() {
    this.isAuthenticated = false
    this.user = null
    this.userRole = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userData')
    }
  }

  public isUserAuthenticated(): boolean {
    return this.isAuthenticated
  }

  public getUserId(): string | null {
    return this.user?.id || null
  }

  public getUserRole(): string | null {
    return this.userRole
  }

  public getUser(): any {
    return this.user
  }

  private emitAuthStateChange() {
    // Dispatch a custom event that components can listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('authStateChange', {
        detail: {
          isAuthenticated: this.isAuthenticated,
          user: this.user,
          role: this.userRole
        }
      }))
    }
  }
}

// Export a singleton instance
export const authState = AuthStateManager.getInstance() 