
import { useEffect, useState } from 'react'
import {
  createAllocation,
  deleteAllocation,
  getAllocations,
} from './service/allocationApi'

function Computation({ user, accessToken }) {
  const [salary, setSalary] = useState('')
  const [expenses, setExpenses] = useState([])
  const [nextExpenseId, setNextExpenseId] = useState(1)
  const [savedAllocations, setSavedAllocations] = useState([])
  const [isLoadingAllocations, setIsLoadingAllocations] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingAllocationId, setDeletingAllocationId] = useState(null)
  const [message, setMessage] = useState('')

  function toCents(value) {
    const amount = Number(value)
    return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : 0
  }

  const salaryInCents = toCents(salary)
  const expensesInCents = expenses.reduce(
    (total, expense) => total + toCents(expense.amount),
    0,
  )
  const remainingInCents = salaryInCents - expensesInCents

  useEffect(() => {
    let isMounted = true

    async function loadAllocations() {
      try {
        const allocations = await getAllocations(accessToken)

        if (!isMounted) return

        setSavedAllocations(allocations)
      } catch (error) {
        if (isMounted) {
          setMessage(`Could not load saved allocations: ${error.message}`)
        }
      } finally {
        if (isMounted) setIsLoadingAllocations(false)
      }
    }

    loadAllocations()

    return () => {
      isMounted = false
    }
  }, [user.id, accessToken])

  function addExpense() {
    setExpenses((currentExpenses) => [
      ...currentExpenses,
      { id: nextExpenseId, name: '', amount: '' },
    ])
    setNextExpenseId((currentId) => currentId + 1)
  }

  function updateExpense(id, field, value) {
    setExpenses((currentExpenses) =>
      currentExpenses.map((expense) =>
        expense.id === id ? { ...expense, [field]: value } : expense,
      ),
    )
  }

  function removeExpense(id) {
    setExpenses((currentExpenses) =>
      currentExpenses.filter((expense) => expense.id !== id),
    )
  }

  function formatCurrency(cents) {
    return `₱${(cents / 100).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  async function saveAllocation() {
    setMessage('')

    if (salary.trim() === '' || !Number.isFinite(Number(salary)) || Number(salary) < 0) {
      setMessage('Enter a valid salary before saving.')
      return
    }

    const hasIncompleteExpense = expenses.some(
      (expense) =>
        !expense.name.trim() ||
        expense.amount.trim() === '' ||
        !Number.isFinite(Number(expense.amount)) ||
        Number(expense.amount) < 0,
    )

    if (hasIncompleteExpense) {
      setMessage('Give each expense a name and a valid amount, or remove the empty row.')
      return
    }

    setIsSaving(true)

    const expenseSnapshot = expenses.map(({ name, amount }) => ({
      name: name.trim(),
      amount_cents: toCents(amount),
    }))

    try {
      const allocation = await createAllocation(accessToken, {
        salary_cents: salaryInCents,
        expenses: expenseSnapshot,
      })

      setSavedAllocations((currentAllocations) => [allocation, ...currentAllocations])
      setMessage('Allocation saved.')
    } catch (error) {
      setMessage(`Could not save allocation: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  function loadAllocation(allocation) {
    setSalary((allocation.salary_cents / 100).toFixed(2))
    setExpenses(
      allocation.expenses.map((expense, index) => ({
        id: index + 1,
        name: expense.name,
        amount: (expense.amount_cents / 100).toFixed(2),
      })),
    )
    setNextExpenseId(allocation.expenses.length + 1)
    setMessage('Saved allocation loaded.')
  }

  async function handleDeleteAllocation(allocation) {
    const confirmed = window.confirm('Delete this saved allocation? This cannot be undone.')

    if (!confirmed) return

    setMessage('')
    setDeletingAllocationId(allocation.id)

    try {
      await deleteAllocation(accessToken, allocation.id)
      setSavedAllocations((currentAllocations) =>
        currentAllocations.filter((item) => item.id !== allocation.id),
      )
      setMessage('Allocation deleted.')
    } catch (error) {
      setMessage(`Could not delete allocation: ${error.message}`)
    } finally {
      setDeletingAllocationId(null)
    }
  }

  return (
    <section
      className="dashboard-content allocation-workspace"
      aria-labelledby="computation-title"
    >
      <span className="section-eyebrow">PLAN YOUR PAYDAY</span>
      <h2 id="computation-title">Start Allocation</h2>
      <p className="allocation-intro">Enter your take-home salary, then add the expenses you want to account for.</p>

      <label className="login-field" htmlFor="salary">
        Salary after tax
        <input
          id="salary"
          name="salary"
          type="number"
          min="0"
          step="0.01"
          placeholder="Enter your salary"
          value={salary}
          onChange={(e) => setSalary(e.target.value)}
        />
      </label>

      <div className="expenses-section">
        <h3>Expenses</h3>
        {expenses.map((expense, index) => (
          <div className="expense-row" key={expense.id}>
            <label className="login-field" htmlFor={`expense-name-${expense.id}`}>
              Expense {index + 1}
              <input
                id={`expense-name-${expense.id}`}
                type="text"
                placeholder="e.g. Rent"
                value={expense.name}
                onChange={(event) =>
                  updateExpense(expense.id, 'name', event.target.value)
                }
              />
            </label>
            <label className="login-field" htmlFor={`expense-amount-${expense.id}`}>
              Amount
              <input
                id={`expense-amount-${expense.id}`}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={expense.amount}
                onChange={(event) =>
                  updateExpense(expense.id, 'amount', event.target.value)
                }
              />
            </label>
            <button
              className="remove-expense"
              type="button"
              onClick={() => removeExpense(expense.id)}
              aria-label={`Remove expense ${index + 1}`}
            >
              Remove
            </button>
          </div>
        ))}
        <button className="add-expense" type="button" onClick={addExpense}>
          + Add expense
        </button>
      </div>

      <div className="computation-result">
        <h3>Total Expenses</h3>
        <p>{formatCurrency(expensesInCents)}</p>
        <h3>Remaining Balance</h3>
        <p>{formatCurrency(remainingInCents)}</p>

        {remainingInCents < 0 && (
          <span>You have exceeded your salary!</span>
        )}
      </div>

      {message && <p className="allocation-message" role="status">{message}</p>}

      <button
        className="logIn allocation-save"
        type="button"
        onClick={saveAllocation}
        disabled={isSaving}
      >
        {isSaving ? 'Saving...' : 'Save allocation'}
      </button>

      <section className="saved-allocations" aria-labelledby="saved-allocations-title">
        <h3 id="saved-allocations-title">Saved allocations</h3>
        {isLoadingAllocations ? (
          <p>Loading saved allocations...</p>
        ) : savedAllocations.length === 0 ? (
          <p>You have no saved allocations yet.</p>
        ) : (
          <ul>
            {savedAllocations.map((allocation) => {
              const savedExpensesInCents = allocation.expenses.reduce(
                (total, expense) => total + expense.amount_cents,
                0,
              )
              const savedAt = new Date(allocation.created_at).toLocaleString()

              return (
                <li className="saved-allocation" key={allocation.id}>
                  <div>
                    <strong>{savedAt}</strong>
                    <span>Salary: {formatCurrency(allocation.salary_cents)}</span>
                    <span>Expenses: {formatCurrency(savedExpensesInCents)}</span>
                    <span>
                      Remaining:{' '}
                      {formatCurrency(allocation.salary_cents - savedExpensesInCents)}
                    </span>
                  </div>
                  <div className="saved-allocation-actions">
                    <button
                      className="load-allocation"
                      type="button"
                      onClick={() => loadAllocation(allocation)}
                    >
                      Revisit
                    </button>
                    <button
                      className="delete-allocation"
                      type="button"
                      onClick={() => handleDeleteAllocation(allocation)}
                      disabled={deletingAllocationId === allocation.id}
                    >
                      {deletingAllocationId === allocation.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </section>
  )
}

export default Computation
