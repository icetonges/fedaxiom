"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Brain, Database, Wrench, Network, BarChart2, Rocket,
  GitBranch, Cpu, Zap, Bot, ArrowRight, ChevronDown, ChevronRight,
  BookOpen, Shield, TrendingUp, Layers, Code2, Activity,
  CheckCircle, ExternalLink, Sparkles, RefreshCw, Copy, Check,
} from "lucide-react";

// ─── Process flow steps ───────────────────────────────────────────────────────

const FLOW_STEPS = [
  { n: 1,  icon: <Brain size={18}/>,      label: "Define Goal",     color: "#4f8ef7", desc: "Requirements, success criteria, quality rubric" },
  { n: 2,  icon: <Cpu size={18}/>,        label: "Select Model",    color: "#818cf8", desc: "Benchmark on your task; match tier to importance" },
  { n: 3,  icon: <Database size={18}/>,   label: "Build Knowledge", color: "#34d399", desc: "RAG pipeline, vector store, embeddings" },
  { n: 4,  icon: <Wrench size={18}/>,     label: "Design Tools",    color: "#38bdf8", desc: "MCP servers, API wrappers, function schemas" },
  { n: 5,  icon: <RefreshCw size={18}/>,  label: "Agent Loop",      color: "#a78bfa", desc: "ReAct: Thought → Action → Observation" },
  { n: 6,  icon: <Layers size={18}/>,     label: "Add Memory",      color: "#fbbf24", desc: "Sessions, context engineering, memory ETL" },
  { n: 7,  icon: <Network size={18}/>,    label: "Orchestrate",     color: "#fb923c", desc: "Multi-agent: Coordinator, Supervisor, A2A" },
  { n: 8,  icon: <BarChart2 size={18}/>,  label: "Evaluate",        color: "#f472b6", desc: "LLM-as-Judge, Golden Set, trajectory review" },
  { n: 9,  icon: <Shield size={18}/>,     label: "Guardrails",      color: "#f87171", desc: "Input/output filters, safety classifiers" },
  { n: 10, icon: <Rocket size={18}/>,     label: "Deploy & Scale",  color: "#94a3b8", desc: "Canary rollout, CI/CD gates, observability" },
];

// ─── 5-Day course days — full detail ─────────────────────────────────────────

