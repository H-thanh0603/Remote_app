export type {
  Tool,
  ToolStatus,
  Task,
  TaskStatus,
  RoutingSuggestion,
} from '@remote-app/shared';

export type MessageType = 'user' | 'system' | 'suggestion' | 'result' | 'error';

export interface ChatMessageData {
  id: string;
  type: MessageType;
  content: string;
  timestamp: string;
  metadata?: {
    taskId?: string;
    suggestion?: import('@remote-app/shared').RoutingSuggestion;
    tool?: import('@remote-app/shared').Tool;
  };
}
