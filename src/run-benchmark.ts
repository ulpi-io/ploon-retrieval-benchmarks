/**
 * Run retrieval accuracy benchmark with OpenRouter
 * Usage: npm run benchmark
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import OpenAI from 'openai'
import { CONFIG, validateConfig } from './config'
import { getFileExtension } from './formatters'
import type { Question, EvaluationResult, DatasetName, FormatName } from './types'

const DATA_DIR = path.join(process.cwd(), 'data')
const RESULTS_DIR = path.join(process.cwd(), 'results')

/**
 * OpenRouter client
 */
const openrouter = new OpenAI({
  apiKey: CONFIG.openrouter.apiKey,
  baseURL: CONFIG.openrouter.baseURL,
})

/**
 * Load formatted data for a dataset
 */
function loadFormattedData(datasetName: DatasetName, format: FormatName): string {
  const extension = getFileExtension(format)
  let fileName = `data.${extension}`
  if (format === 'ploon-minified') {
    fileName = 'data-minified.ploon'
  }

  const filePath = path.join(DATA_DIR, datasetName, fileName)
  return fs.readFileSync(filePath, 'utf-8')
}

/**
 * Load questions for a dataset
 */
function loadQuestions(datasetName: DatasetName): Question[] {
  const filePath = path.join(DATA_DIR, datasetName, 'questions.json')
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

/**
 * Evaluate a single question with a model
 */
async function evaluateQuestion(
  question: Question,
  format: FormatName,
  formattedData: string,
  model: string
): Promise<EvaluationResult> {
  console.log(`  🔵 [${question.id}] Sending to ${model} (${format})...`)

  const prompt = `Given the following data in ${format} format:

\`\`\`
${formattedData}
\`\`\`

Question: ${question.prompt}

IMPORTANT: Provide ONLY the direct answer as a single value (number, string, etc.). Do NOT include any explanations, reasoning, markdown formatting, or additional text. Just the answer.`

  const startTime = performance.now()

  const response = await openrouter.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
  })

  const responseTimeMs = performance.now() - startTime
  const actual = response.choices[0]?.message?.content?.trim() || ''
  const inputTokens = response.usage?.prompt_tokens || 0
  const outputTokens = response.usage?.completion_tokens || 0

  console.log(`  ✅ [${question.id}] Response received (${responseTimeMs.toFixed(0)}ms, ${inputTokens} in / ${outputTokens} out)`)

  // Validate answer with LLM-as-judge
  console.log(`  🔍 [${question.id}] Validating answer with judge...`)
  const judgeStartTime = performance.now()
  const { isCorrect, judgeAnswer } = await validateAnswer(actual, question.groundTruth, question.prompt)
  const judgeLatencyMs = performance.now() - judgeStartTime
  console.log(`  ${isCorrect ? '✅' : '❌'} [${question.id}] ${isCorrect ? 'Correct' : 'Incorrect'}: expected="${question.groundTruth}", actual="${actual}" (judge: ${judgeAnswer}, ${judgeLatencyMs.toFixed(0)}ms)`)

  return {
    questionId: question.id,
    format,
    model,
    judgeModel: CONFIG.judgeModel,
    expected: question.groundTruth,
    actual,
    isCorrect,
    judgeAnswer,
    inputTokens,
    outputTokens,
    responseTimeMs,
    judgeLatencyMs,
  }
}

/**
 * Validate an answer using LLM-as-judge
 */
async function validateAnswer(
  actual: string,
  expected: string,
  questionPrompt: string
): Promise<{ isCorrect: boolean; judgeAnswer: string }> {
  const prompt = `You are validating answers to questions about structured data.

Question: ${questionPrompt}
Expected answer: ${expected}
Actual answer: ${actual}

Is the actual answer correct? Consider:
- Exact matches are correct
- Semantically equivalent answers are correct (e.g., "50000" vs "$50,000" vs "50000 dollars")
- Minor formatting differences are acceptable
- Case-insensitive comparison for text

Respond with only "YES" or "NO".`

  try {
    const response = await openrouter.chat.completions.create({
      model: CONFIG.judgeModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
    })

    const judgeAnswer = response.choices[0]?.message?.content?.trim() || ''
    const isCorrect = judgeAnswer.toUpperCase() === 'YES'
    return { isCorrect, judgeAnswer }
  } catch (error) {
    console.error(`Judge validation error: ${error}`)
    // Fallback to simple string comparison
    const isCorrect = actual.toLowerCase().trim() === expected.toLowerCase().trim()
    return { isCorrect, judgeAnswer: isCorrect ? 'YES (fallback)' : 'NO (fallback)' }
  }
}