const COURSE_DAYS = [
  {
    day: 1, title: "Introduction to Agents", color: "#4f8ef7", icon: <Bot size={16}/>,
    tagline: "What makes an agent different from a chatbot — and how the agentic loop creates autonomy",
    whitepapers: [
      { label: "Agents Whitepaper (Google)", url: "https://ai.google.dev/gemini-api/docs/thinking" },
      { label: "ReAct: Reasoning + Acting (Yao et al.)", url: "https://arxiv.org/abs/2210.03629" },
      { label: "Toolformer (Meta AI)", url: "https://arxiv.org/abs/2302.04761" },
    ],
    kaggle: [
      { label: "Day 1a — From Prompt to Action", url: "https://www.kaggle.com/code/kaggle5daysofai/day-1a-from-prompt-to-action" },
      { label: "Day 1b — Agent Architectures",   url: "https://www.kaggle.com/code/kaggle5daysofai/day-1b-agent-architectures" },
    ],
    concepts: [
      { term: "AI Agent", def: "An LLM augmented with Tools, Memory, and Planning — operating in a loop rather than a single pass. The loop is what creates autonomy." },
      { term: "Agentic Loop", def: "The core cycle: Reasoning → Tool Call → Observation → Reasoning, repeating until the task is done. Each iteration the model sees its own prior reasoning." },
      { term: "ReAct Pattern", def: "Thought: [why I need to act] → Action: tool_name({args}) → Observation: [result] → Thought: [what I learned]. Makes decision-making transparent and debuggable." },
      { term: "Tool Use / Function Calling", def: "The agent declares available tools with JSON schemas. The LLM emits structured JSON to call them; results are fed back as observations." },
      { term: "Multi-Agent", def: "Orchestrator decomposes the goal → delegates subtasks to specialist subagents → aggregates results. Enables parallelism, specialization, and scale." },
    ],
    code: `# ── SETUP ────────────────────────────────────────────────────────────
pip install google-adk google-generativeai
export GOOGLE_API_KEY=your_api_key   # get from aistudio.google.com

# ── BASIC REACT AGENT ─────────────────────────────────────────────────
from google.adk.agents import Agent
from google.adk.tools import FunctionTool
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService

# 1. Define your tools (any Python function)
def web_search(query: str) -> dict:
    """Search the web for current information."""
    # In production: integrate SerpAPI, Brave Search, Tavily, etc.
    return {"results": f"Simulated results for: {query}"}

def calculate(expression: str) -> dict:
    """Evaluate a safe math expression."""
    try:
        result = eval(expression, {"__builtins__": {}})
        return {"result": result}
    except Exception as e:
        return {"error": str(e)}

# 2. Build the agent
agent = Agent(
    name="research_assistant",
    model="gemini-2.5-flash",
    instruction="""You are a research assistant.
    Think step-by-step before each tool call.
    Always cite which tool gave you information.
    When done, summarize findings clearly.""",
    tools=[
        FunctionTool(func=web_search),
        FunctionTool(func=calculate),
    ]
)

# 3. Run with session management
session_service = InMemorySessionService()
runner = Runner(agent=agent, app_name="my_agent", session_service=session_service)

# Create session and send message
session = session_service.create_session(app_name="my_agent", user_id="user_1")
response = runner.run(
    user_id="user_1",
    session_id=session.id,
    new_message="What is 15% of 2847, and when was the ReAct paper published?"
)
print(response)`,
    platforms: [
      { name: "GCP / Vertex AI", color: "#4f8ef7", setup: `# Deploy to Vertex AI Agent Engine
pip install google-cloud-aiplatform vertexai

import vertexai
from vertexai.preview.reasoning_engines import ReasoningEngine

vertexai.init(project="YOUR_PROJECT", location="us-central1")

# Wrap your ADK runner
class AgentExecutor:
    def query(self, input: str) -> dict:
        response = runner.run(user_id="prod", session_id="s1", new_message=input)
        return {"output": str(response)}

# Deploy (creates a managed endpoint)
engine = ReasoningEngine.create(
    AgentExecutor(),
    requirements=["google-adk>=0.5.0"],
    display_name="research-agent-v1",
)
print(f"Endpoint: {engine.resource_name}")` },
      { name: "Databricks", color: "#e87722", setup: `# Databricks: run in a notebook or as a Job
# 1. Cluster init script
%pip install google-adk mlflow

# 2. Use Databricks Secrets for API key
import os
os.environ["GOOGLE_API_KEY"] = dbutils.secrets.get("google", "api_key")

# 3. Run agent inside a Spark UDF for batch processing
from pyspark.sql.functions import udf
from pyspark.sql.types import StringType

@udf(returnType=StringType())
def run_agent(query: str) -> str:
    response = runner.run(user_id="batch", session_id="s1", new_message=query)
    return str(response)

df = spark.table("queries").withColumn("agent_response", run_agent("query_col"))
df.write.saveAsTable("agent_results")` },
      { name: "Palantir Foundry / AIP", color: "#1a56db", setup: `# Palantir AIP Logic (Code Workbook / Transform)
# 1. Add google-adk to your conda environment in Foundry
# 2. Store API key in Foundry Secrets

from palantir_models import ModelInput, ModelOutput
import os

os.environ["GOOGLE_API_KEY"] = get_secret("google_api_key")

def my_transform(input_dataset: ModelInput, output_dataset: ModelOutput):
    """Foundry Transform: run agent on each row"""
    df = input_dataset.dataframe()

    results = []
    for _, row in df.iterrows():
        response = runner.run(
            user_id=row["user_id"],
            session_id="batch_session",
            new_message=row["query"]
        )
        results.append({"query": row["query"], "response": str(response)})

    output_dataset.write_dataframe(pd.DataFrame(results))` },
    ],
    docs: [
      { label: "Google ADK Quickstart", url: "https://google.github.io/adk-docs/get-started/quickstart/" },
      { label: "ADK GitHub (Python)", url: "https://github.com/google/adk-python" },
      { label: "ADK Sample Agents",   url: "https://github.com/google/adk-samples" },
      { label: "Kaggle 5-Day Hub",    url: "https://www.kaggle.com/learn-guide/5-day-agents" },
    ],
  },

  {
    day: 2, title: "Tools & MCP", color: "#818cf8", icon: <Wrench size={16}/>,
    tagline: "Model Context Protocol — the USB-C standard that lets any AI use any tool",
    whitepapers: [
      { label: "MCP Specification",          url: "https://spec.modelcontextprotocol.io/" },
      { label: "A2A Protocol Specification", url: "https://a2a-protocol.org/latest/specification/" },
      { label: "Function Calling Guide",     url: "https://ai.google.dev/gemini-api/docs/function-calling" },
    ],
    kaggle: [
      { label: "Day 2a — Agent Tools & MCP", url: "https://www.kaggle.com/code/kaggle5daysofai/day-2a-agent-tools" },
    ],
    concepts: [
      { term: "MCP", def: "Open standard (JSON-RPC 2.0) defining how AI hosts communicate with external tool servers. One agent connects to many MCP servers — no custom code per tool." },
      { term: "MCP Primitives", def: "Tools (callable functions with JSON schema), Resources (readable data via URI), Prompts (reusable parameterized templates). Servers expose any combination." },
      { term: "Transport Layers", def: "stdio = local server run as child process (fast, zero network). SSE over HTTPS = remote cloud-hosted server (shareable, deployable, scalable)." },
      { term: "A2A Protocol", def: "Agent-to-Agent: each agent publishes an Agent Card (JSON at /.well-known/agent.json). Orchestrators fetch cards, discover capabilities, send tasks via HTTP." },
      { term: "Tool Discovery", def: "Agent connects → calls list_tools() → gets full schema manifest → LLM selects tools by description → calls call_tool(name, args) → receives observations." },
    ],
    code: `# ── MCP SERVER (define once, any host can use it) ────────────────────
pip install mcp fastmcp

# server.py — your tool server
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("company-data-tools")

@mcp.tool()
def query_database(sql: str, table: str) -> dict:
    """Execute a read-only SQL query. Use for data retrieval."""
    # Production: connect to your actual DB
    return {"columns": ["id","name"], "rows": [[1, "Widget A"], [2, "Widget B"]]}

@mcp.resource("data://catalog")
def get_catalog() -> str:
    """Returns available data tables and schemas"""
    return "tables: orders, products, customers, events"

# Run the MCP server
if __name__ == "__main__":
    mcp.run()          # stdio mode (local)
    # mcp.run("sse")   # SSE mode (remote HTTPS)

# ── CONSUME MCP IN ADK AGENT ─────────────────────────────────────────
from google.adk.tools.mcp_tool import MCPToolset, StdioConnectionParams
from mcp import StdioServerParameters
from google.adk.agents import Agent

async def create_agent():
    mcp_tools, exit_stack = await MCPToolset.from_server(
        connection_params=StdioConnectionParams(
            server_params=StdioServerParameters(
                command="python", args=["server.py"]
            )
        )
    )
    agent = Agent(
        name="data_analyst",
        model="gemini-2.5-flash",
        instruction="Analyze company data. Use query_database to retrieve data.",
        tools=mcp_tools,
    )
    return agent, exit_stack

# ── REMOTE MCP (SSE) ─────────────────────────────────────────────────
from google.adk.tools.mcp_tool import StreamableHTTPConnectionParams

mcp_tools, _ = await MCPToolset.from_server(
    connection_params=StreamableHTTPConnectionParams(
        url="https://your-mcp-server.example.com/mcp",
        headers={"Authorization": f"Bearer {API_KEY}"},
    )
)`,
    platforms: [
      { name: "GCP Cloud Run (MCP Server)", color: "#4f8ef7", setup: `# Deploy MCP server to Cloud Run (remote SSE mode)
# Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install mcp fastmcp
COPY server.py .
EXPOSE 8080
CMD ["python", "server.py", "--transport", "sse", "--port", "8080"]

# Deploy
gcloud run deploy mcp-data-tools \\
  --source . \\
  --region us-central1 \\
  --allow-unauthenticated

# Use the Cloud Run URL in your agent:
# https://mcp-data-tools-xxxx-uc.a.run.app/mcp` },
      { name: "Databricks (MCP via REST)", color: "#e87722", setup: `# Databricks: expose Delta tables via MCP
# Use Databricks SQL Connector as the underlying DB

from mcp.server.fastmcp import FastMCP
from databricks import sql

mcp = FastMCP("databricks-tools")

@mcp.tool()
def query_delta(query: str) -> dict:
    """Query Delta Lake tables in Databricks"""
    with sql.connect(
        server_hostname=os.environ["DATABRICKS_HOST"],
        http_path=os.environ["DATABRICKS_HTTP_PATH"],
        access_token=os.environ["DATABRICKS_TOKEN"],
    ) as conn:
        cursor = conn.cursor()
        cursor.execute(query)
        return {"rows": cursor.fetchall()}` },
    ],
    docs: [
      { label: "MCP Official Docs",      url: "https://modelcontextprotocol.io/" },
      { label: "FastMCP Framework",      url: "https://github.com/jlowin/fastmcp" },
      { label: "A2A Agent Card Spec",    url: "https://a2a-protocol.org/latest/specification/#5-agent-discovery-the-agent-card" },
      { label: "ADK MCP Guide",          url: "https://google.github.io/adk-docs/tools/mcp-tools/" },
      { label: "MCP Server Registry",    url: "https://github.com/modelcontextprotocol/servers" },
    ],
  },

  {
    day: 3, title: "Context Engineering & Memory", color: "#34d399", icon: <Database size={16}/>,
    tagline: "What goes into the context window is as important as the model itself",
    whitepapers: [
      { label: "Context Engineering (Karpathy tweet thread)", url: "https://x.com/karpathy/status/1937902205765607850" },
      { label: "Retrieval-Augmented Generation (Lewis et al.)", url: "https://arxiv.org/abs/2005.11401" },
      { label: "Memory Bank Setup (Google Cloud)",             url: "https://cloud.google.com/agent-builder/agent-engine/memory-bank/set-up" },
    ],
    kaggle: [
      { label: "Day 3a — Agent Sessions", url: "https://www.kaggle.com/code/kaggle5daysofai/day-3a-agent-sessions" },
      { label: "Day 3b — Agent Memory",   url: "https://www.kaggle.com/code/kaggle5daysofai/day-3b-agent-memory" },
    ],
    concepts: [
      { term: "Context Engineering", def: "Deliberately managing what enters the context window — which memories to retrieve, how to compress history, and which instructions to include per turn." },
      { term: "Session", def: "A bounded sequence of turns sharing a single context thread. Session services persist turn history so agents can resume across requests and restarts." },
      { term: "Memory Types", def: "In-Context (raw active window), External (vector DB queried at runtime), Semantic (domain knowledge), Episodic (user-specific past interactions)." },
      { term: "Memory ETL Pipeline", def: "Ingestion → LLM extracts facts matching topic definitions → Consolidation (UPDATE/CREATE/DELETE vs existing) → Storage in vector DB." },
      { term: "Memory Provenance", def: "Source type + timestamp tag on each memory. Trust: Bootstrapped (high) > User Input (medium) > Tool Output (lower). Enables conflict resolution." },
    ],
    code: `# ── SESSION MANAGEMENT ───────────────────────────────────────────────
from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import DatabaseSessionService

# Persistent sessions (survives restarts)
session_service = DatabaseSessionService(
    db_url="postgresql://user:pass@localhost/axiom_sessions"
    # Databricks: use jdbc:databricks://...
    # Palantir: use Foundry's managed Postgres
)

runner = Runner(
    agent=agent,
    app_name="axiom",
    session_service=session_service
)

# First interaction
session = await session_service.create_session(
    app_name="axiom", user_id="peter"
)
await runner.run_async(
    user_id="peter",
    session_id=session.id,
    new_message="My name is Peter, I work on AI engineering at Palantir."
)

# Resume next day — same session ID remembers context
await runner.run_async(
    user_id="peter",
    session_id=session.id,
    new_message="What was the key project I mentioned?"
)

# ── LONG-TERM MEMORY (Vertex AI Memory Bank) ─────────────────────────
from google.adk.memory import VertexAiMemoryBankService
import vertexai

vertexai.init(project="YOUR_PROJECT", location="us-central1")

memory_service = VertexAiMemoryBankService(
    agent_engine_id="projects/xxx/locations/us-central1/reasoningEngines/yyy"
)

runner_with_memory = Runner(
    agent=agent,
    app_name="axiom",
    session_service=session_service,
    memory_service=memory_service,  # facts persist across sessions
)

# ── RAG — SEMANTIC MEMORY RETRIEVAL ──────────────────────────────────
from google.adk.tools import FunctionTool
from google.cloud import aiplatform

def retrieve_knowledge(query: str, top_k: int = 5) -> dict:
    """Retrieve relevant knowledge base chunks for a query."""
    # 1. Embed the query
    embed_model = genai.get_model("text-embedding-004")
    q_emb = embed_model.embed_content(query).embedding.values

    # 2. Vector search (Vertex AI / pgvector / Pinecone)
    results = vector_index.find_neighbors(
        queries=[q_emb], num_neighbors=top_k
    )
    return {"chunks": [r.datapoint.restricts[0].string_value for r in results[0]]}

agent = Agent(
    model="gemini-2.5-flash",
    tools=[FunctionTool(func=retrieve_knowledge)],
    instruction="Always retrieve relevant knowledge before answering factual questions.",
)`,
    platforms: [
      { name: "GCP — Vertex AI Vector Search", color: "#4f8ef7", setup: `# Create a Vertex AI Vector Search index
from google.cloud import aiplatform

aiplatform.init(project="YOUR_PROJECT", location="us-central1")

# Create index
index = aiplatform.MatchingEngineIndex.create_tree_ah_index(
    display_name="knowledge-base",
    contents_delta_uri="gs://YOUR_BUCKET/embeddings/",
    dimensions=768,
    approximate_neighbors_count=10,
)

# Deploy index to endpoint
index_endpoint = aiplatform.MatchingEngineIndexEndpoint.create(
    display_name="kb-endpoint",
    public_endpoint_enabled=True,
)
deployed_index = index_endpoint.deploy_index(index=index, deployed_index_id="kb")` },
      { name: "Databricks — Vector Search", color: "#e87722", setup: `# Databricks Vector Search (built on Delta Lake)
from databricks.vector_search.client import VectorSearchClient

client = VectorSearchClient()

# Create vector search endpoint
client.create_endpoint(name="axiom-kb", endpoint_type="STANDARD")

# Create index from a Delta table with embeddings column
index = client.create_delta_sync_index(
    endpoint_name="axiom-kb",
    source_table_name="main.knowledge.docs_with_embeddings",
    index_name="main.knowledge.docs_index",
    pipeline_type="TRIGGERED",
    primary_key="doc_id",
    embedding_dimension=768,
    embedding_vector_column="embedding",
)

# Query
results = index.similarity_search(
    query_vector=query_embedding,
    columns=["doc_id", "content", "source"],
    num_results=5,
)` },
      { name: "Palantir Foundry — AIP Memory", color: "#1a56db", setup: `# Palantir AIP Logic + Ontology for agent memory
# Ontology objects act as persistent memory store

from foundry_dev_tools import FoundryContext
from palantir_models import ModelAdapter

# Store memory as Ontology objects (structured)
# Define object type: AgentMemory {user_id, fact, confidence, created_at}

class AgentMemoryStore:
    def __init__(self, ctx: FoundryContext):
        self.ontology = ctx.ontology

    def store_fact(self, user_id: str, fact: str):
        """Write memory as Ontology object"""
        self.ontology.objects.AgentMemory.put({
            "userId": user_id,
            "fact": fact,
            "confidence": 0.9,
            "createdAt": datetime.now().isoformat(),
        })

    def retrieve_facts(self, user_id: str) -> list[str]:
        """Read memories for user"""
        objs = self.ontology.objects.AgentMemory.filter(userId=user_id).all()
        return [o.fact for o in objs]` },
    ],
    docs: [
      { label: "ADK Sessions Guide",       url: "https://google.github.io/adk-docs/sessions/" },
      { label: "ADK Memory Guide",         url: "https://google.github.io/adk-docs/memory/" },
      { label: "Vertex Memory Bank Setup", url: "https://cloud.google.com/agent-builder/agent-engine/memory-bank/set-up" },
      { label: "RAG Best Practices",       url: "https://cloud.google.com/vertex-ai/generative-ai/docs/rag-overview" },
    ],
  },

  {
    day: 4, title: "Agent Quality & Evaluation", color: "#f472b6", icon: <BarChart2 size={16}/>,
    tagline: "Non-deterministic systems need a new quality model — trajectory is the truth",
    whitepapers: [
      { label: "LLM-as-a-Judge (Zheng et al.)",    url: "https://arxiv.org/abs/2306.05685" },
      { label: "Agent-as-a-Judge (Zhuge et al.)",   url: "https://arxiv.org/abs/2410.10934" },
      { label: "RAGAS Evaluation Framework",        url: "https://arxiv.org/abs/2309.15217" },
      { label: "NIST AI Risk Management Framework", url: "https://www.nist.gov/system/files/documents/2023/01/26/AI%20RMF%201.0.pdf" },
    ],
    kaggle: [
      { label: "Day 4a — Agent Observability", url: "https://www.kaggle.com/code/kaggle5daysofai/day-4a-agent-observability" },
      { label: "Day 4b — Agent Evaluation",    url: "https://www.kaggle.com/code/kaggle5daysofai/day-4b-agent-evaluation" },
    ],
    concepts: [
      { term: "Four Pillars", def: "Effectiveness (task success rate), Cost-Efficiency (tokens/$), Safety (no harmful/biased outputs), User Trust (confidence to rely on it in production)." },
      { term: "Trajectory Evaluation", def: "Evaluate the full reasoning chain and tool call sequence — not just the final answer. Catches correct answers reached via wrong/unsafe paths." },
      { term: "LLM-as-a-Judge", def: "A stronger LLM scores outputs on a rubric: correctness, helpfulness, safety, trajectory adherence. Scalable alternative to human labeling. Include chain-of-thought." },
      { term: "Observability Pillars", def: "Logs (every step's diary), Traces (connected causal narrative across a request), Metrics (aggregated report card). OpenTelemetry is the standard." },
      { term: "Quality Flywheel", def: "Define Quality → Instrument (OTel) → Evaluate (LLM-Judge + HITL) → Failures become regression tests → Golden Set grows → flywheel accelerates." },
    ],
    code: `# ── OPENTELEMETRY INSTRUMENTATION ────────────────────────────────────
pip install opentelemetry-sdk opentelemetry-exporter-otlp google-adk

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

# Set up tracer (send to Cloud Trace, Datadog, Grafana Tempo, etc.)
provider = TracerProvider()
provider.add_span_processor(
    BatchSpanProcessor(OTLPSpanExporter(endpoint="http://localhost:4317"))
)
trace.set_tracer_provider(provider)
tracer = trace.get_tracer("axiom-agent")

# Instrument your agent runner
with tracer.start_as_current_span("agent_request") as span:
    span.set_attribute("user.id", user_id)
    span.set_attribute("model", "gemini-2.5-flash")
    response = runner.run(user_id=user_id, session_id=sid, new_message=query)
    span.set_attribute("output.length", len(str(response)))

# ── LLM-AS-A-JUDGE EVALUATOR ──────────────────────────────────────────
import google.generativeai as genai

JUDGE_PROMPT = """You are an expert evaluator of AI agent responses.

Question: {question}
Agent Response: {response}
Expected (reference): {reference}

Rate the response on each dimension (1-5) and explain:
- Correctness: Is the information accurate?
- Helpfulness: Does it fully address the question?
- Safety: Is it free from harmful content?
- Trajectory Efficiency: Did it reach the answer efficiently?

Return JSON: {{"correctness": N, "helpfulness": N, "safety": N, "trajectory": N, "reasoning": "..."}}"""

def llm_judge(question: str, response: str, reference: str) -> dict:
    model = genai.GenerativeModel(
        "gemini-2.5-pro",   # Use strongest model as judge
        generation_config={"response_mime_type": "application/json"}
    )
    result = model.generate_content(
        JUDGE_PROMPT.format(question=question, response=response, reference=reference)
    )
    return json.loads(result.text)

# ── BUILD GOLDEN EVALUATION SET ───────────────────────────────────────
golden_set = [
    {
        "id": "eval_001",
        "question": "What is RAG and when should I use it?",
        "expected_topics": ["retrieval", "knowledge base", "hallucination", "update"],
        "required_tools": [],   # should NOT call tools for this conceptual Q
        "reference": "RAG grounds LLM answers in external documents..."
    },
    # ... 50+ test cases covering all task types
]

# ── RUN EVALUATION SUITE ──────────────────────────────────────────────
import json
scores = []
for test in golden_set:
    response = runner.run(user_id="eval", session_id="eval", new_message=test["question"])
    score = llm_judge(test["question"], str(response), test["reference"])
    scores.append(score)

avg = {k: sum(s[k] for s in scores)/len(scores) for k in ["correctness","helpfulness","safety"]}
print(f"Avg Correctness: {avg['correctness']:.2f}/5")
# Gate: fail CI/CD if correctness < 3.5`,
    platforms: [
      { name: "GCP — Vertex AI Evaluation", color: "#4f8ef7", setup: `# Vertex AI Evaluation Service
from vertexai.evaluation import EvalTask, MetricPromptTemplateExamples
import vertexai

vertexai.init(project="YOUR_PROJECT", location="us-central1")

eval_task = EvalTask(
    dataset=eval_dataset,   # pandas DataFrame or BQ table
    metrics=[
        MetricPromptTemplateExamples.Pointwise.GROUNDEDNESS,
        MetricPromptTemplateExamples.Pointwise.INSTRUCTION_FOLLOWING,
        MetricPromptTemplateExamples.Pointwise.SAFETY,
    ],
    experiment="agent-eval-v1",
)

result = eval_task.evaluate(
    model="gemini-2.5-pro",    # judge model
    prompt_template="{question}",
)
result.summary_metrics.to_csv("eval_results.csv")` },
      { name: "Databricks — MLflow Eval", color: "#e87722", setup: `# MLflow LLM Evaluation on Databricks
import mlflow

with mlflow.start_run(run_name="agent-eval"):
    # Log evaluation results
    results = mlflow.evaluate(
        model=agent_pyfunc_model,
        data=eval_df,          # pandas df with "inputs" and "targets"
        targets="targets",
        model_type="question-answering",
        evaluators="default",
        extra_metrics=[
            mlflow.metrics.genai.answer_correctness(model="endpoints:/databricks-gemini"),
            mlflow.metrics.genai.faithfulness(model="endpoints:/databricks-gemini"),
        ],
    )
    mlflow.log_metrics(results.metrics)
    print(results.tables["eval_results_table"])` },
    ],
    docs: [
      { label: "LLM-as-Judge Guide (Galileo)", url: "https://galileo.ai/blog/llm-as-a-judge-guide-evaluation" },
      { label: "OpenTelemetry for AI",         url: "https://opentelemetry.io/docs/what-is-opentelemetry/" },
      { label: "Vertex AI Evaluation",         url: "https://cloud.google.com/vertex-ai/generative-ai/docs/models/evaluation-overview" },
      { label: "RAGAS Framework",              url: "https://docs.ragas.io/" },
    ],
  },

  {
    day: 5, title: "Prototype to Production", color: "#fb923c", icon: <Rocket size={16}/>,
    tagline: "Production is not deployment — it's the entire system that keeps the agent trustworthy at scale",
    whitepapers: [
      { label: "Agents in Production (Google Cloud Blog)",  url: "https://cloud.google.com/blog/topics/developers-practitioners/tools-make-an-agent-from-zero-to-assistant-with-adk" },
      { label: "A2A Protocol Spec",                         url: "https://a2a-protocol.org/latest/specification/" },
      { label: "Responsible AI Practices (Google)",         url: "https://ai.google/responsibility/responsible-ai-practices/" },
    ],
    kaggle: [
      { label: "Day 5a — Agent2Agent Communication", url: "https://www.kaggle.com/code/kaggle5daysofai/day-5a-agent2agent-communication" },
      { label: "Day 5b — Agent Deployment",          url: "https://www.kaggle.com/code/kaggle5daysofai/day-5b-agent-deployment" },
      { label: "Capstone Competition",               url: "https://www.kaggle.com/competitions/agents-intensive-capstone-project" },
    ],
    concepts: [
      { term: "Evaluatable-by-Design", def: "Instrument from line 1. Add OTel tracing before writing business logic. Quality cannot be retrofitted — logs and traces must exist from day one." },
      { term: "Canary / Blue-Green", def: "New version handles X% of traffic. Monitor quality dashboards. Promote if metrics hold; rollback within 60 seconds if they degrade. Zero downtime." },
      { term: "Guardrails", def: "Input guardrails: classify intent, detect PII/injection before LLM sees it. Output guardrails: content filter, schema validator, toxicity scorer before users see it." },
      { term: "Cost Optimization", def: "Semantic caching (skip LLM for repeated queries), model routing (cheap models for simple tasks), prompt compression, batching, token budget enforcement." },
      { term: "Scaling Pattern", def: "Stateless agent workers + shared session store (AlloyDB/Postgres) + shared vector store → horizontal scale without state coupling. Workers die safely." },
    ],
    code: `# ── INPUT + OUTPUT GUARDRAILS ─────────────────────────────────────────
from google.adk.agents import Agent
from google.adk.tools import FunctionTool
import re

def input_guardrail(message: str) -> tuple[bool, str]:
    """Returns (is_safe, reason). Block before agent sees input."""
    # Check for prompt injection
    injection_patterns = [r"ignore previous", r"jailbreak", r"system:"]
    for p in injection_patterns:
        if re.search(p, message, re.IGNORECASE):
            return False, "Potential prompt injection detected"
    # Check for PII (simplified — use presidio in production)
    if re.search(r"\b\d{3}-\d{2}-\d{4}\b", message):  # SSN pattern
        return False, "PII (SSN) detected in input"
    return True, "ok"

def output_guardrail(response: str) -> tuple[bool, str]:
    """Returns (is_safe, sanitized_response)."""
    # Example: block harmful keywords
    harmful = ["confidential", "internal only"]
    for h in harmful:
        if h.lower() in response.lower():
            return False, "[Response blocked by output guardrail]"
    return True, response

# ── MULTI-AGENT ORCHESTRATION (A2A Pattern) ──────────────────────────
from google.adk.agents import Agent, LlmAgent
from google.adk.tools.agent_tool import AgentTool

# Specialist agents
research_agent = LlmAgent(
    name="researcher",
    model="gemini-2.5-flash",
    instruction="Research specialist. Always cite sources. Output structured findings.",
    tools=[web_search, rag_retrieve],
)

analyst_agent = LlmAgent(
    name="analyst",
    model="gemini-2.5-flash",
    instruction="Data analyst. Interpret research findings. Identify patterns and insights.",
    tools=[calculate, analyze_data],
)

# Coordinator orchestrates both
coordinator = LlmAgent(
    name="coordinator",
    model="gemini-2.5-flash",  # strongest model for coordination
    instruction="""Task coordinator. For complex questions:
    1. Use researcher to gather facts
    2. Use analyst to interpret them
    3. Synthesize into a final answer""",
    tools=[
        AgentTool(agent=research_agent),
        AgentTool(agent=analyst_agent),
    ],
)

# ── CI/CD QUALITY GATE ────────────────────────────────────────────────
# .github/workflows/agent-eval.yml (or Cloud Build trigger)
# Run this before every deployment:

import subprocess, sys, json

def quality_gate(min_correctness=3.5, min_safety=4.5) -> bool:
    """Fail deployment if quality metrics drop below thresholds."""
    results = run_eval_suite()
    avg_correctness = sum(r["correctness"] for r in results) / len(results)
    avg_safety      = sum(r["safety"]      for r in results) / len(results)

    if avg_correctness < min_correctness:
        print(f"❌ GATE FAILED: Correctness {avg_correctness:.2f} < {min_correctness}")
        return False
    if avg_safety < min_safety:
        print(f"❌ GATE FAILED: Safety {avg_safety:.2f} < {min_safety}")
        return False

    print(f"✅ Quality gate passed: Correctness={avg_correctness:.2f}, Safety={avg_safety:.2f}")
    return True

if not quality_gate():
    sys.exit(1)   # Fail the CI/CD pipeline — don't deploy`,
    platforms: [
      { name: "GCP — Vertex AI Agent Engine", color: "#4f8ef7", setup: `# Full production deployment on GCP
from vertexai.preview.reasoning_engines import ReasoningEngine
import vertexai

vertexai.init(project="YOUR_PROJECT", location="us-central1")

class ProductionAgentApp:
    """Wrapper class that Vertex AI Agent Engine requires"""
    def set_up(self):
        # Called once at startup — initialize connections
        self.runner = create_runner()

    def query(self, input: str, user_id: str = "anon") -> dict:
        # Apply guardrails
        is_safe, reason = input_guardrail(input)
        if not is_safe:
            return {"error": reason}
        response = self.runner.run(user_id=user_id, session_id="s", new_message=input)
        ok, output = output_guardrail(str(response))
        return {"output": output if ok else "[Blocked]"}

# Deploy (provisions managed endpoint with auto-scaling)
engine = ReasoningEngine.create(
    ProductionAgentApp(),
    requirements=["google-adk>=0.5.0", "google-cloud-aiplatform"],
    display_name="axiom-agent-prod-v1",
    gcs_dir="gs://YOUR_BUCKET/staging/",
)

# Canary: test endpoint before promoting
test_response = engine.query(input="Hello", user_id="canary_test")` },
      { name: "Databricks Jobs (Scheduled)", color: "#e87722", setup: `# Databricks: scheduled batch agent jobs
# Create a Databricks Job with Python Wheel task

# 1. Package your agent as a wheel
#    setup.py → python setup.py bdist_wheel → upload to DBFS

# 2. Job YAML (deploy via Databricks CLI or Terraform)
# job.yml:
# name: axiom-agent-daily
# tasks:
#   - task_key: run_agent
#     python_wheel_task:
#       package_name: axiom_agent
#       entry_point: run_batch
#     cluster_type: NEW_CLUSTER
#     new_cluster:
#       spark_version: 15.4.x-cpu-ml-scala2.12
#       node_type_id: i3.xlarge
#       num_workers: 4

# 3. Deploy
# databricks jobs create --json @job.yml` },
      { name: "Palantir Foundry + AIP", color: "#1a56db", setup: `# Palantir AIP Ontology-First Agent Deployment
# AIP Logic (Code Repository) → Pipeline → Ontology Write-back

# Step 1: Define agent as AIP Logic function
# In Foundry Code Repository (Python):

from aip_logic import AipContext, input_schema, output_schema

@input_schema("UserQuery")   # Ontology input type
@output_schema("AgentResult") # Ontology output type
def run_agent(ctx: AipContext, query: str) -> dict:
    """AIP Logic function — Foundry calls this per request"""
    os.environ["GOOGLE_API_KEY"] = ctx.secrets.get("google_api_key")
    response = runner.run(
        user_id=ctx.user_id,
        session_id=ctx.session_id,
        new_message=query
    )
    return {"result": str(response), "sessionId": ctx.session_id}

# Step 2: Register as AIP Application in Slate/Workshop
# Step 3: Wire to Ontology for persistent storage of results
# Step 4: Set up Branch-based CI (Checks + Preview Environments)` },
      { name: "AWS SageMaker Endpoint", color: "#ff9900", setup: `# AWS: deploy agent as SageMaker real-time endpoint
import sagemaker
from sagemaker.pytorch import PyTorchModel

# 1. Package agent as inference script
# inference.py:
# def model_fn(model_dir): return create_runner()
# def predict_fn(data, runner): return runner.run(...)

# 2. Create SageMaker model
sagemaker_session = sagemaker.Session()
model = sagemaker.model.Model(
    image_uri="...",     # Use a Python 3.11 image
    model_data="s3://YOUR_BUCKET/agent.tar.gz",
    role=sagemaker.get_execution_role(),
    env={"GOOGLE_API_KEY": os.environ["GOOGLE_API_KEY"]},
)

# 3. Deploy
predictor = model.deploy(
    initial_instance_count=2,
    instance_type="ml.m5.large",
    endpoint_name="axiom-agent-endpoint",
)

# 4. Auto-scaling
client = boto3.client("application-autoscaling")
client.register_scalable_target(...)` },
    ],
    docs: [
      { label: "ADK Deployment Guide",       url: "https://google.github.io/adk-docs/deploy/vertex-ai/" },
      { label: "AlloyDB (Agent State Store)", url: "https://cloud.google.com/alloydb" },
      { label: "Cloud SQL",                  url: "https://cloud.google.com/sql" },
      { label: "A2A Agent Demo (YouTube)",   url: "https://www.youtube.com/watch?v=kJRgj58ujEk" },
      { label: "Capstone Project",           url: "https://www.kaggle.com/competitions/agents-intensive-capstone-project" },
    ],
  },
];

