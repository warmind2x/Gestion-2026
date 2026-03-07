export interface ImportBudgetResult {
  linesTotal: number;
  linesValid: number;
  linesIgnored: number;
  projectsDetected: number;
  databaseOperations: number;
  capTotal: number;
  expTotal: number;
  processingTimeMs: number;
}