/**
 * Run benchmark for a single dataset and model
 */
async function runDatasetBenchmark(datasetName: DatasetName, model: string) {
  console.log(`\n📊 Running benchmark: ${datasetName} with ${model}`)

  // Load questions
  const questions = loadQuestions(datasetName)
  console.log(`  Loaded ${questions.length} questions`)

  // Create results for this dataset
  const results: EvaluationResult[] = []
  let completed = 0

  for (const question of questions) {
    for (const format of CONFIG.formats) {
      // Load formatted data
      const formattedData = loadFormattedData(datasetName, format)

      // Evaluate
      try {
        const result = await evaluateQuestion(question, format, formattedData, model)
        results.push(result)

        completed++
        const percent = ((completed / (questions.length * CONFIG.formats.length)) * 100).toFixed(1)
        console.log(`  📊 Progress: ${completed}/${questions.length * CONFIG.formats.length} (${percent}%)`)
      } catch (error) {
        console.error(`  ❌ Error evaluating ${question.id} with ${format}: ${error}`)
      }

      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  // Save results
  const datasetResultsDir = path.join(RESULTS_DIR, datasetName)
  if (!fs.existsSync(datasetResultsDir)) {
    fs.mkdirSync(datasetResultsDir, { recursive: true })
  }

  const modelFileName = model.replace(/\//g, '-')
  const resultsPath = path.join(datasetResultsDir, `${modelFileName}.json`)
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf-8')

  console.log(`  ✓ Saved results to ${resultsPath}`)

  // Calculate accuracy
  const accuracy = results.filter(r => r.isCorrect).length / results.length
  console.log(`  Accuracy: ${(accuracy * 100).toFixed(2)}%`)
}

/**
 * Parse command-line arguments
 */
function parseArgs(): { model?: string; dataset?: DatasetName } {
  const args = process.argv.slice(2)
  const result: { model?: string; dataset?: DatasetName } = {}

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--model' && args[i + 1]) {
      result.model = args[i + 1]
      i++
    } else if (args[i] === '--dataset' && args[i + 1]) {
      result.dataset = args[i + 1] as DatasetName
      i++
    }
  }

  return result
}

/**
 * Main
 */
async function main() {
  const { model: targetModel, dataset: targetDataset } = parseArgs()

  // Filter models and datasets based on arguments
  const modelsToRun = targetModel
    ? CONFIG.evaluationModels.filter(m => m === targetModel)
    : CONFIG.evaluationModels

  const datasetsToRun = targetDataset
    ? CONFIG.datasets.filter(d => d === targetDataset)
    : CONFIG.datasets

  // Validate filters
  if (targetModel && modelsToRun.length === 0) {
    console.error(`\n❌ Model "${targetModel}" not found in config.`)
    console.error(`   Available models: ${CONFIG.evaluationModels.join(', ')}`)
    process.exit(1)
  }

  if (targetDataset && datasetsToRun.length === 0) {
    console.error(`\n❌ Dataset "${targetDataset}" not found in config.`)
    console.error(`   Available datasets: ${CONFIG.datasets.join(', ')}`)
    process.exit(1)
  }

  console.log('🚀 PLOON Retrieval Benchmarks - Evaluation')
  console.log(`   Models: ${modelsToRun.join(', ')}`)
  console.log(`   Judge model: ${CONFIG.judgeModel}`)
  console.log(`   Datasets: ${datasetsToRun.join(', ')}`)
  console.log(`   Formats: ${CONFIG.formats.join(', ')}`)

  // Validate config
  try {
    validateConfig()
  } catch (error) {
    console.error(`\n❌ Configuration error: ${error}`)
    process.exit(1)
  }

  // Create results directory
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true })
  }

  // Run benchmarks for each dataset and model
  for (const dataset of datasetsToRun) {
    for (const model of modelsToRun) {
      await runDatasetBenchmark(dataset, model)
    }
  }

  console.log('\n✅ Benchmark complete!')
  console.log(`   Results saved to: ${RESULTS_DIR}`)
}

main().catch(error => {
  console.error(`\n❌ Benchmark failed: ${error}`)
  process.exit(1)
})
