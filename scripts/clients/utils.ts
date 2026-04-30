import type { ClientFormData } from "../../lib/types"

const INDIVIDUAL_FIRST_NAMES = [
  "Juan",
  "María",
  "Carlos",
  "Ana",
  "Pedro",
  "Rosa",
  "Luis",
  "Carmen",
  "Miguel",
  "Isabel",
]

const INDIVIDUAL_LAST_NAMES = [
  "García",
  "Martínez",
  "López",
  "González",
  "Rodríguez",
  "Fernández",
  "Pérez",
  "Sánchez",
  "Gutiérrez",
  "Jiménez",
]

const COMPANY_NAMES = [
  "TechSoft Solutions, S.L.",
  "Innovatech Consulting, S.A.",
  "Digital First, S.L.",
  "Cloud Systems, S.A.",
  "DevOps Pro, S.L.",
  "Data Analytics Corp, S.A.",
  "Secure Networks, S.L.",
  "Innovation Labs, S.A.",
  "Smart Services, S.L.",
  "Future Tech, S.A.",
]

const SPANISH_CITIES = [
  "Madrid",
  "Barcelona",
  "Valencia",
  "Sevilla",
  "Bilbao",
  "Málaga",
  "Murcia",
  "Zaragoza",
  "Alicante",
  "Córdoba",
]

const SPANISH_POSTCODES = [
  "28001",
  "08002",
  "46001",
  "41001",
  "48001",
  "29001",
  "30001",
  "50001",
  "03001",
  "14001",
]

const STREETS = [
  "Calle Principal",
  "Avenida Central",
  "Plaza Mayor",
  "Paseo de la Castellana",
  "Calle de Serrano",
  "Avenida Diagonal",
  "Calle de Alcalá",
  "Gran Vía",
  "Paseo del Prado",
  "Calle de la Paz",
]

/**
 * Generate a random number between min and max (inclusive)
 */
export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Generate a random individual client
 */
export function generateIndividualClient(): ClientFormData {
  const firstName =
    INDIVIDUAL_FIRST_NAMES[
      Math.floor(Math.random() * INDIVIDUAL_FIRST_NAMES.length)
    ]
  const lastName =
    INDIVIDUAL_LAST_NAMES[
      Math.floor(Math.random() * INDIVIDUAL_LAST_NAMES.length)
    ]
  const name = `${firstName} ${lastName}`

  // NIF format: 8 digits + 1 letter
  const nif = `${randomBetween(10000000, 99999999)}${String.fromCharCode(
    65 + Math.floor(Math.random() * 26)
  )}`

  const street = STREETS[Math.floor(Math.random() * STREETS.length)]
  const streetNumber = randomBetween(1, 200)
  const city = SPANISH_CITIES[Math.floor(Math.random() * SPANISH_CITIES.length)]
  const postcode =
    SPANISH_POSTCODES[Math.floor(Math.random() * SPANISH_POSTCODES.length)]
  const address = `${street} ${streetNumber}, ${postcode} ${city}`

  return {
    clientType: "individual",
    name,
    taxId: nif,
    address,
  }
}

/**
 * Generate a random company client
 */
export function generateCompanyClient(): ClientFormData {
  const company =
    COMPANY_NAMES[Math.floor(Math.random() * COMPANY_NAMES.length)]

  // CIF format: 1 letter + 7 digits + 1 control character
  const cifLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26))
  const cif = `${cifLetter}${randomBetween(1000000, 9999999)}${String.fromCharCode(
    65 + Math.floor(Math.random() * 26)
  )}`

  const street = STREETS[Math.floor(Math.random() * STREETS.length)]
  const streetNumber = randomBetween(1, 200)
  const city = SPANISH_CITIES[Math.floor(Math.random() * SPANISH_CITIES.length)]
  const postcode =
    SPANISH_POSTCODES[Math.floor(Math.random() * SPANISH_POSTCODES.length)]
  const address = `${street} ${streetNumber}, ${postcode} ${city}`

  return {
    clientType: "company",
    name: company,
    taxId: cif,
    address,
  }
}

/**
 * Generate sample clients (mix of individuals and companies)
 */
export function generateClients(count: number): ClientFormData[] {
  const clients: ClientFormData[] = []

  for (let i = 0; i < count; i++) {
    if (Math.random() > 0.5) {
      clients.push(generateIndividualClient())
    } else {
      clients.push(generateCompanyClient())
    }
  }

  return clients
}

/**
 * Insert a client via the API
 */
export async function insertClient(
  baseUrl: string,
  client: ClientFormData
): Promise<void> {
  const response = await fetch(`${baseUrl}/api/clients`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(client),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to insert client: ${error.error}`)
  }

  return response.json()
}

/**
 * Load client data into the application via API
 */
export async function loadClients(
  count: number,
  baseUrl: string
): Promise<void> {
  // Generate data
  const clients = generateClients(count)

  console.log(`\nLoading ${clients.length} sample clients...`)
  console.log(`  - API URL: ${baseUrl}\n`)

  let insertedCount = 0
  const errors: { index: number; error: string }[] = []

  // Insert data sequentially
  for (let i = 0; i < clients.length; i++) {
    const client = clients[i]

    try {
      await insertClient(baseUrl, client)
      insertedCount++
      process.stdout.write(`\rInserting... ${insertedCount}/${clients.length}`)
    } catch (error) {
      errors.push({
        index: i,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  console.log(
    `\n✓ Successfully inserted ${insertedCount} clients out of ${clients.length}`
  )

  if (errors.length > 0) {
    console.log(`\n⚠ ${errors.length} clients failed to insert:`)
    errors.forEach(({ index, error }) => {
      console.log(`  - Client ${index}: ${error}`)
    })
  }

  // Display sample data
  if (clients.length >= 2) {
    console.log("\nSample data inserted:")
    console.log("\nFirst Client:")
    console.log(JSON.stringify(clients[0], null, 2))
    console.log("\nSecond Client:")
    console.log(JSON.stringify(clients[1], null, 2))
  }
}
