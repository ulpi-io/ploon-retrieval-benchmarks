/**
 * Threshold values and configurations for dynamic question generation
 * Following TOON's pattern for scalable question generation
 */

export const QUESTION_THRESHOLDS = {
  'support-tickets': {
    // Message count thresholds for aggregation
    messageCount: [1, 2, 3, 4, 5, 6, 7, 8],

    // Status + Priority combinations for filtering
    statusPriorityCombos: [
      { status: 'open', priority: 'low' },
      { status: 'open', priority: 'medium' },
      { status: 'open', priority: 'high' },
      { status: 'open', priority: 'urgent' },
      { status: 'in-progress', priority: 'low' },
      { status: 'in-progress', priority: 'medium' },
      { status: 'in-progress', priority: 'high' },
      { status: 'in-progress', priority: 'urgent' },
      { status: 'resolved', priority: 'low' },
      { status: 'resolved', priority: 'medium' },
      { status: 'resolved', priority: 'high' },
      { status: 'resolved', priority: 'urgent' },
    ],

    // Priority + Assignee status combinations
    priorityWithAssignee: ['low', 'medium', 'high', 'urgent'],

    // Message count for filtering
    messageThresholdsFiltering: [3, 5, 7],
  },

  'products': {
    // Price range thresholds
    priceRanges: [50, 100, 150, 200, 250, 300, 350, 400],

    // Rating thresholds
    ratingThresholds: [2.0, 2.5, 3.0, 3.5, 4.0, 4.5],

    // Color count thresholds
    colorCounts: [1, 2, 3, 4],

    // Review count thresholds
    reviewCounts: [50, 100, 200, 300],

    // Price + Rating combinations for filtering
    priceRatingCombos: [
      { price: 100, rating: 3.0 },
      { price: 200, rating: 3.5 },
      { price: 300, rating: 4.0 },
      { price: 150, rating: 2.5 },
      { price: 250, rating: 3.5 },
      { price: 100, rating: 4.0 },
      { price: 200, rating: 4.5 },
    ],

    // Rating + Color count combinations
    ratingColorCombos: [
      { rating: 3.0, colorCount: 2 },
      { rating: 3.5, colorCount: 3 },
      { rating: 4.0, colorCount: 2 },
    ],
  },

  'usage-metrics': {
    // Session count thresholds
    sessionCounts: [1, 3, 5, 7, 10, 15],

    // Engagement score thresholds
    engagementScores: [30, 40, 50, 60, 70, 80, 90],

    // API call thresholds
    apiCallCounts: [5, 10, 20, 50, 100, 200],

    // Error count thresholds
    errorCounts: [1, 3, 5, 10],

    // Active minutes thresholds
    activeMinutes: [30, 60, 120, 180],

    // Plan + Engagement combinations for filtering
    planEngagementCombos: [
      { plan: 'free', engagement: 50 },
      { plan: 'starter', engagement: 60 },
      { plan: 'pro', engagement: 70 },
      { plan: 'enterprise', engagement: 80 },
      { plan: 'free', engagement: 30 },
      { plan: 'starter', engagement: 50 },
    ],

    // Engagement + API calls combinations
    engagementApiCombos: [
      { engagement: 50, apiCalls: 10 },
      { engagement: 60, apiCalls: 20 },
      { engagement: 70, apiCalls: 50 },
      { engagement: 80, apiCalls: 100 },
    ],
  },

  'sales-deals': {
    // Amount thresholds
    amountRanges: [50000, 100000, 150000, 200000, 250000, 300000, 400000, 500000],

    // Probability thresholds
    probabilityRanges: [20, 40, 50, 60, 70, 80, 90],

    // Stage + Amount combinations for filtering
    stageAmountCombos: [
      { stage: 'lead', amount: 50000 },
      { stage: 'qualified', amount: 100000 },
      { stage: 'proposal', amount: 150000 },
      { stage: 'negotiation', amount: 200000 },
      { stage: 'lead', amount: 100000 },
      { stage: 'qualified', amount: 200000 },
      { stage: 'proposal', amount: 250000 },
    ],

    // Amount + Probability combinations
    amountProbabilityCombos: [
      { amount: 100000, probability: 50 },
      { amount: 150000, probability: 60 },
      { amount: 200000, probability: 70 },
      { amount: 250000, probability: 80 },
      { amount: 100000, probability: 70 },
    ],
  },

  'error-logs': {
    // Status code groups
    statusCodes: [400, 404, 500, 502, 503],

    // Method + Status combinations
    methodStatusCombos: [
      { method: 'GET', statusCode: 404 },
      { method: 'POST', statusCode: 500 },
      { method: 'PUT', statusCode: 400 },
      { method: 'DELETE', statusCode: 403 },
      { method: 'GET', statusCode: 500 },
      { method: 'POST', statusCode: 400 },
      { method: 'PATCH', statusCode: 500 },
    ],

    // Level + Resolved combinations
    levelResolvedCombos: [
      { level: 'error', resolved: false },
      { level: 'critical', resolved: false },
      { level: 'error', resolved: true },
      { level: 'critical', resolved: true },
    ],

    // Method + Level combinations
    methodLevelCombos: [
      { method: 'GET', level: 'error' },
      { method: 'POST', level: 'critical' },
      { method: 'PUT', level: 'error' },
    ],
  },
} as const
