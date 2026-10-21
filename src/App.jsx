import { useEffect, useState } from 'react'
import './App.css'
import appLogo from './images/app-logo.png'
import { supabase } from './supabase'
import Dashboard from './Dashboard'

function App() {
  const [authView, setAuthView] = useState('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession()

      if (!isMounted) return

      if (error) {
        setMessage(error.message)
        return
      }

      setSession(data.session)
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession)

      if (event === 'PASSWORD_RECOVERY') {
        setAuthView('reset-password')
        setMessage('')
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')

    if (
      (authView === 'signup' || authView === 'reset-password') &&
      password !== confirmPassword
    ) {
      setMessage('Passwords do not match.')
      return
    }

    setIsLoading(true)

    try {
      if (authView === 'forgot-password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        })

        if (error) throw error
        setMessage('If an account exists for that email, a password reset link has been sent.')
      } else if (authView === 'reset-password') {
        const { error } = await supabase.auth.updateUser({ password })

        if (error) throw error
        setPassword('')
        setConfirmPassword('')
        setAuthView('login')
        setMessage('Your password has been updated.')
      } else if (authView === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error
        setMessage('You are signed in.')
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) throw error
        setMessage(
          data.session
            ? 'Your account has been created and you are signed in.'
            : 'Account created. Check your email for a confirmation link.',
        )
      }
    } catch (error) {
      setMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  function changeAuthView(nextView) {
    setAuthView(nextView)
    setMessage('')
    setPassword('')
    setConfirmPassword('')
  }

  async function handleSignOut() {
    setMessage('')
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setMessage('You have signed out.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (session && authView !== 'reset-password') {
    return (
      <Dashboard
        user={session.user}
        onSignOut={handleSignOut}
        isLoading={isLoading}
      />
    )
  }

  const title = authView === 'login'
    ? 'login-title'
    : authView === 'forgot-password'
      ? 'forgot-password-title'
      : authView === 'reset-password'
        ? 'reset-password-title'
        : 'registration-title'

  return (
    <main className='login-page'>
      <section className='brand-panel' aria-label='Myrna Payday Prosperity'>
        <img className='app-logo' src={appLogo} alt='Myrna Payday Prosperity' />
      </section>

      <section
        className='login-panel'
        aria-labelledby={title}
      >
        <div className='app-name'>
          <h1>MYRNA</h1>
          <h2>Payday Prosperity</h2>
        </div>

        <form className='registration-box' onSubmit={handleSubmit}>
            <h1 id={title}>
              {authView === 'login'
                ? 'Log in'
                : authView === 'forgot-password'
                  ? 'Forgot password'
                  : authView === 'reset-password'
                    ? 'Choose a new password'
                    : 'Create account'}
            </h1>

            {authView !== 'reset-password' && (
              <label className='login-field' htmlFor='email'>
                Email
                <input
                  id='email'
                  name='email'
                  type='email'
                  placeholder='you@example.com'
                  autoComplete='email'
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
            )}

            {authView !== 'forgot-password' && (
              <label className='login-field' htmlFor='password'>
                {authView === 'reset-password' ? 'New password' : 'Password'}
                <input
                  id='password'
                  name='password'
                  type='password'
                  placeholder={authView === 'reset-password' ? 'New password' : 'Password'}
                  autoComplete={authView === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>
            )}

            {(authView === 'signup' || authView === 'reset-password') && (
              <label className='login-field' htmlFor='confirm-password'>
                Confirm password
                <input
                  id='confirm-password'
                  name='confirmPassword'
                  type='password'
                  placeholder='Confirm password'
                  autoComplete='new-password'
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </label>
            )}

            {message && <p className='auth-message' role='status'>{message}</p>}

            <button className='logIn' type='submit' disabled={isLoading}>
              {isLoading
                ? 'Please wait...'
                : authView === 'login'
                  ? 'Log in'
                  : authView === 'forgot-password'
                    ? 'Send reset link'
                    : authView === 'reset-password'
                      ? 'Update password'
                      : 'Register'}
            </button>

            {authView === 'login' && (
              <button
                className='auth-switch'
                type='button'
                onClick={() => changeAuthView('forgot-password')}
                disabled={isLoading}
              >
                Forgot password?
              </button>
            )}

            {(authView === 'signup' || authView === 'login') && (
              <button
                className='auth-switch'
                type='button'
                onClick={() => changeAuthView(authView === 'login' ? 'signup' : 'login')}
                disabled={isLoading}
              >
                {authView === 'login' ? 'Need an account? Register' : 'Already have an account? Log in'}
              </button>
            )}

            {(authView === 'forgot-password' || authView === 'reset-password') && (
              <button
                className='auth-switch'
                type='button'
                onClick={() => changeAuthView('login')}
                disabled={isLoading}
              >
                Back to log in
              </button>
            )}
        </form>
      </section>
    </main>
  )
}

export default App