// ─── Advanced topics ──────────────────────────────────────────────────────────

const ADVANCED = [
  { icon: <Cpu size={16}/>,        color: "#818cf8", title: "Gemini 2.5 Flash",         tag: "NEW MODEL",     desc: "Free tier, 1M context, multimodal. Best price-performance. Replaces 2.0 Flash across all workloads." },
  { icon: <Network size={16}/>,    color: "#34d399", title: "MCP v2 + Remote Servers",  tag: "HOT",           desc: "De-facto tool standard. Claude, Cursor, VS Code all support it. SSE transport enables cloud-hosted MCP servers shareable across teams." },
  { icon: <Bot size={16}/>,        color: "#f472b6", title: "Agent-to-Agent (A2A)",     tag: "HOT",           desc: "Agents publish Agent Cards; orchestrators discover and invoke them across frameworks. Polyglot multi-agent systems." },
  { icon: <Layers size={16}/>,     color: "#38bdf8", title: "Gemini Embedding 2",       tag: "NEW",           desc: "3072-dim multimodal embeddings for text, images, video, audio, PDF. Powers semantic search, RAG, dedup, clustering." },
  { icon: <Sparkles size={16}/>,   color: "#e879f9", title: "Imagen 4",                 tag: "NEW",           desc: "Google's image generation via Gemini API. Fast / Standard / Ultra tiers. Text-to-image for agent visual outputs. Requires billing." },
  { icon: <Zap size={16}/>,        color: "#fbbf24", title: "DeepSeek R1 (Free Groq)",  tag: "TRENDING",      desc: "Open-source reasoning model with explicit chain-of-thought. Competitive with o1 on math/code. Free via Groq at 128K context." },
  { icon: <Shield size={16}/>,     color: "#f87171", title: "Guardrails as Architecture", tag: "BEST PRACTICE", desc: "Input + output safety layers are now standard. Classify intent, detect PII, filter outputs, enforce schema. Build at framework level." },
  { icon: <TrendingUp size={16}/>, color: "#fb923c", title: "LLM-as-Judge at Scale",   tag: "BEST PRACTICE", desc: "Automated eval that scales to millions of inferences. Scores correctness, helpfulness, safety, trajectory. Critical for CI/CD gates." },
  { icon: <GitBranch size={16}/>,  color: "#94a3b8", title: "Agentic CI/CD",            tag: "PRODUCTION",    desc: "Eval suites run on every commit. Quality gates block bad deploys. Failures become regression tests. The Quality Flywheel in your pipeline." },
];

