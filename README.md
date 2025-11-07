# PLOON Retrieval Benchmarks

Comprehensive retrieval accuracy benchmarks comparing PLOON, TOON, JSON, YAML, CSV, and XML formats across multiple LLM models using OpenRouter.

## Overview

This benchmark suite evaluates how well LLMs can retrieve information from structured data in different formats. It uses **LLM-as-judge** for semantic answer validation and measures both accuracy and performance.

**Test Coverage:**
- **5 realistic datasets**: Support tickets, products, usage metrics, sales deals, error logs
- **7 data formats**: JSON, YAML, CSV, XML, TOON, PLOON, PLOON-Minified
- **3 question types**: Field retrieval (40%), aggregation (30%), filtering (30%)
- **100 records** per dataset with **100 questions** per dataset
- **Multiple models**: GPT-5, Claude Sonnet 4.5, Gemini 2.5 Flash, Grok 4 Fast

**What it measures:**
- **Accuracy**: Percentage of correct answers (validated by LLM-as-judge)
- **Token efficiency**: Input/output tokens per query
- **Response time**: Model response latency (excluding judge validation)

## Quick Links

### Datasets & Questions

| Dataset | Questions | Data (JSON) | All Formats |
|---------|-----------|-------------|-------------|
| **Support Tickets** | [questions.json](./data/support-tickets/questions.json) | [data.json](./data/support-tickets/data.json) | [📁 All formats](./data/support-tickets/) |
| **Products** | [questions.json](./data/products/questions.json) | [data.json](./data/products/data.json) | [📁 All formats](./data/products/) |
| **Usage Metrics** | [questions.json](./data/usage-metrics/questions.json) | [data.json](./data/usage-metrics/data.json) | [📁 All formats](./data/usage-metrics/) |
| **Sales Deals** | [questions.json](./data/sales-deals/questions.json) | [data.json](./data/sales-deals/data.json) | [📁 All formats](./data/sales-deals/) |
| **Error Logs** | [questions.json](./data/error-logs/questions.json) | [data.json](./data/error-logs/data.json) | [📁 All formats](./data/error-logs/) |

### Configuration Files

| File | Description |
|------|-------------|
| [config.ts](./src/config.ts) | Main configuration (models, datasets, formats) |
| [question-constants.ts](./src/question-constants.ts) | Threshold arrays for dynamic question generation |

## Setup

1. Install dependencies:
```bash
npm install
# or
pnpm install
```

2. Create `.env` file with your OpenRouter API key:
```bash
echo "OPENROUTER_API_KEY=your-api-key-here" > .env
```

