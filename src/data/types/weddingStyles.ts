// src/types/weddingStyles.ts

export interface AiStyleRule {
  model: string;
  prompt: string;
}

export interface PhotoRule {
  width: number;
  height: number;
  x: number;
  y: number;
}

export interface FontRule {
  family: string;
  file: string;
}

export interface FontRules {
  [key: string]: FontRule;
}

export interface TextElementRule {
  x?: number;
  y: number;
  fontSize: number;
  color: string;
  letterSpacing?: number;
  textTransform?: 'uppercase' | 'none' | 'lowercase' | 'capitalize';
  fontWeight?: 'normal' | 'bold';
  content?: string;
  fontFamily?: string;
}

export interface LineRule {
  y1: number;
  y2: number;
  stroke: string;
  strokeWidth: number;
}

export interface LineRules {
  [key: string]: LineRule;
}

export interface LayoutRules {
  [key: string]: TextElementRule;
}

export interface StyleRules {
  fonts: FontRules;
  elements: LayoutRules;
  lines?: LineRules;
  photo?: PhotoRule;
  aiStyle?: AiStyleRule;
  formatting?: {
    dateFormat?: Intl.DateTimeFormatOptions;
    dateSeparator?: string;
    dateCase?: 'uppercase' | 'none';
    timeFormat?: 'ampm' | 'words';
  };
}