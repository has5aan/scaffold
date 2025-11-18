#!/usr/bin/env node

const knex = require('knex')
const knexConfig = require('../src/config/knex.config')
const path = require('path')
const fs = require('fs')

function createSeed(domain, name) {
  const dir = path.join(__dirname, `../src/${domain}/seeds`)

  // Ensure seeds directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  // Get next number for this domain
  const files = fs.readdirSync(dir)
  const numbers = files
    .filter(f => f.startsWith(`${domain}-`) && f.endsWith('.seed.js'))
    .map(f => {
      const match = f.match(/^[^-]+-(\d+)-/)
      return match ? parseInt(match[1]) : 0
    })

  const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : 1
  const filename = `${domain}-${String(nextNum).padStart(2, '0')}-${name}.js`
  const filepath = path.join(dir, filename)

  const template = `const { getTableName } = require('../../lib/database/migration-helpers')

exports.seed = async function (knex) {
  // Clear existing data (optional)
  // await knex(getTableName('${domain}', '${name}', { knex })).del()

  // Seed data
  const data = [
    // Add your seed data here
  ]

  await knex(getTableName('${domain}', '${name}', { knex })).insert(data)
}
`

  fs.writeFileSync(filepath, template)
  console.log(`✓ Created: ${filepath}`)
}

async function getSeedFiles(domain) {
  const directory = path.join(__dirname, `../src/${domain}/seeds`)

  if (!fs.existsSync(directory)) {
    return []
  }

  const files = fs
    .readdirSync(directory)
    .filter(f => f.endsWith('.js') && f.startsWith(`${domain}-`))
    .sort()

  return files.map(f => ({
    name: f,
    path: path.join(directory, f)
  }))
}

async function runSeeds(domains) {
  const env = process.env.NODE_ENV || 'development'
  const db = knex(knexConfig[env])

  try {
    for (const domain of domains) {
      console.log(`\n[${domain}] Running seeds...`)

      const seedFiles = await getSeedFiles(domain)

      if (seedFiles.length === 0) {
        console.log(`  ✓ No seed files found`)
        continue
      }

      for (const file of seedFiles) {
        console.log(`  • Running: ${file.name}`)

        // Load and run the seed file
        const seedModule = require(file.path)

        if (typeof seedModule.seed === 'function') {
          await seedModule.seed(db)
          console.log(`    ✓ Applied: ${file.name}`)
        } else {
          console.log(`    ⚠️  Skipped: ${file.name} (no seed function)`)
        }
      }
    }

    console.log('\n✓ Done\n')
  } catch (err) {
    console.error('\n✗ Seeding failed:', err.message)
    console.error(err.stack)
    throw err
  } finally {
    await db.destroy()
  }
}

// Add this helper function before the parseDomains usage (around line 105)
function parseDomains(input) {
  if (!input || input.length === 0) {
    return []
  }
  // Handle comma-separated domains: "auth,reference,user" or ["auth", "reference", "user"]
  if (typeof input === 'string') {
    return input
      .split(',')
      .map(d => d.trim())
      .filter(d => d.length > 0)
  }
  // Handle array input
  return input.flatMap(arg => {
    if (arg.includes(',')) {
      return arg
        .split(',')
        .map(d => d.trim())
        .filter(d => d.length > 0)
    }
    return [arg]
  })
}

// Parse command line arguments
const args = process.argv.slice(2)

// Check for create command
if (args[0] === 'create') {
  const [domain, name] = args.slice(1)
  if (!domain || !name) {
    console.error('Usage: node scripts/seed.js create <domain> <name>')
    console.error('Example: node scripts/seed.js create reference countries')
    process.exit(1)
  }
  createSeed(domain, name)
  process.exit(0)
}

let domains = parseDomains(args)

// Require domains to be specified
if (domains.length === 0) {
  console.error('Error: No domains specified')
  console.error('Usage: node scripts/seed.js <domain1,domain2,...>')
  console.error('Example: node scripts/seed.js reference,user')
  console.error('Example: node scripts/seed.js reference user')
  process.exit(1)
}

console.log(`Running seeds for: ${domains.join(', ')}`)

runSeeds(domains).catch(() => process.exit(1))