Get your API key from [OpenRouter](https://openrouter.ai/)

3. Configure benchmarks in `src/config.ts` (optional):
```typescript
export const CONFIG = {
  dataSize: {
    recordCount: 100,    // Records per dataset
    questionCount: 100   // Questions per dataset
  },
  evaluationModels: [
    'openai/gpt-5-chat',
    'anthropic/claude-sonnet-4.5',
    'google/gemini-2.5-flash',
    'x-ai/grok-4-fast',
  ],
  judgeModel: 'openai/gpt-4o-mini', // Fast, cheap model for validation
  formats: [
    'json', 'yaml', 'csv', 'xml', 'toon', 'ploon', 'ploon-minified'
  ]
}
```

## Usage

### 1. Generate Data

Generate datasets and convert to all 7 formats:

```bash
npm run generate-data
```

This creates `data/{dataset}/data.{format}` files for all datasets and formats.

**Output example:**
```
data/support-tickets/
  ├── data.json (77KB)
  ├── data.yaml (63KB)
  ├── data.csv (53KB)
  ├── data.xml (84KB)
  ├── data.toon (63KB)
  ├── data.ploon (45KB)
  └── data-minified.ploon (45KB)
```

### 2. Generate Questions

Generate questions dynamically from the data:

```bash
npm run generate-questions
```

This creates `data/{dataset}/questions.json` for each dataset using dynamic threshold-based generation.

### 3. Run Benchmark

Run the full evaluation (all models, all datasets, all formats):

```bash
npm run benchmark
```

**Run specific model only:**
```bash
npm run benchmark -- --model "openai/gpt-5-chat"
```

**Run specific dataset only:**
```bash
npm run benchmark -- --dataset support-tickets
```

**Run specific model AND dataset:**
```bash
npm run benchmark -- --model "anthropic/claude-sonnet-4.5" --dataset products
```

Results are saved to `results/{dataset}/{model}.json`.

## Directory Structure

```
benchmarks/retrieval/
├── data/
│   ├── support-tickets/
│   │   ├── data.json, data.yaml, data.csv, data.xml
│   │   ├── data.toon, data.ploon, data-minified.ploon
│   │   ├── questions.json
│   │   └── metadata.json
│   ├── products/
│   ├── usage-metrics/
│   ├── sales-deals/
│   └── error-logs/
├── results/
│   ├── support-tickets/
│   │   ├── anthropic-claude-sonnet-4.5.json
│   │   ├── openai-gpt-4o.json
│   │   └── google-gemini-2.0-flash-exp.json
│   └── ...
└── src/
    ├── config.ts                - Configuration
    ├── types.ts                 - TypeScript types
    ├── formatters.ts            - Format converters
    ├── question-constants.ts    - Threshold arrays for dynamic generation
    ├── datasets/                - Data generators
    │   ├── support-tickets.ts
    │   ├── products.ts
    │   ├── usage-metrics.ts
    │   ├── sales-deals.ts
    │   └── error-logs.ts
    ├── generate-data.ts         - Step 1: Generate datasets
    ├── generate-questions.ts    - Step 2: Generate questions
    └── run-benchmark.ts         - Step 3: Run evaluation
```

## Configuration

All settings are configurable in `src/config.ts`:

- **dataSize.recordCount**: Number of records per dataset (default: 100)
- **dataSize.questionCount**: Number of questions per dataset (default: 100)
- **evaluationModels**: Models to test (OpenRouter IDs)
- **judgeModel**: Model for LLM-as-judge validation
- **datasets**: Which datasets to generate/benchmark
- **formats**: Which formats to test
- **concurrency**: Parallel requests (default: 5)
- **rpmLimit**: Requests per minute (default: 100)

## Datasets

Each dataset includes 100 records generated with faker.js seed 12345 for reproducibility.

### 1. Support Tickets
Customer support tickets with status, priority, customer info, messages, and tags.

**Files:**
- Generator: [`src/datasets/support-tickets.ts`](./src/datasets/support-tickets.ts)
- Data: [`data/support-tickets/`](./data/support-tickets/)
  - [`data.json`](./data/support-tickets/data.json) | [`data.yaml`](./data/support-tickets/data.yaml) | [`data.csv`](./data/support-tickets/data.csv) | [`data.xml`](./data/support-tickets/data.xml)
  - [`data.toon`](./data/support-tickets/data.toon) | [`data.ploon`](./data/support-tickets/data.ploon) | [`data-minified.ploon`](./data/support-tickets/data-minified.ploon)
- Questions: [`data/support-tickets/questions.json`](./data/support-tickets/questions.json)

### 2. Products
E-commerce product catalog with SKU, pricing, inventory, ratings, and dimensions.

**Files:**
- Generator: [`src/datasets/products.ts`](./src/datasets/products.ts)
- Data: [`data/products/`](./data/products/)
  - [`data.json`](./data/products/data.json) | [`data.yaml`](./data/products/data.yaml) | [`data.csv`](./data/products/data.csv) | [`data.xml`](./data/products/data.xml)
  - [`data.toon`](./data/products/data.toon) | [`data.ploon`](./data/products/data.ploon) | [`data-minified.ploon`](./data/products/data-minified.ploon)
- Questions: [`data/products/questions.json`](./data/products/questions.json)

### 3. Usage Metrics
SaaS user activity data with sessions, features used, API calls, and engagement scores.

**Files:**
- Generator: [`src/datasets/usage-metrics.ts`](./src/datasets/usage-metrics.ts)
- Data: [`data/usage-metrics/`](./data/usage-metrics/)
  - [`data.json`](./data/usage-metrics/data.json) | [`data.yaml`](./data/usage-metrics/data.yaml) | [`data.csv`](./data/usage-metrics/data.csv) | [`data.xml`](./data/usage-metrics/data.xml)
  - [`data.toon`](./data/usage-metrics/data.toon) | [`data.ploon`](./data/usage-metrics/data.ploon) | [`data-minified.ploon`](./data/usage-metrics/data-minified.ploon)
- Questions: [`data/usage-metrics/questions.json`](./data/usage-metrics/questions.json)

### 4. Sales Deals
CRM pipeline with deal amounts, stages, contacts, and activities.

**Files:**
- Generator: [`src/datasets/sales-deals.ts`](./src/datasets/sales-deals.ts)
- Data: [`data/sales-deals/`](./data/sales-deals/)
  - [`data.json`](./data/sales-deals/data.json) | [`data.yaml`](./data/sales-deals/data.yaml) | [`data.csv`](./data/sales-deals/data.csv) | [`data.xml`](./data/sales-deals/data.xml)
  - [`data.toon`](./data/sales-deals/data.toon) | [`data.ploon`](./data/sales-deals/data.ploon) | [`data-minified.ploon`](./data/sales-deals/data-minified.ploon)
- Questions: [`data/sales-deals/questions.json`](./data/sales-deals/questions.json)

### 5. Error Logs
Application error logs with stack traces, endpoints, user context, and resolution status.

**Files:**
- Generator: [`src/datasets/error-logs.ts`](./src/datasets/error-logs.ts)
- Data: [`data/error-logs/`](./data/error-logs/)
  - [`data.json`](./data/error-logs/data.json) | [`data.yaml`](./data/error-logs/data.yaml) | [`data.csv`](./data/error-logs/data.csv) | [`data.xml`](./data/error-logs/data.xml)
  - [`data.toon`](./data/error-logs/data.toon) | [`data.ploon`](./data/error-logs/data.ploon) | [`data-minified.ploon`](./data/error-logs/data-minified.ploon)
- Questions: [`data/error-logs/questions.json`](./data/error-logs/questions.json)

## Question Types

Questions are dynamically generated using threshold arrays and combinations (inspired by TOON's approach).

### Field Retrieval (~40% of questions)
Direct field access from specific records.

**Examples:**
- "What is the status of ticket T0001?"
- "What is the base price of product P0050?"
- "What endpoint caused error E000012?"

### Aggregation (~30% of questions)
Counts, totals, and statistical queries using threshold-based generation.

**Examples:**
- "How many support tickets are in the dataset?"
- "How many products have a rating above 4.0?"
- "How many errors have status code 500?"

### Filtering (~30% of questions)
Multi-condition queries using predefined combinations.

**Examples:**
- "How many tickets have status 'open' AND priority 'urgent'?"
- "How many products are priced above $200 AND have rating above 3.5?"
- "How many errors are from POST requests AND have status code 500?"

## Output Format

Each result file (`results/{dataset}/{model}.json`) contains an array of evaluation results:

```json
[
  {
    "questionId": "q1",
    "format": "ploon",
    "model": "anthropic/claude-sonnet-4.5",
    "judgeModel": "openai/gpt-4o-mini",
    "expected": "open",
    "actual": "open",
    "isCorrect": true,
    "judgeAnswer": "YES",
    "inputTokens": 1250,
    "outputTokens": 5,
    "responseTimeMs": 342,
    "judgeLatencyMs": 156
  }
]
```

**Fields:**
- `questionId`: Question identifier (q1, q2, etc.)
- `format`: Data format tested (json, yaml, ploon, etc.)
- `model`: Evaluation model used
- `judgeModel`: LLM-as-judge model used for validation
- `expected`: Ground truth answer
- `actual`: Model's answer
- `isCorrect`: Whether answer is correct (determined by judge)
- `judgeAnswer`: Judge's verdict (YES/NO)
- `inputTokens`: Prompt tokens consumed
- `outputTokens`: Completion tokens generated
- `responseTimeMs`: Model response time (milliseconds)
- `judgeLatencyMs`: Judge validation time (milliseconds)

## How It Works

### 1. Data Generation
Uses [@faker-js/faker](https://fakerjs.dev/) with a fixed seed (12345) to generate reproducible datasets. Each dataset is then converted to all 7 formats.

### 2. Question Generation
Questions are dynamically generated using threshold arrays and combination patterns (inspired by TOON benchmarks):

- **Aggregation**: Uses threshold arrays (e.g., price ranges: [50, 100, 150, ...]) to generate multiple similar questions
- **Filtering**: Uses predefined combinations (e.g., status + priority, method + status code) for multi-condition queries
- **Field Retrieval**: Cycles through different field types for variety

See `src/question-constants.ts` for all threshold configurations.

### 3. LLM-as-Judge Validation
Each answer is validated using an LLM judge (GPT-4o-mini by default):

1. **Model responds** to the question with the data in a specific format
2. **Judge validates** if the answer is semantically correct
   - Exact matches are correct
   - Semantic equivalence is correct (e.g., "50000" vs "$50,000")
   - Minor formatting differences are acceptable
3. **Results stored** with both model answer and judge verdict

**Why LLM-as-judge?**
- Handles semantic equivalence (e.g., different date formats, number formatting)
- More robust than exact string matching
- Allows for reasonable variations in correct answers

### 4. Performance Metrics
- **Response time**: Measured for model response only (excludes judge)
- **Token usage**: Both input and output tokens tracked
- **Accuracy**: Percentage of correct answers per format/model combination

## Development & Testing

### Test with small dataset first

Before running the full 100/100 benchmark, test with smaller datasets:

```typescript
// In src/config.ts
dataSize: {
  recordCount: 10,    // Start with 10 records
  questionCount: 10   // Start with 10 questions
}
```

**Recommended progression:**
1. Test with 10/10 first
2. Validate with 50/50
3. Run full 100/100

### Quick test workflow
```bash
# Generate small dataset
npm run generate-data

# Generate questions
npm run generate-questions

# Test one model + one dataset
npm run benchmark -- --model "openai/gpt-5-chat" --dataset support-tickets
```

### Estimated costs and runtime

**For 100 records, 100 questions, 7 formats, 4 models:**
- **Total API calls**: 2,800 queries + 2,800 judge validations = 5,600 calls
- **Estimated cost**: $15-30 depending on models
- **Estimated runtime**: 60-90 minutes with rate limiting

**For 10 records, 10 questions (testing):**
- **Total API calls**: 280 queries + 280 judge validations = 560 calls
- **Estimated cost**: $1.50-3.00
- **Estimated runtime**: 6-10 minutes

## Troubleshooting

**API key not found:**
```bash
# Make sure .env file exists
cat .env
# Should show: OPENROUTER_API_KEY=sk-or-v1-...
```

**Rate limiting errors:**
Adjust in `src/config.ts`:
```typescript
rpmLimit: 100,  // Reduce if hitting rate limits
```

**Out of memory:**
Process datasets one at a time:
```bash
npm run benchmark -- --dataset support-tickets
npm run benchmark -- --dataset products
# etc.
```

## Contributing

Contributions welcome! Areas to improve:
- Additional datasets (logs, metrics, transactions)
- More question types (sorting, joins, nested queries)
- Additional formats (Parquet, Protobuf, MessagePack)
- Analysis scripts for comparing format performance

## License

MIT
