import { useState } from 'react'
import Computation from './Computation'

function Dashboard({ user, onSignOut, isLoading }) {
  // Track whether the profile menu is open and which dashboard section is selected.
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activePage, setActivePage] = useState('dashboard')

  // Switch to a section and close the menu after a selection.
  function openPage(page) {
    setActivePage(page)
    setIsMenuOpen(false)
  }

  return (
    <main className='dashboard-page'>
      {/* The header contains the app name and the profile actions menu. */}
      <header className='dashboard-header'>
        <div>
          <h1>Myrna</h1>
          <p>Payday Prosperity</p>
        </div>
        <div className='profile-menu'>
          <button
            className='profile-menu-trigger'
            type='button'
            aria-label='Open profile menu'
            aria-haspopup='menu'
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
          >
            <svg viewBox='0 0 24 24' aria-hidden='true'>
              <path d='M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0' />
            </svg>
          </button>
          {isMenuOpen && (
            <ul className='profile-menu-list' role='menu'>
              <li role='none'>
                <button type='button' role='menuitem' onClick={() => openPage('profile')}>
                  Profile
                </button>
              </li>
              <li role='none'>
                <button type='button' role='menuitem' onClick={() => openPage('account')}>
                  Account
                </button>
              </li>
              <li className='profile-menu-divider' role='none'>
                <button
                  type='button'
                  role='menuitem'
                  onClick={onSignOut}
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing out...' : 'Sign out'}
                </button>
              </li>
            </ul>
          )}
        </div>
      </header>

      {/* Only show the return button while viewing Profile or Account. */}
      {activePage !== 'dashboard' && (
        <div className='dashboard-navigation'>
          <button
            className='dashboard-back'
            type='button'
            onClick={() => setActivePage('dashboard')}
          >
            <span aria-hidden='true'>←</span>
            Back to dashboard
          </button>
        </div>
      )}

      {activePage === 'computation' ? (
        <Computation />
      ) : (
        <>
          {/* Render different content according to the selected dashboard section. */}
          <section className='dashboard-content' aria-labelledby='dashboard-title'>
            <h2 id='dashboard-title'>
              {activePage === 'profile'
                ? 'Profile'
                : activePage === 'account'
                  ? 'Account'
                  : 'Welcome'}
            </h2>
            {activePage === 'profile' ? (
              <p>Signed in as {user.email}.</p>
            ) : activePage === 'account' ? (
              <p>Account settings will appear here.</p>
            ) : (
              <>
                <p>You are signed in as {user.email}.</p>
                <p>Your Myrna dashboard starts here.</p>
              </>
            )}
          </section>

          {activePage === 'dashboard' && (
            <section className='getStarted'>
              <h2>Want to start?</h2>
              <button
                className='logIn'
                type='button'
                onClick={() => setActivePage('computation')}
              >
                Start Allocation
              </button>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default Dashboard