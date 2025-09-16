import { Component, OnInit } from '@angular/core';
import PivotGridDataSource from 'devextreme/ui/pivot_grid/data_source';

type Guid = string;

/* ===== Orijinal tablolar ===== */
interface City   { id: Guid; code: number; name: string; }
interface Hosp   { id: Guid; code: number; name: string; cityId: Guid; }
interface Provision { id: Guid; code: string; hospitalId: Guid; }

interface Report {
  id: Guid;
  reportstate: 'Onay' | 'Açıklama' | 'Manuel Açıklama';
  provisionId: Guid;
  createdAt: Date;
  reportCode: number;
}

interface Diagnosis   { id: Guid; code: string;  name: string; }

interface ReportDiagnosis {
  id: Guid;
  reportId: Guid;
  reportCode: number;
  diagnosisId: Guid;
  diagnosisName: string;
}

/* ===== Pivot'a giden TEK TABLO ===== */
interface FactReport {
  reportId: string;
  reportCode: number;
  reportCreated: Date;
  reportstate: 'Onay' | 'Açıklama' | 'Manuel Açıklama';

  cityId: string;      cityCode: number;      cityName: string;
  hospitalId: string;  hospitalCode: number;  hospitalName: string;

  provisionId: string; provisionCode: string;

  diagnosisId: string; diagnosisCode: string; diagnosisName: string;
}

