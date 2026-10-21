import { createClient } from '@supabase/supabase-js'
import express from 'express'
import { MongoClient, ObjectId } from 'mongodb'

const requiredEnvironmentVariables = [
  'MONGODB_URI',
  'MONGODB_DB_NAME',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
]

const missingEnvironmentVariables = requiredEnvironmentVariables.filter(
  (name) => !process.env[name],
)

if (missingEnvironmentVariables.length > 0) {
  throw new Error(
    `Missing environment variables: ${missingEnvironmentVariables.join(', ')}`,
  )
}

const app = express()
const mongoClient = new MongoClient(process.env.MONGODB_URI)
const database = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  },
)

app.disable('x-powered-by')
app.use(express.json({ limit: '32kb' }))

async function requireUser(req, res, next) {
  const authorization = req.get('authorization')
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]

  if (!token) {
    res.status(401).json({ error: 'Sign in to access allocations.' })
    return
  }

  const { data, error } = await database.auth.getUser(token)

  if (error || !data.user) {
    res.status(401).json({ error: 'Your session is invalid or expired. Please sign in again.' })
    return
  }

  req.userId = data.user.id
  next()
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/allocations', requireUser, async (req, res) => {
  try {
    const allocations = await mongoClient
      .db(process.env.MONGODB_DB_NAME)
      .collection('allocations')
      .find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .toArray()

    res.json(
      allocations.map(({ _id, salaryCents, expenses, createdAt }) => ({
        id: _id.toString(),
        salary_cents: salaryCents,
        expenses,
        created_at: createdAt.toISOString(),
      })),
    )
  } catch (error) {
    console.error('Failed to load allocations:', error)
    res.status(500).json({ error: 'Could not load saved allocations.' })
  }
})

app.post('/api/allocations', requireUser, async (req, res) => {
  const { salary_cents: salaryCents, expenses } = req.body ?? {}

  if (!Number.isSafeInteger(salaryCents) || salaryCents < 0) {
    res.status(400).json({ error: 'Salary must be a non-negative amount in cents.' })
    return
  }

  if (!Array.isArray(expenses) || expenses.length > 100) {
    res.status(400).json({ error: 'Expenses must be a list with no more than 100 items.' })
    return
  }

  const normalizedExpenses = []

  for (const expense of expenses) {
    const name = typeof expense?.name === 'string' ? expense.name.trim() : ''
    const amountCents = expense?.amount_cents

    if (
      !name ||
      name.length > 100 ||
      !Number.isSafeInteger(amountCents) ||
      amountCents < 0
    ) {
      res.status(400).json({ error: 'Each expense needs a name and a non-negative amount in cents.' })
      return
    }

    normalizedExpenses.push({ name, amount_cents: amountCents })
  }

  const allocation = {
    userId: req.userId,
    salaryCents,
    expenses: normalizedExpenses,
    createdAt: new Date(),
  }

  try {
    const result = await mongoClient
      .db(process.env.MONGODB_DB_NAME)
      .collection('allocations')
      .insertOne(allocation)

    res.status(201).json({
      id: result.insertedId.toString(),
      salary_cents: allocation.salaryCents,
      expenses: allocation.expenses,
      created_at: allocation.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('Failed to save allocation:', error)
    res.status(500).json({ error: 'Could not save allocation.' })
  }
})

app.delete('/api/allocations/:id', requireUser, async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: 'Invalid allocation ID.' })
    return
  }

  try {
    const result = await mongoClient
      .db(process.env.MONGODB_DB_NAME)
      .collection('allocations')
      .deleteOne({
        _id: new ObjectId(req.params.id),
        userId: req.userId,
      })

    if (result.deletedCount === 0) {
      res.status(404).json({ error: 'Allocation not found.' })
      return
    }

    res.status(204).end()
  } catch (error) {
    console.error('Failed to delete allocation:', error)
    res.status(500).json({ error: 'Could not delete allocation.' })
  }
})

app.use((error, _req, res, next) => {
  if (res.headersSent) {
    next(error)
    return
  }

  console.error('API request failed:', error)
  res.status(500).json({ error: 'An unexpected server error occurred.' })
})

const port = Number(process.env.PORT || 3000)

try {
  await mongoClient.connect()
  await mongoClient
    .db(process.env.MONGODB_DB_NAME)
    .collection('allocations')
    .createIndex({ userId: 1, createdAt: -1 })

  app.listen(port, () => {
    console.log(`Myrna API listening on http://localhost:${port}`)
  })
} catch (error) {
  console.error('Could not start the API server:', error)
  await mongoClient.close()
  process.exitCode = 1
}