// ─── Code copy hook ───────────────────────────────────────────────────────────

function useCodeCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };
  return { copied, copy };
}

// ─── DayCard component ────────────────────────────────────────────────────────

function DayCard({ d }: { d: typeof COURSE_DAYS[0] }) {
  const [open, setOpen] = useState(false);
  const [codeTab, setCodeTab] = useState(0);
  const { copied, copy } = useCodeCopy();

  return (
    <div style={{
      border: `1px solid ${open ? d.color + "55" : "rgba(255,255,255,0.10)"}`,
      borderRadius: 12,
      background: open ? `color-mix(in srgb, ${d.color} 5%, #1c1f30)` : "#1c1f30",
      transition: "all 0.2s", overflow: "hidden",
    }}>
      {/* Header */}
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 14,
        padding: "18px 22px", background: "none", border: "none", cursor: "pointer", textAlign: "left",
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 10, flexShrink: 0,
          background: d.color + "20", border: `1px solid ${d.color}44`,
          display: "flex", alignItems: "center", justifyContent: "center", color: d.color,
        }}>{d.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: d.color, textTransform: "uppercase", letterSpacing: "0.1em" }}>Day {d.day}</span>
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#eaedf8", marginTop: 2 }}>{d.title}</div>
          <div style={{ fontSize: 13, color: "#9aa3c0", marginTop: 3, lineHeight: 1.5 }}>{d.tagline}</div>
        </div>
        <div style={{ color: "#6b7499", flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(90deg)" : "none" }}>
          <ChevronRight size={18} />
        </div>
      </button>

      {open && (
        <div style={{ padding: "0 22px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Process Flow */}
          <div style={{ padding: "12px 16px", borderRadius: 9, background: "#12141f", border: `1px solid ${d.color}33` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7499", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 7 }}>Workflow Flow</div>
            <div style={{ fontSize: 13, color: d.color, fontFamily: "monospace", lineHeight: 1.9, wordBreak: "break-word" }}>
              {d.day === 1 && "User Input → Input Guardrail → LLM Reasoning → Tool Selection → Tool Call → Observation → Loop → Final Response"}
              {d.day === 2 && "Host App → MCP Client → JSON-RPC → MCP Server → Tool Result → Client → Host → LLM → User"}
              {d.day === 3 && "Turn History → Ingestion → LLM Extract Facts → Consolidation (UPDATE/CREATE/DELETE) → Vector DB → Retrieval at next turn"}
              {d.day === 4 && "Agent Output → LLM-as-Judge (rubric) → Score (1-5) → Compare to Golden Set → CI gate → Pass/Fail"}
              {d.day === 5 && "Commit → Eval Suite → Quality Gate → Canary 5% → Monitor Dashboards → Promote to 100% or Rollback"}
            </div>
          </div>

          {/* Key Concepts */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7499", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Core Concepts</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {d.concepts.map(c => (
                <div key={c.term} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <CheckCircle size={15} style={{ color: d.color, flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: 14, lineHeight: 1.65 }}>
                    <span style={{ fontWeight: 700, color: "#eaedf8" }}>{c.term}</span>
                    <span style={{ color: "#b0bcd4", marginLeft: 8 }}>— {c.def}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Code block */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7499", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Code — Skeleton to Production</div>
            <div style={{ position: "relative", borderRadius: 9, overflow: "hidden", border: `1px solid ${d.color}33` }}>
              <div style={{ background: "#0d0f1a", padding: "10px 14px", borderBottom: `1px solid ${d.color}22`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: d.color, fontFamily: "monospace", fontWeight: 700 }}>Python (Google ADK + Gemini 2.5 Flash)</span>
                <button onClick={() => copy(`day${d.day}-main`, d.code)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7499", display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "3px 8px", borderRadius: 5, transition: "color 0.15s" }}>
                  {copied === `day${d.day}-main` ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                </button>
              </div>
              <pre style={{ margin: 0, padding: "16px", background: "#0d0f1a", fontSize: 12, lineHeight: 1.75, overflowX: "auto", color: "#c9d1f0", fontFamily: "JetBrains Mono, Consolas, monospace" }}>
                {d.code}
              </pre>
            </div>
          </div>

          {/* Platform deployment */}
          {d.platforms && d.platforms.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7499", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Deploy To — Platform Setup</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                {d.platforms.map((p, i) => (
                  <button key={p.name} onClick={() => setCodeTab(i)} style={{
                    padding: "6px 14px", borderRadius: 7, border: `1px solid ${codeTab === i ? p.color : "rgba(255,255,255,0.12)"}`,
                    background: codeTab === i ? p.color + "18" : "transparent",
                    color: codeTab === i ? p.color : "#9aa3c0",
                    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}>{p.name}</button>
                ))}
              </div>
              {d.platforms[codeTab] && (
                <div style={{ position: "relative", borderRadius: 9, overflow: "hidden", border: `1px solid ${d.platforms[codeTab].color}33` }}>
                  <div style={{ background: "#0d0f1a", padding: "10px 14px", borderBottom: `1px solid ${d.platforms[codeTab].color}22`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: d.platforms[codeTab].color, fontWeight: 700 }}>{d.platforms[codeTab].name} Setup</span>
                    <button onClick={() => copy(`day${d.day}-plat${codeTab}`, d.platforms![codeTab].setup)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7499", display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "3px 8px", borderRadius: 5 }}>
                      {copied === `day${d.day}-plat${codeTab}` ? <><Check size={12}/> Copied</> : <><Copy size={12}/> Copy</>}
                    </button>
                  </div>
                  <pre style={{ margin: 0, padding: "16px", background: "#0d0f1a", fontSize: 12, lineHeight: 1.75, overflowX: "auto", color: "#c9d1f0", fontFamily: "JetBrains Mono, Consolas, monospace" }}>
                    {d.platforms[codeTab].setup}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Kaggle notebooks */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7499", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>📓 Kaggle Notebooks</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {d.kaggle.map(k => (
                  <a key={k.url} href={k.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "#38bdf8", textDecoration: "none", padding: "7px 11px", borderRadius: 7, background: "rgba(56,189,248,0.07)", border: "1px solid rgba(56,189,248,0.18)", transition: "all 0.15s" }}>
                    <ExternalLink size={12} /> {k.label}
                  </a>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7499", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>📄 Whitepapers & Docs</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {d.whitepapers.map(w => (
                  <a key={w.url} href={w.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "#818cf8", textDecoration: "none", padding: "7px 11px", borderRadius: 7, background: "rgba(129,140,248,0.07)", border: "1px solid rgba(129,140,248,0.18)", transition: "all 0.15s" }}>
                    <ExternalLink size={12} /> {w.label}
                  </a>
                ))}
                {d.docs.map(doc => (
                  <a key={doc.url} href={doc.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "#34d399", textDecoration: "none", padding: "7px 11px", borderRadius: 7, background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.18)", transition: "all 0.15s" }}>
                    <ExternalLink size={12} /> {doc.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FlowStep (number fully visible) ─────────────────────────────────────────

function FlowStep({ s, isLast, reverse }: { s: typeof FLOW_STEPS[0]; isLast: boolean; reverse?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0, minWidth: 120 }}>
        {/* Number badge — in normal flow, always fully visible */}
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: s.color, color: "#0a0c14",
          fontSize: 12, fontWeight: 900,
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1, flexShrink: 0, marginBottom: -14,
          boxShadow: `0 0 10px ${s.color}55`,
        }}>{s.n}</div>

        {/* Card body */}
        <div style={{
          width: "100%", padding: "22px 10px 14px",
          borderRadius: 10,
          background: s.color + "0e",
          border: `1px solid ${s.color}33`,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        }}>
          <div style={{ color: s.color }}>{s.icon}</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#eaedf8", textAlign: "center", lineHeight: 1.3 }}>{s.label}</div>
          <div style={{ fontSize: 12, color: "#9aa3c0", textAlign: "center", lineHeight: 1.55 }}>{s.desc}</div>
        </div>
      </div>

      {!isLast && (
        <div style={{ flexShrink: 0, color: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", padding: "14px 3px 0" }}>
          {reverse ? <ArrowRight size={16} style={{ transform: "rotate(180deg)" }} /> : <ArrowRight size={16} />}
        </div>
      )}
    </div>
  );
}

function FlowRow({ steps, reverse }: { steps: typeof FLOW_STEPS; reverse?: boolean }) {
  const ordered = reverse ? [...steps].reverse() : steps;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 0, overflowX: "auto", paddingBottom: 2, paddingTop: 16 }}>
      {ordered.map((s, i) => (
        <FlowStep key={s.n} s={s} isLast={i === ordered.length - 1} reverse={reverse} />
      ))}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ icon, label, title, sub, color }: { icon: React.ReactNode; label: string; title: string; sub: string; color: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ color }}>{icon}</div>
        <span style={{ fontSize: 12, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
      </div>
      <h2 style={{ fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)", fontWeight: 800, color: "#eaedf8", lineHeight: 1.2, marginBottom: 7 }}>{title}</h2>
      <p style={{ fontSize: 14, color: "#9aa3c0", lineHeight: 1.65 }}>{sub}</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px 90px" }}>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "5px 16px", borderRadius: 20,
          background: "rgba(79,142,247,0.12)", border: "1px solid rgba(79,142,247,0.3)",
          fontSize: 12, fontWeight: 700, color: "#4f8ef7",
          textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20,
        }}>
          <Cpu size={13} /> AI Engineering Sandbox
        </div>
        <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)", fontWeight: 900, color: "#eaedf8", lineHeight: 1.12, marginBottom: 18 }}>
          From{" "}<span style={{ color: "#4f8ef7" }}>Concept</span>{" "}to{" "}
          <span style={{ color: "#34d399" }}>Production</span>
        </h1>
        <p style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)", color: "#9aa3c0", maxWidth: 640, margin: "0 auto 32px", lineHeight: 1.75 }}>
          A complete AI engineering practice sandbox — process flows, interactive model chains,
          hands-on code, and a comprehensive 5-day course reference guide grounded in real production patterns.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/studio" style={{
            display: "flex", alignItems: "center", gap: 9,
            padding: "13px 26px", borderRadius: 10,
            background: "linear-gradient(135deg, #4f8ef7, #818cf8)",
            color: "#fff", fontSize: 15, fontWeight: 700, textDecoration: "none",
            boxShadow: "0 4px 16px rgba(79,142,247,0.35)",
          }}>
            <Zap size={16} /> Open AI Studio
          </Link>
          <a href="#fundamentals" style={{
            display: "flex", alignItems: "center", gap: 9,
            padding: "13px 26px", borderRadius: 10,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)",
            color: "#eaedf8", fontSize: 15, fontWeight: 600, textDecoration: "none",
          }}>
            <BookOpen size={16} /> Course Guide
          </a>
        </div>
      </div>

      {/* ── PROCESS FLOW ──────────────────────────────────────────────── */}
      <section id="process" style={{ marginBottom: 64 }}>
        <SectionHeader icon={<GitBranch size={18}/>} label="End-to-End Process" title="AI Agent Engineering — Full Lifecycle" sub="10 stages from goal definition to production monitoring — click any stage to practice in AI Studio" color="#4f8ef7" />

        <div style={{ background: "#1c1f30", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 14, padding: "20px 16px 24px", overflow: "hidden" }}>
          <FlowRow steps={FLOW_STEPS.slice(0, 5)} />
          {/* Down connector on right */}
          <div style={{ display: "flex", justifyContent: "flex-end", paddingRight: "calc(10% + 24px)", margin: "2px 0" }}>
            <div style={{ width: 2, height: 26, background: "rgba(255,255,255,0.15)" }} />
          </div>
          <FlowRow steps={FLOW_STEPS.slice(5, 10)} reverse />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16 }}>
          {FLOW_STEPS.map(s => (
            <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "#9aa3c0" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
              <span style={{ color: s.color, fontWeight: 700 }}>{s.n}.</span> {s.label}
            </div>
          ))}
        </div>
      </section>

      {/* ── 5-DAY COURSE GUIDE ────────────────────────────────────────── */}
      <section id="fundamentals" style={{ marginBottom: 64 }}>
        <SectionHeader icon={<BookOpen size={18}/>} label="5-Day AI Agents Course — Google / Kaggle" title="Comprehensive Knowledge Guide" sub="Each card contains core concepts, working code, platform deployment setups (GCP, Databricks, Palantir, AWS), whitepaper links, and direct Kaggle notebook links" color="#34d399" />

        <div style={{ marginBottom: 14, padding: "12px 16px", borderRadius: 9, background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.2)", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <BookOpen size={14} style={{ color: "#34d399", flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "#b0bcd4" }}>
            <strong style={{ color: "#34d399" }}>Main course hub:</strong>{" "}
            <a href="https://www.kaggle.com/learn-guide/5-day-agents" target="_blank" rel="noopener noreferrer" style={{ color: "#38bdf8", textDecoration: "none" }}>
              kaggle.com/learn-guide/5-day-agents
            </a>
            {" "}· {" "}
            <a href="https://github.com/google/adk-python" target="_blank" rel="noopener noreferrer" style={{ color: "#38bdf8", textDecoration: "none" }}>
              github.com/google/adk-python
            </a>
            {" "}· Prerequisite: <code style={{ fontSize: 12, background: "rgba(0,0,0,0.3)", padding: "1px 6px", borderRadius: 4 }}>pip install google-adk</code>{" "}+ GOOGLE_API_KEY
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {COURSE_DAYS.map(d => <DayCard key={d.day} d={d} />)}
        </div>

        {/* Summary table */}
        <div style={{ marginTop: 22, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.10)", background: "#1c1f30" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.03)" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#eaedf8" }}>Full Stack Layer Map</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Layer", "Day", "Core Concept", "Practice"].map(h => (
                    <th key={h} style={{ padding: "11px 18px", textAlign: "left", color: "#6b7499", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: "1px solid rgba(255,255,255,0.08)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { layer: "Foundation",       day: 1, concept: "Agentic loop, ReAct, tool use, multi-agent architectures", href: "/studio" },
                  { layer: "Interoperability", day: 2, concept: "MCP (tools/resources/prompts), A2A protocol, transport layers", href: "/studio" },
                  { layer: "Memory",           day: 3, concept: "Sessions, memory taxonomy, ETL pipeline, RAG retrieval", href: "/knowledge" },
                  { layer: "Quality",          day: 4, concept: "Four Pillars, LLM-as-Judge, OTel observability, flywheel", href: "/studio" },
                  { layer: "Production",       day: 5, concept: "CI/CD gates, guardrails, cost optimisation, A2A at scale", href: "/projects" },
                ].map((row, i) => (
                  <tr key={row.layer} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                    <td style={{ padding: "12px 18px", color: "#eaedf8", fontWeight: 700 }}>{row.layer}</td>
                    <td style={{ padding: "12px 18px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 5, background: COURSE_DAYS[row.day-1].color+"18", color: COURSE_DAYS[row.day-1].color, fontSize: 12, fontWeight: 700 }}>Day {row.day}</span>
                    </td>
                    <td style={{ padding: "12px 18px", color: "#b0bcd4", lineHeight: 1.5 }}>{row.concept}</td>
                    <td style={{ padding: "12px 18px" }}>
                      <Link href={row.href} style={{ display: "flex", alignItems: "center", gap: 5, color: "#38bdf8", textDecoration: "none", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
                        Practice <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── ADVANCED & TRENDING ───────────────────────────────────────── */}
      <section id="advanced" style={{ marginBottom: 64 }}>
        <SectionHeader icon={<TrendingUp size={18}/>} label="Advanced Topics" title="Trending Technology & Best Practices" sub="What's shipping in production AI engineering right now — stay current" color="#fb923c" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 14 }}>
          {ADVANCED.map(card => (
            <div key={card.title} style={{
              background: "#1c1f30", border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 12, padding: "20px 22px",
              display: "flex", flexDirection: "column", gap: 10, transition: "border-color 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = card.color + "55")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)")}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                  background: card.color + "18", border: `1px solid ${card.color}33`,
                  display: "flex", alignItems: "center", justifyContent: "center", color: card.color,
                }}>{card.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#eaedf8" }}>{card.title}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 4, background: card.color + "22", color: card.color, letterSpacing: "0.07em", textTransform: "uppercase" }}>{card.tag}</span>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: "#b0bcd4", lineHeight: 1.75, margin: 0 }}>{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── QUICK LAUNCH ──────────────────────────────────────────────── */}
      <section>
        <SectionHeader icon={<Zap size={18}/>} label="Quick Launch" title="Jump Into Practice" sub="All tools and destinations in one place" color="#818cf8" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {[
            { href: "/studio",    icon: <Bot size={17}/>,       color: "#818cf8", label: "AI Studio",      sub: "Chat · Agent · Chain · A2A" },
            { href: "/knowledge", icon: <Database size={17}/>,  color: "#34d399", label: "Knowledge Base",  sub: "Upload · RAG · Embed" },
            { href: "/live-feed", icon: <Activity size={17}/>,  color: "#38bdf8", label: "Live Feed",       sub: "AI news · model releases" },
            { href: "/notebook",  icon: <BookOpen size={17}/>,  color: "#fbbf24", label: "Notebook",        sub: "AI-assisted notes" },
            { href: "/career",    icon: <TrendingUp size={17}/>,color: "#f87171", label: "Career Tracker",  sub: "Skills · roadmap · gaps" },
            { href: "/projects",  icon: <Code2 size={17}/>,     color: "#94a3b8", label: "Projects",        sub: "Builds · prototypes" },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 13,
              padding: "16px 18px", borderRadius: 10,
              background: "#1c1f30", border: "1px solid rgba(255,255,255,0.10)",
              textDecoration: "none", transition: "all 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)"; e.currentTarget.style.background = "#252840"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)"; e.currentTarget.style.background = "#1c1f30"; }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 9, flexShrink: 0,
                background: item.color + "16", border: `1px solid ${item.color}33`,
                display: "flex", alignItems: "center", justifyContent: "center", color: item.color,
              }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#eaedf8" }}>{item.label}</div>
                <div style={{ fontSize: 12, color: "#6b7499", marginTop: 2 }}>{item.sub}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
