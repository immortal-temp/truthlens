export interface ExtractedEntities {
  main_claim: string;
  people: string[];
  organizations: string[];
  locations: string[];
  events: string[];
  amounts: string[];
  dates: string[];
  times: string[];
  countries: string[];
  category: string;
  important_keywords: string[];
}

export interface NormalizedArticle {
  title: string;
  description: string;
  url: string;
  source_name: string;
  published_at: string;
  content: string;
  query_used: string;
  credibility_tier?: 'High' | 'Medium' | 'Unknown';
  credibility_type?: string;
  semantic_similarity?: number;
  evidence_classification?: 'Supporting' | 'Partially Supporting' | 'Contradicting' | 'Neutral' | 'Unrelated';
  cluster_id?: number;
  is_primary_in_cluster?: boolean;
}

export interface ScoreBreakdown {
  source_agreement: number;
  date_consistency: number;
  semantic_similarity: number;
  source_quality: number;
  cross_source_agreement: number;
  contradictory_penalty: number;
  total_score: number;
}

export interface DateAnalysisResult {
  user_date: string;
  extracted_event_dates: string[];
  article_publish_dates: string[];
  is_date_consistent: boolean;
  is_old_news_reused: boolean;
  warning_message?: string;
  explanation: string;
}

export interface SourceAnalysisSummary {
  total_articles_retrieved: number;
  unique_article_groups: number;
  distinct_sources_count: number;
  supporting_count: number;
  contradicting_count: number;
  neutral_count: number;
  high_credibility_count: number;
  medium_credibility_count: number;
  unknown_credibility_count: number;
}

export interface TimelineEvent {
  date: string;
  headline: string;
  description: string;
  source_name: string;
  url?: string;
}

export interface AIReportResponse {
  executive_summary: string;
  what_happened: string[];
  key_people: string[];
  organizations: string[];
  locations: string[];
  important_numbers: string[];
  timeline: TimelineEvent[];
  supporting_evidence_summary: string;
  contradicting_evidence_summary: string;
  date_analysis: string;
  misinformation_type: string;
  final_assessment: string;
  limitations: string[];
}

export interface VerificationResult {
  id: string;
  claim: string;
  input_date: string;
  input_time?: string;
  language: string;
  category: string;
  extracted_entities: ExtractedEntities;
  queries_used: string[];
  articles: NormalizedArticle[];
  score_breakdown: ScoreBreakdown;
  evidence_score: number;
  verdict: 'LIKELY_TRUE' | 'PARTIALLY_TRUE' | 'MISLEADING' | 'LIKELY_FALSE' | 'UNVERIFIED' | 'INSUFFICIENT_EVIDENCE';
  misinformation_type: string;
  date_analysis: DateAnalysisResult;
  source_analysis: SourceAnalysisSummary;
  ai_report?: AIReportResponse;
  llm_provider_used: string;
  is_demo_mode: boolean;
  created_at: string;
  expires_at?: string;
}

export interface DashboardStats {
  total_active_verifications: number;
  retention_window_minutes: number;
  average_evidence_score: number;
  verdict_distribution: Record<string, number>;
  category_distribution: Record<string, number>;
  score_distribution: Record<string, number>;
  is_recent_only_notice: string;
}
