import './App.css'
import appLogo from './images/app-logo.png'
import { useState } from 'react'

const userIsRegistered = false;

function App() {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  function handleRegister(e) {
    e.preventDefault();

    console.log("Submitted registration form");
  }

  function handleLogin(e) {
    e.preventDefault();

    console.log(username , password);
    
  }

  function handleUsername(e) {
    setUsername(e.target.value);
  }

  function handlePassword(e) {
    setPassword(e.target.value);
  }

  return (
    <main className='login-page'>
      <section class  Name='brand-panel' aria-label='Myrna Payday Prosperity'>
        <img className='app-logo' src={appLogo} alt='Myrna Payday Prosperity' />
      </section>

      <section
        className='login-panel'
        aria-labelledby={userIsRegistered ? 'login-title' : 'registration-title'}
      >

        <div className='app-name'>
          <h1>MYRNA</h1>
          <h2>Payday Prosperity</h2>
        </div>

        {userIsRegistered ? (
          <form className='registration-box' onSubmit={handleLogin}>
            <h1 id='login-title'>Log in</h1>

            <label className='login-field' htmlFor='username'>
              Username
              <input onChange={handleUsername} id='username' name='username' type='text' placeholder='Username' autoComplete='username' />
            </label>

            <label className='login-field' htmlFor='password'>
              Password
              <input onChange={handlePassword} id='password' name='password' type='password' placeholder='Password' autoComplete='current-password' />
            </label>

            <button className='logIn' type='submit'>Log in</button>
          </form>
        ) : (
          <form className='registration-box' onSubmit={handleRegister}>
            <h1 id='registration-title'>Create account</h1>

            <label className='login-field' htmlFor='register-username'>
              Username
              <input id='register-username' name='username' type='text' placeholder='Username' autoComplete='username' />
            </label>

            <label className='login-field' htmlFor='register-password'>
              Password
              <input id='register-password' name='password' type='password' placeholder='Password' autoComplete='new-password' />
            </label>

            <label className='login-field' htmlFor='confirm-password'>
              Confirm password
              <input id='confirm-password' name='confirmPassword' type='password' placeholder='Confirm password' autoComplete='new-password' />
            </label>

            <button className='logIn' type='submit'>Register</button>
          </form>
        )}
      </section>
    </main>
  )
}

export default App
