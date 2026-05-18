export interface ExecutionResult {
  success: boolean;
  output: string;
  tokensUsed?: number;
  durationMs: number;
  metadata?: Record<string, any>;
}

export interface ExecutionOptions {
  timeout?: number;       // ms, default 60000
  maxTokens?: number;
  temperature?: number;
  onProgress?: (message: string) => void;
}

export interface ToolExecutor {
  toolId: string;
  execute(prompt: string, options?: ExecutionOptions): Promise<ExecutionResult>;
  checkHealth(): Promise<boolean>;
}
