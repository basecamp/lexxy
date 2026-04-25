import { chromium } from "@playwright/test"
import { execFileSync } from "node:child_process"
import { mkdir, writeFile } from "node:fs/promises"
import net from "node:net"
import path from "node:path"
import process from "node:process"
import { createServer } from "vite"

const DEFAULT_OUTPUT_PATH = path.resolve("tmp/browser-benchmarks.json")
const DEFAULT_ITERATIONS = numberFromEnv("BENCHMARK_ITERATIONS", 3)
const DEFAULT_WARMUP_ITERATIONS = numberFromEnv("BENCHMARK_WARMUP_ITERATIONS", 1)
const DEFAULT_TIME_BUDGET_MS = numberFromEnv("BENCHMARK_TIME_BUDGET_MS", 5_000)
const BENCHMARK_PAGE_PATH = "/benchmarks.html"
const VIEWPORT = { width: 1440, height: 1200 }
const SCENARIOS = [
  {
    description: "Create a single empty editor with the default toolbar",
    kind: "bootstrap",
    name: "bootstrap-empty-editor",
    options: { editorCount: 1 },
    title: "Bootstrap one empty editor",
  },
  {
    description: "Create many editors in one pass to expose aggregate startup cost",
    kind: "bootstrap",
    name: "bootstrap-many-editors",
    options: { editorCount: 20 },
    title: "Bootstrap twenty editors",
  },
  {
    description: "Load a large mixed-content HTML document",
    kind: "load",
    name: "load-large-content",
    payload: {
      kind: "large-content",
      listItemsPerSection: 6,
      paragraphsPerSection: 4,
      sections: 24,
      wordsPerParagraph: 40,
    },
    title: "Load large content",
  },
  {
    description: "Load a very large table",
    kind: "load",
    name: "load-very-large-table",
    payload: {
      columns: 18,
      kind: "table",
      rows: 120,
    },
    title: "Load very large table",
  },
  {
    description: "Load many static image attachments without any Rails upload path",
    kind: "load",
    name: "load-many-attachments",
    payload: {
      count: 60,
      kind: "attachments",
    },
    title: "Load many attachments",
  },
]

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error)
  process.exitCode = 1
})

async function main() {
  const options = parseArgs(process.argv.slice(2))

  if (options.listScenarios) {
    printScenarioList()
    return
  }

  const port = options.port || await findAvailablePort()
  const baseUrl = `http://127.0.0.1:${port}`
  const viteServer = await startViteServer(port)

  try {
    const browser = await chromium.launch({
      args: [
        "--disable-background-timer-throttling",
        "--disable-renderer-backgrounding",
        "--disable-backgrounding-occluded-windows",
      ],
      headless: !options.headed,
    })

    try {
      const context = await browser.newContext({
        colorScheme: "light",
        deviceScaleFactor: 1,
        viewport: VIEWPORT,
      })

      try {
        const environment = await collectEnvironment({ baseUrl, browser, context, options, port })
        const scenarioResults = []

        for (const scenario of options.scenarios) {
          scenarioResults.push(await runScenario({ baseUrl, context, options, scenario }))
        }

        const output = {
          environment,
          formatVersion: 1,
          generatedAt: new Date().toISOString(),
          scenarios: scenarioResults,
        }

        await mkdir(path.dirname(options.outputPath), { recursive: true })
        await writeFile(options.outputPath, `${JSON.stringify(output, null, 2)}\n`)

        printScenarioSummary(output, options.outputPath)
      } finally {
        await context.close()
      }
    } finally {
      await browser.close()
    }
  } finally {
    await stopViteServer(viteServer)
  }
}

async function runScenario({ baseUrl, context, options, scenario }) {
  console.log(`Running ${scenario.name} (${options.warmupIterations} warmup, ${options.iterations} measured)`)

  for (let iteration = 0; iteration < options.warmupIterations; iteration += 1) {
    await runScenarioSample({ baseUrl, context, options, scenario })
  }

  const samples = []
  let details = null

  for (let iteration = 0; iteration < options.iterations; iteration += 1) {
    const sample = await runScenarioSample({ baseUrl, context, options, scenario })
    samples.push(roundNumber(sample.details.perOpDurationMs))
    details ||= sample.details
  }

  return {
    description: scenario.description,
    details,
    name: scenario.name,
    samples,
    stats: summarizeSamples(samples),
    title: scenario.title,
    unit: "ms",
  }
}

async function runScenarioSample({ baseUrl, context, options, scenario }) {
  const page = await openBenchmarkPage(context, baseUrl)
  const scenarioWithBudget = {
    ...scenario,
    options: {
      ...scenario.options,
      timeBudgetMs: scenario.options?.timeBudgetMs ?? options.timeBudgetMs,
    },
  }

  try {
    return await page.evaluate(async (scenarioDefinition) => {
      return await window.lexxyBenchmarks.measureScenario(scenarioDefinition)
    }, scenarioWithBudget)
  } finally {
    await page.close()
  }
}

async function collectEnvironment({ baseUrl, browser, context, options, port }) {
  const page = await openBenchmarkPage(context, baseUrl)

  try {
    const browserMetadata = await page.evaluate(() => window.lexxyBenchmarks.browserMetadata())

    return {
      benchmarkPage: BENCHMARK_PAGE_PATH,
      browser: {
        name: "chromium",
        version: browser.version(),
      },
      ci: {
        githubActions: !!process.env.GITHUB_ACTIONS,
        githubRef: process.env.GITHUB_REF || null,
        githubRunId: process.env.GITHUB_RUN_ID || null,
      },
      git: {
        branch: safeGitCommand([ "branch", "--show-current" ]),
        commitSha: safeGitCommand([ "rev-parse", "HEAD" ]),
      },
      machine: browserMetadata,
      node: process.version,
      port,
      warmupIterations: options.warmupIterations,
      iterations: options.iterations,
      timeBudgetMs: options.timeBudgetMs,
    }
  } finally {
    await page.close()
  }
}

