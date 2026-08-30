export type RoutePath = 
  | '/'
  | '/docs'
  | '/docs/quickstart'
  | '/docs/claude-code'
  | '/docs/live'
  | '/docs/replay'
  | '/docs/mcp'
  | '/docs/architecture'
  | '/docs/evaluation'
  | '/docs/privacy'
  | '/docs/limitations';

export interface DocSection {
  id: string;
  title: string;
  category: 'Getting Started' | 'Core Concepts' | 'Integration' | 'Reference';
  path: RoutePath;
  summary: string;
  content: DocContent;
}

export interface DocContent {
  title: string;
  description: string;
  lastUpdated: string;
  breadcrumbs: string[];
  sections: {
    title: string;
    id: string;
    body: string[];
    codeBlock?: {
      language: string;
      code: string;
      filename?: string;
    };
    callout?: {
      type: 'info' | 'warning' | 'tip' | 'note';
      text: string;
    };
  }[];
  relatedLinks?: {
    title: string;
    path: RoutePath;
    desc: string;
  }[];
}

export interface TimelineEvent {
  timestamp: string;
  timeSec: number;
  type: 'network' | 'console' | 'dom' | 'navigation' | 'query' | 'git' | 'patch';
  title: string;
  status?: number | string;
  details: string;
  isFailure?: boolean;
  isHistoricalContext?: boolean;
  codeSnippet?: string;
  sourceFile?: string;
  sourceLine?: number;
  payload?: Record<string, unknown>;
}

export interface McpToolDefinition {
  name: string;
  description: string;
  parameters: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  exampleCall: string;
  exampleResponse: string;
}

export interface EvaluationItem {
  id: string;
  title: string;
  category: string;
  reproductionType: string;
  observedBug: string;
  historicalRootCause: string;
  agentOutcome: string;
  verifiedStatus: 'PASSED' | 'VERIFIED';
}