/* UI kontrolleri */
type RowMode      = 'City' | 'Hospital' | 'CityHospital';
type CriteriaType = 'None' | 'Diagnosis' | 'ReportState' | 'DiagAndState';
type PercentBasis = 'row' | 'column' | 'grand';
type ColHierarchy = 'DiagThenState' | 'StateThenDiag';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {

  /* ---- Tarih ---- */
  startDateStr = '';
  endDateStr   = '';

  /* ---- Eksen/Kriter ---- */
  rowMode: RowMode = 'CityHospital';
  criteriaType: CriteriaType = 'Diagnosis';
  percentBasis: PercentBasis = 'row';           // % Satır varsayılan
  colHierarchy: ColHierarchy = 'DiagThenState'; // Tanı → Durum varsayılan

  /* ---- Slicer panelleri (başlangıçta kapalı) ---- */
  openRowSlicers = false;
  openColSlicers = false;

  /* ---- Lookuplar ---- */
  cities: City[] = [];
  hospitals: Hosp[] = [];
  diagnoses: Diagnosis[] = [];

  /* ---- Slicers ---- */
  selectedCityIds: string[] = [];
  selectedHospitalIds: string[] = [];
  selectedDiagnosisIds: string[] = [];
  selectedStates: Array<'Onay'|'Açıklama'|'Manuel Açıklama'> = [];

  /* ---- Data ---- */
  private factAll: FactReport[] = [];
  factActive: FactReport[] = [];

  /* ---- Pivot DS ---- */
  pivotDs: any = null;

  /* isim map’leri (filter için isim lazım) */
  private cityById = new Map<string, City>();
  private hospById = new Map<string, Hosp>();
  private diagById = new Map<string, Diagnosis>();

  /* ========== Lifecycle ========== */
  ngOnInit(): void {
    const mock = this.generateMock(42);

    this.cities    = mock.cities;
    this.hospitals = mock.hospitals;
    this.diagnoses = mock.diagnoses;

    this.cityById = new Map(this.cities.map(c => [c.id, c] as [string, City]));
    this.hospById = new Map(this.hospitals.map(h => [h.id, h] as [string, Hosp]));
    this.diagById = new Map(this.diagnoses.map(d => [d.id, d] as [string, Diagnosis]));

    // tüm tabloyu tek “FactReport” haline getir
    this.factAll = this.buildFactTable(
      mock.cities, mock.hospitals, mock.provisions,
      mock.reports, mock.diagnoses, mock.reportDiagnoses
    );

    this.initDefaultDates();
  }

  /* ========== Mock ========== */
  private seed = 42;
  private rnd(): number { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 0x100000000; }
  private pick<T>(arr: T[]): T { return arr[Math.floor(this.rnd() * arr.length)]!; }
  private between(min: number, max: number){ return Math.floor(this.rnd()*(max-min+1))+min; }
  private guid(prefix=''){ const h=()=>Math.floor(this.rnd()*0xffffffff).toString(16).padStart(8,'0'); return `${prefix}${h()}-${h().slice(0,4)}-${h().slice(0,4)}-${h().slice(0,4)}-${h()}`; }

  private generateMock(seed=42): {
    cities: City[]; hospitals: Hosp[]; provisions: Provision[];
    reports: Report[]; diagnoses: Diagnosis[]; reportDiagnoses: ReportDiagnosis[];
  } {
    this.seed = seed>>>0;

    const cityNames = ['İstanbul','Ankara','İzmir','Bursa','Antalya','Kocaeli','Konya','Gaziantep','Adana','Mersin','Diyarbakır','Kayseri','Samsun','Trabzon','Eskişehir'];
    const cities: City[] = cityNames.map((n,i)=>({ id:this.guid('C-'), code:100+i, name:n }));

    const types = ['GATA','Şehir Hastanesi','Acıbadem','Askeri Hastane','Şehir Hastanesi 2'];
    const hospitals: Hosp[] = [];
    let hc = 500;
    for (const c of cities) for (let k=0;k<5;k++){
      hospitals.push({ id:this.guid('H-'), code:hc++, name:`${c.name} ${types[k]}`, cityId:c.id });
    }

    const provisions: Provision[] = [];
    for (const h of hospitals) for (let i=1;i<=15;i++){
      provisions.push({ id:this.guid('PRV-'), code:`PRV-${h.code}-${i.toString().padStart(4,'0')}`, hospitalId:h.id });
    }

    const diagCatalog: Array<[string,string]> = [
      ['J11','Grip'], ['I10','Primer hipertansiyon'], ['K52','Enterit ve kolit'],
      ['E11','Tip 2 Diyabet'], ['J20','Akut bronşit'], ['M54','Dorsalji'],
      ['N39','Üriner sistem enf.'], ['L70','Akne'], ['G43','Migren'], ['K21','GÖRH']
    ];
    const diagnoses: Diagnosis[] = diagCatalog.map((d,i)=>({ id:`D-${(i+1).toString().padStart(2,'0')}`, code:d[0], name:d[1] }));

    const today = new Date();
    let running = 20250000;
    const reports: Report[] = [];
    const reportDiagnoses: ReportDiagnosis[] = [];

    const provByHospital: {[hid:string]: Provision[]} = {};
    for (const p of provisions){ (provByHospital[p.hospitalId]||(provByHospital[p.hospitalId]=[])).push(p); }

    for (const h of hospitals){
      const provs = provByHospital[h.id];
      for (let i=0;i<15;i++){
        const p = provs[i];
        const back = this.between(0, 180);
        const createdAt = new Date(today.getTime() - back*86400000);
        createdAt.setHours(8 + this.between(0,9), this.between(0,59), 0, 0);

        const r = this.rnd();
        const state: Report['reportstate'] = r < 0.55 ? 'Onay' : (r < 0.80 ? 'Açıklama' : 'Manuel Açıklama');

        const report: Report = {
          id: this.guid('RPT-'),
          reportstate: state,
          provisionId: p.id,
          createdAt,
          reportCode: ++running
        };
        reports.push(report);

        // rapor başına tek tanı
        const d = this.pick(diagnoses);
        reportDiagnoses.push({
          id: this.guid('RDX-'),
          reportId: report.id,
          reportCode: report.reportCode,
          diagnosisId: d.id,
          diagnosisName: d.name
        });
      }
    }

    return { cities, hospitals, provisions, reports, diagnoses, reportDiagnoses };
  }

  /* ====== tabloları tek tabloya birleştir ====== */
  private buildFactTable(
    cities: City[], hospitals: Hosp[], provisions: Provision[],
    reports: Report[], diagnoses: Diagnosis[], rdx: ReportDiagnosis[]
  ): FactReport[] {

    const cityById: {[id:string]: City} = {}; for (const c of cities) cityById[c.id] = c;
    const hospById: {[id:string]: Hosp} = {}; for (const h of hospitals) hospById[h.id] = h;
    const provById: {[id:string]: Provision} = {}; for (const p of provisions) provById[p.id] = p;
    const diagByReportId: {[rid:string]: ReportDiagnosis} = {}; for (const x of rdx) diagByReportId[x.reportId] = x;

    const out: FactReport[] = [];
    for (const r of reports){
      const p = provById[r.provisionId];
      const h = hospById[p.hospitalId];
      const c = cityById[h.cityId];
      const d = diagByReportId[r.id];
      const diag = diagnoses.find(xx => xx.id === d.diagnosisId)!;

      out.push({
        reportId: r.id,
        reportCode: r.reportCode,
        reportCreated: r.createdAt,
        reportstate: r.reportstate,

        cityId: c.id,      cityCode: c.code,      cityName: c.name,
        hospitalId: h.id,  hospitalCode: h.code,  hospitalName: h.name,

        provisionId: p.id, provisionCode: p.code,

        diagnosisId: d.diagnosisId, diagnosisCode: diag.code, diagnosisName: d.diagnosisName
      });
    }
    return out;
  }

  /* ====== Hastane listesi (UI) — şehir seçimine göre daraltılır ====== */
  hospitalsForUI(): Hosp[] {
    if (!this.selectedCityIds.length) return this.hospitals;
    const s = new Set(this.selectedCityIds);
    return this.hospitals.filter(h => s.has(h.cityId));
  }

  /* ====== Tarih ====== */
  private pad2(n: number){ return n<10 ? '0'+n : ''+n; }
  private toInputDate(d: Date){ return d.getFullYear() + '-' + this.pad2(d.getMonth()+1) + '-' + this.pad2(d.getDate()); }
  private parseStart(s: string){ const a=s.split('-'); return new Date(+a[0], +a[1]-1, +a[2], 0,0,0,0); }
  private parseEnd(s: string){ const a=s.split('-'); return new Date(+a[0], +a[1]-1, +a[2], 23,59,59,999); }
  private initDefaultDates(): void {
    const end = new Date(); const start = new Date(end.getTime() - 30*86400000);
    this.startDateStr = this.toInputDate(start);
    this.endDateStr   = this.toInputDate(end);
  }

  onFetch(): void {
    if (!this.startDateStr || !this.endDateStr){ this.factActive=[]; this.pivotDs=null; return; }
    const s = this.parseStart(this.startDateStr).getTime();
    const e = this.parseEnd(this.endDateStr).getTime();

    this.factActive = this.factAll.filter(r => {
      const t = r.reportCreated.getTime();
      return t>=s && t<=e;
    });

    this.updatePivot();
  }

  /* ====== checkbox helpers ====== */
  isSelected(arr: any[], id: any){ return arr.indexOf(id) !== -1; }
  private toggleIn<T>(arr: T[], v: T): T[] {
    const i = arr.indexOf(v);
    return i >= 0 ? arr.filter(x => x !== v) : arr.concat(v);
  }
  toggleCity(id: string){ this.selectedCityIds = this.toggleIn(this.selectedCityIds, id); this.applyFilters(); }
  toggleHospital(id: string){ this.selectedHospitalIds = this.toggleIn(this.selectedHospitalIds, id); this.applyFilters(); }
  toggleDiagnosis(id: string){ this.selectedDiagnosisIds = this.toggleIn(this.selectedDiagnosisIds, id); this.applyFilters(); }
  toggleState(name: 'Onay'|'Açıklama'|'Manuel Açıklama'){ this.selectedStates = this.toggleIn(this.selectedStates, name); this.applyFilters(); }

  /* ====== Eksen/Kriter/% + panel açma ====== */
  setRowMode(m: RowMode){
    this.rowMode = m;
    this.openRowSlicers = true;   // Satır panelini otomatik aç
    this.updatePivot();
  }
  setCriteriaType(c: CriteriaType){
    this.criteriaType = c;
    this.openColSlicers = true;   // Sütun panelini otomatik aç
    this.updatePivot();
  }
  setPercent(b: PercentBasis){ this.percentBasis = b; this.updatePivot(); }
  setColHierarchy(h: ColHierarchy){ this.colHierarchy = h; this.updatePivot(); }

  /* ====== Pivot alanları ====== */
  private buildFields(): any[] {
    const fields: any[] = [];

    // ROW
    if (this.rowMode === 'City') {
      fields.push({ dataField: 'cityName', caption: 'Şehir', area: 'row' });
    } else if (this.rowMode === 'Hospital') {
      fields.push({ dataField: 'hospitalName', caption: 'Hastane', area: 'row' });
    } else {
      fields.push({ dataField: 'cityName', caption: 'Şehir', area: 'row' });
      fields.push({ dataField: 'hospitalName', caption: 'Hastane', area: 'row' });
    }

    // COLUMN
    if (this.criteriaType === 'Diagnosis') {
      fields.push({ dataField: 'diagnosisName', caption: 'Tanı', area: 'column' });
    } else if (this.criteriaType === 'ReportState') {
      fields.push({ dataField: 'reportstate', caption: 'Rapor Durumu', area: 'column' });
    } else if (this.criteriaType === 'DiagAndState') {
      if (this.colHierarchy === 'DiagThenState') {
        fields.push({ dataField: 'diagnosisName', caption: 'Tanı', area: 'column' });
        fields.push({ dataField: 'reportstate',  caption: 'Rapor Durumu', area: 'column' });
      } else {
        fields.push({ dataField: 'reportstate',  caption: 'Rapor Durumu', area: 'column' });
        fields.push({ dataField: 'diagnosisName', caption: 'Tanı', area: 'column' });
      }
    }

    // DATA (count + %)
    fields.push({
      caption: 'Rapor (count)',
      area: 'data',
      dataField: 'reportId',
      summaryType: 'count'
    });

    const modeMap: {[k in PercentBasis]: 'percentOfRowTotal'|'percentOfColumnTotal'|'percentOfGrandTotal'} = {
      row: 'percentOfRowTotal',
      column: 'percentOfColumnTotal',
      grand: 'percentOfGrandTotal'
    };

    fields.push({
      caption: 'Oran',
      area: 'data',
      dataField: 'reportId',
      summaryType: 'count',
      summaryDisplayMode: modeMap[this.percentBasis],
      format: { type: 'percent', precision: 2 }
    });

    return fields;
  }

  private updatePivot(): void {
    if (!this.factActive.length) { this.pivotDs = null; return; }
    const fields = this.buildFields();

    this.pivotDs = new PivotGridDataSource({
      fields,
      store: this.factActive
    });

    // DS hazırlandıktan sonra filtreleri bind et
    setTimeout(() => this.applyFilters());
  }

  private applyFilters(): void {
    if (!this.pivotDs) return;

    const names = <T extends {id:string; name:string}>(ids: string[], map: Map<string,T>) =>
      ids.map(id => map.get(id)).filter(Boolean).map(x => (x as T).name);

    const cityNames = names(this.selectedCityIds, this.cityById);
    const hospNames = names(this.selectedHospitalIds, this.hospById);
    const diagNames = names(this.selectedDiagnosisIds, this.diagById);

    this.pivotDs.field('cityName', {
      filterType: cityNames.length ? 'include' : undefined,
      filterValues: cityNames.length ? cityNames : undefined
    });
    this.pivotDs.field('hospitalName', {
      filterType: hospNames.length ? 'include' : undefined,
      filterValues: hospNames.length ? hospNames : undefined
    });
    this.pivotDs.field('diagnosisName', {
      filterType: diagNames.length ? 'include' : undefined,
      filterValues: diagNames.length ? diagNames : undefined
    });
    this.pivotDs.field('reportstate', {
      filterType: this.selectedStates.length ? 'include' : undefined,
      filterValues: this.selectedStates.length ? this.selectedStates : undefined
    });

    this.pivotDs.reload();
  }
}
