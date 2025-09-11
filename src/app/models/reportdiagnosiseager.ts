export class ReportDiagnosisEager {
  id?: string;

  reportId?: string;
  reportCode?: number;

  diagnosisId?: string;
  diagnosisCode?: string;
  diagnosisName?: string;

  provisionId?: string;
  provisionCode?: number;

  hospitalId?: string;
  hospitalCode?: number;
  hospitalName?: string;

  cityId?: string;
  cityCode?: number;
  cityName?: string;

  reportCreated?: Date; // API string dönerse new Date(...) ile parse etmen gerekebilir
}