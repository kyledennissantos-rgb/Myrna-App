
import { useState } from 'react'

function Computation() {
  const [salary, setSalary] = useState('')
  const [expenses, setExpenses] = useState('')

  const remaining = Number(salary || 0) - Number(expenses || 0)

  return (
    <section
      className="dashboard-content"
      aria-labelledby="computation-title"
    >
      <h2 id="computation-title">Start Allocation</h2>

      <label className="login-field" htmlFor="salary">
        Salary after tax
        <input
          id="salary"
          name="salary"
          type="number"
          min="0"
          placeholder="Enter your salary"
          value={salary}
          onChange={(e) => setSalary(e.target.value)}
        />
      </label>

      <label className="login-field" htmlFor="expenses">
        Expenses
        <input
          id="expenses"
          name="expenses"
          type="number"
          min="0"
          placeholder="Enter your expenses"
          value={expenses}
          onChange={(e) => setExpenses(e.target.value)}
        />
      </label>

      <div className="computation-result">
        <h3>Remaining Balance</h3>
        <p>
          ₱{remaining.toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>

        {remaining < 0 && (
          <span>You have exceeded your salary!</span>
        )}
      </div>
    </section>
  )
}

export default Computation
