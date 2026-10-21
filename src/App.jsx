import { useEffect, useState } from 'react'
import './App.css'
import appLogo from './images/app-logo.png'
import { supabase } from './supabase'

function App() {
  const [isLogin, setIsLogin] = useState(false)
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
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')

    if (!isLogin && password !== confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }

    setIsLoading(true)

    try {
      if (isLogin) {
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

  function switchMode() {
    setIsLogin((currentMode) => !currentMode)
    setMessage('')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <main className='login-page'>
      <section className='brand-panel' aria-label='Myrna Payday Prosperity'>
        <img className='app-logo' src={appLogo} alt='Myrna Payday Prosperity' />
      </section>

      <section
        className='login-panel'
        aria-labelledby={session ? 'welcome-title' : isLogin ? 'login-title' : 'registration-title'}
      >
        <div className='app-name'>
          <h1>MYRNA</h1>
          <h2>Payday Prosperity</h2>
        </div>

        {session ? (
          <div className='registration-box'>
            <h1 id='welcome-title'>Welcome</h1>
            <p>You are signed in as {session.user.email}.</p>
            <button className='logIn' type='button' onClick={handleSignOut} disabled={isLoading}>
              {isLoading ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        ) : (
          <form className='registration-box' onSubmit={handleSubmit}>
            <h1 id={isLogin ? 'login-title' : 'registration-title'}>
              {isLogin ? 'Log in' : 'Create account'}
            </h1>

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

            <label className='login-field' htmlFor='password'>
              Password
              <input
                id='password'
                name='password'
                type='password'
                placeholder='Password'
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            {!isLogin && (
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
              {isLoading ? 'Please wait...' : isLogin ? 'Log in' : 'Register'}
            </button>
            <button className='auth-switch' type='button' onClick={switchMode} disabled={isLoading}>
              {isLogin ? 'Need an account? Register' : 'Already have an account? Log in'}
            </button>
          </form>
        )}

        {session && message && <p className='auth-message' role='status'>{message}</p>}
      </section>
    </main>
  )
}

export default App