async function openBenchmarkPage(context, baseUrl) {
  const page = await context.newPage()
  await page.goto(`${baseUrl}${BENCHMARK_PAGE_PATH}`)
  await page.evaluate(async () => {
    await window.lexxyBenchmarks.prepare()
  })
  return page
}

function summarizeSamples(samples) {
  const sortedSamples = [ ...samples ].sort((left, right) => left - right)
  const count = sortedSamples.length
  const sum = sortedSamples.reduce((total, sample) => total + sample, 0)

  return {
    count,
    max: roundNumber(sortedSamples.at(-1)),
    mean: roundNumber(sum / count),
    median: roundNumber(percentile(sortedSamples, 0.5)),
    min: roundNumber(sortedSamples[0]),
    p90: roundNumber(percentile(sortedSamples, 0.9)),
    p95: roundNumber(percentile(sortedSamples, 0.95)),
  }
}

function percentile(sortedSamples, percentileValue) {
  const position = (sortedSamples.length - 1) * percentileValue
  const lowerIndex = Math.floor(position)
  const upperIndex = Math.ceil(position)

  if (lowerIndex === upperIndex) {
    return sortedSamples[lowerIndex]
  }

  const weight = position - lowerIndex
  return sortedSamples[lowerIndex] + ((sortedSamples[upperIndex] - sortedSamples[lowerIndex]) * weight)
}

function roundNumber(value) {
  return Number.parseFloat(value.toFixed(3))
}

function parseArgs(args) {
  const options = {
    headed: false,
    iterations: DEFAULT_ITERATIONS,
    listScenarios: false,
    outputPath: DEFAULT_OUTPUT_PATH,
    port: null,
    scenarioNames: null,
    timeBudgetMs: DEFAULT_TIME_BUDGET_MS,
    warmupIterations: DEFAULT_WARMUP_ITERATIONS,
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === "--headed") {
      options.headed = true
      continue
    }

    if (arg === "--list-scenarios") {
      options.listScenarios = true
      continue
    }

    if (arg === "--iterations") {
      options.iterations = parsePositiveInteger(args[++index], "--iterations")
      continue
    }

    if (arg === "--output") {
      options.outputPath = path.resolve(args[++index])
      continue
    }

    if (arg === "--port") {
      options.port = parsePositiveInteger(args[++index], "--port")
      continue
    }

    if (arg === "--scenario") {
      options.scenarioNames = args[++index].split(",").map((name) => name.trim()).filter(Boolean)
      continue
    }

    if (arg === "--time-budget") {
      options.timeBudgetMs = parsePositiveInteger(args[++index], "--time-budget")
      continue
    }

    if (arg === "--warmup") {
      options.warmupIterations = parseNonNegativeInteger(args[++index], "--warmup")
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  options.scenarios = options.scenarioNames ? selectScenarios(options.scenarioNames) : SCENARIOS
  return options
}

function selectScenarios(scenarioNames) {
  const names = new Set(scenarioNames)
  const selectedScenarios = SCENARIOS.filter((scenario) => names.has(scenario.name))
  const missingScenarios = scenarioNames.filter((scenarioName) => !selectedScenarios.find((scenario) => scenario.name === scenarioName))

  if (missingScenarios.length > 0) {
    throw new Error(`Unknown benchmark scenarios: ${missingScenarios.join(", ")}`)
  }

  return selectedScenarios
}

function printScenarioList() {
  console.log("Available benchmark scenarios:")

  for (const scenario of SCENARIOS) {
    console.log(`- ${scenario.name}: ${scenario.description}`)
  }
}

function printScenarioSummary(output, outputPath) {
  console.log("")
  console.log("Browser benchmark summary:")

  for (const scenario of output.scenarios) {
    console.log([
      `- ${scenario.name}`,
      `median=${scenario.stats.median.toFixed(3)}ms`,
      `p95=${scenario.stats.p95.toFixed(3)}ms`,
      `min=${scenario.stats.min.toFixed(3)}ms`,
      `max=${scenario.stats.max.toFixed(3)}ms`,
    ].join(" "))
  }

  console.log("")
  console.log(`Wrote benchmark results to ${outputPath}`)
}

function parsePositiveInteger(value, flagName) {
  const parsedValue = Number.parseInt(value, 10)

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`${flagName} expects a positive integer`)
  }

  return parsedValue
}

function parseNonNegativeInteger(value, flagName) {
  const parsedValue = Number.parseInt(value, 10)

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    throw new Error(`${flagName} expects a non-negative integer`)
  }

  return parsedValue
}

function numberFromEnv(name, fallback) {
  const value = process.env[name]

  if (!value) {
    return fallback
  }

  const parsedValue = Number.parseInt(value, 10)
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback
}

function safeGitCommand(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" }).trim()
  } catch {
    return null
  }
}

async function startViteServer(port) {
  const viteServer = await createServer({
    configFile: path.resolve("test/browser/vite.config.js"),
    logLevel: "error",
    server: {
      host: "127.0.0.1",
      port,
      strictPort: true,
    },
  })

  await viteServer.listen()
  return viteServer
}

async function stopViteServer(viteServer) {
  await viteServer.close()
}

function findAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()

    server.on("error", reject)
    server.listen(0, "127.0.0.1", () => {
      const address = server.address()

      if (!address || typeof address === "string") {
        server.close(() => reject(new Error("Could not determine an available TCP port")))
        return
      }

      server.close(() => resolve(address.port))
    })
  })
}
