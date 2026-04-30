import { PaymentConcept, PaymentFormData } from "../../lib/types";

export const INCOME_NAMES = [
  "Client Invoice",
  "Consulting Fee",
  "Software License",
  "Support Service",
  "Training Session",
  "Development Work",
  "Project Delivery",
  "Maintenance Fee",
];

export const OUTCOME_NAMES = [
  "Office Supplies",
  "Software License",
  "Cloud Services",
  "Employee Salary",
  "Office Rent",
  "Equipment",
  "Utilities",
  "Marketing",
  "Professional Services",
  "Travel Expenses",
];

export const CONCEPT_NAMES = [
  "Labor",
  "Materials",
  "Services",
  "Hardware",
  "Software",
  "Consulting",
  "Design",
  "Development",
  "Testing",
  "Deployment",
];

/**
 * Generate a random number between min and max (inclusive)
 */
export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random amount between 100 and 5000
 */
export function randomAmount(): number {
  return Math.round((Math.random() * 4900 + 100) * 100) / 100;
}

/**
 * Generate random quantity (1-3)
 */
export function randomQuantity(): number {
  return randomBetween(1, 3);
}

/**
 * Generate a random concept
 */
export function generateConcept(): PaymentConcept {
  return {
    name: CONCEPT_NAMES[Math.floor(Math.random() * CONCEPT_NAMES.length)],
    amount: randomAmount(),
    quantity: randomQuantity(),
  };
}

/**
 * Generate concepts (1-5)
 */
export function generateConcepts(): PaymentConcept[] {
  const numConcepts = randomBetween(1, 5);
  return Array.from({ length: numConcepts }, () => generateConcept());
}

/**
 * Calculate VAT and totals from concepts (amount × quantity)
 */
export function calculateTotals(concepts: PaymentConcept[], defaultVAT: number) {
  const totalAmount = concepts.reduce((sum, c) => sum + (c.amount * c.quantity), 0);
  const netAmount = totalAmount / (1 + defaultVAT / 100);
  const vatAmount = totalAmount - netAmount;

  return {
    total: Math.round(totalAmount * 100) / 100,
    netAmount: Math.round(netAmount * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
  };
}

/**
 * Generate a random date within the specified month
 */
export function generateDateInMonth(year: number, month: number): string {
  const day = randomBetween(1, 28);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
}

/**
 * Generate income payments
 */
export function generateIncomes(year: number, month: number) {
  const count = randomBetween(5, 10);
  return Array.from({ length: count }, () => {
    const concepts = generateConcepts();
    const vatOptions = [0, 10, 21];
    const defaultVAT = vatOptions[Math.floor(Math.random() * vatOptions.length)];
    const { total, netAmount, vatAmount } = calculateTotals(
      concepts,
      defaultVAT
    );

    return {
      type: "income" as const,
      date: generateDateInMonth(year, month),
      tag: Math.random() > 0.5
        ? INCOME_NAMES[Math.floor(Math.random() * INCOME_NAMES.length)]
        : undefined,
      concepts,
      vat: defaultVAT,
      total,
      netAmount,
      vatAmount,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });
}

/**
 * Generate outcome payments
 */
export function generateOutcomes(year: number, month: number) {
  const count = randomBetween(5, 10);
  return Array.from({ length: count }, () => {
    const concepts = generateConcepts();
    const vatOptions = [0, 10, 21];
    const defaultVAT = vatOptions[Math.floor(Math.random() * vatOptions.length)];
    const { total, netAmount, vatAmount } = calculateTotals(
      concepts,
      defaultVAT
    );

    return {
      type: "outcome" as const,
      date: generateDateInMonth(year, month),
      tag: Math.random() > 0.5
        ? OUTCOME_NAMES[Math.floor(Math.random() * OUTCOME_NAMES.length)]
        : undefined,
      concepts,
      vat: defaultVAT,
      total,
      netAmount,
      vatAmount,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });
}

/**
 * Insert a payment via the API
 */
export async function insertPayment(
  baseUrl: string,
  payment: PaymentFormData
): Promise<void> {
  const response = await fetch(`${baseUrl}/api/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payment),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to insert payment: ${error.error}`);
  }

  const result = await response.json();
  return result;
}

/**
 * Load data into the application via API
 */
export async function loadData(
  year: number,
  month: number,
  baseUrl: string
): Promise<void> {
  // Generate data
  const incomes = generateIncomes(year, month);
  const outcomes = generateOutcomes(year, month);
  const allPayments = [...incomes, ...outcomes];

  console.log(`Loading ${allPayments.length} payments for ${year}-${String(month).padStart(2, "0")}...`);
  console.log(`  - ${incomes.length} incomes`);
  console.log(`  - ${outcomes.length} outcomes`);
  console.log(`  - API URL: ${baseUrl}\n`);

  let insertedCount = 0;
  const errors: { index: number; error: string }[] = [];

  // Insert data sequentially
  for (let i = 0; i < allPayments.length; i++) {
    const payment = allPayments[i];
    const paymentData: PaymentFormData = {
      type: payment.type,
      date: payment.date,
      concepts: payment.concepts,
      vat: String(payment.vat),
      tag: payment.tag,
    };

    try {
      await insertPayment(baseUrl, paymentData);
      insertedCount++;
      process.stdout.write(`\rInserting... ${insertedCount}/${allPayments.length}`);
    } catch (error) {
      errors.push({
        index: i,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log(
    `\n✓ Successfully inserted ${insertedCount} payments out of ${allPayments.length}`
  );

  if (errors.length > 0) {
    console.log(`\n⚠ ${errors.length} payments failed to insert:`);
    errors.forEach(({ index, error }) => {
      console.log(`  - Payment ${index}: ${error}`);
    });
  }

  // Display sample data
  if (incomes.length > 0 && outcomes.length > 0) {
    console.log("\nSample data inserted:");
    console.log("\nFirst Income:");
    console.log(JSON.stringify(incomes[0], null, 2));
    console.log("\nFirst Outcome:");
    console.log(JSON.stringify(outcomes[0], null, 2));
  }
}
