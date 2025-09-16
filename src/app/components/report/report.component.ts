import { Component, OnInit } from '@angular/core';

/* ========= Şema tipleri ========= */
type Guid = string;

interface City   { id: Guid; code: number; name: string; }
interface Hosp   { id: Guid; code: number; name: string; cityId: Guid; }
interface Provision { id: Guid; code: string; hospitalId: Guid; }

interface Report {
  id: Guid;
  reportstate: string;     // 'Onay' | 'Açıklama' | 'Manuel Açıklama'
  provisionId: Guid;
  approveuserId?: Guid;
  createdAt: Date;
  reportCode: number;
}

interface Diagnosis   { id: Guid; code: string; name: string; }

interface ReportDiagnosis {
  id: Guid;
  reportId: Guid;
  reportCode: number;
  diagnosisId: Guid;
  diagnosisName: string;
}

/* ========= Görünüm satırı ========= */
interface ReportRow {
  reportId: string;
  reportCode: number;

  cityId: string;      cityName: string;
  hospitalId: string;  hospitalName: string;

  diagnosisId: string; diagnosisName: string;

  reportstate: string;
  reportCreated: Date;
}

/* ========= Sonuç modelleri ========= */
type RowMode = 'City' | 'Hospital' | 'CityHospital';
type CriteriaType = 'None' | 'Diagnosis' | 'ReportState';

interface ListRow {
  label: string;
  count: number;
  percent: number;
}

interface Pivot {
  rowKeys: string[];
  colKeys: string[];
  counts: number[][];
  percents: number[][];
  rowTotals: number[];
  grandTotal: number;
  rowShare: number[];
}

/* Şehir → Hastane görünümü için “rowspan” kullanacak satırlar */
interface PivotCHRow {
  city: string;
  showCity: boolean;
  cityRowspan: number;
  hospital: string;
  counts: number[];
  percents: number[];
  total: number;
  share: number;
}
interface PivotCH {
  colKeys: string[];
  displayRows: PivotCHRow[];
  grandTotal: number; // tüm hastane (leaf) toplamı
}

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {

  /* ---------- Tarih ---------- */
  startDateStr = '';
  endDateStr   = '';

  /* ---------- Eksenler ---------- */
  rowMode: RowMode = 'CityHospital';       // Şehir, Hastane, veya Şehir→Hastane
  criteriaType: CriteriaType = 'Diagnosis';

  /* ---------- Kolon kontrolü ---------- */
  colOnlySelected = true;

  /* ---------- Lookuplar ---------- */
  cities: City[] = [];
  hospitals: Hosp[] = [];
  diagnoses: Diagnosis[] = [];

  /* ---------- Seçimler ---------- */
  selectedCityIds: string[] = [];
  selectedHospitalIds: string[] = [];
  selectedDiagnosisIds: string[] = [];
  selectedStates: string[] = []; // 'Onay' | 'Açıklama' | 'Manuel Açıklama'

  /* ---------- Arama kutuları ---------- */
  cityQ = '';
  hospitalQ = '';
  diagQ = '';

  /* ---------- Veri ---------- */
  private allRows: ReportRow[] = [];
  activeRows: ReportRow[] = [];

  /* ---------- Sonuç ---------- */
  listRows: ListRow[] = [];
  pivot: Pivot | null = null;     // City/Hospital modları için
  pivotCH: PivotCH | null = null; // CityHospital (rowspan) için
  totalCount = 0;

  /* ====================== Lifecycle ====================== */
  ngOnInit(): void {
    const mock = this.generateMock(42);
    this.cities = mock.cities;
    this.hospitals = mock.hospitals;
    this.diagnoses = mock.diagnoses;

    this.allRows = this.buildRows(
      mock.cities, mock.hospitals, mock.provisions,
      mock.reports, mock.reportDiagnoses
    );

    this.initDefaultDates();
  }

  /* ====================== Mock ====================== */
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
    for (let c of cities) for (let k=0;k<5;k++){
      hospitals.push({ id:this.guid('H-'), code:hc++, name:`${c.name} ${types[k]}`, cityId:c.id });
    }

    const provisions: Provision[] = [];
    for (let h of hospitals) for (let i=1;i<=15;i++){
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
    for (let p of provisions){ (provByHospital[p.hospitalId]||(provByHospital[p.hospitalId]=[])).push(p); }

    for (let h of hospitals){
      const provs = provByHospital[h.id];
      for (let i=0;i<15;i++){
        const p = provs[i];
        const back = this.between(0, 180);
        const createdAt = new Date(today.getTime() - back*86400000);
        createdAt.setHours(8 + this.between(0,9), this.between(0,59), 0, 0);

        const r = this.rnd();
        const state = r < 0.55 ? 'Onay' : (r < 0.80 ? 'Açıklama' : 'Manuel Açıklama');

        const report: Report = {
          id: this.guid('RPT-'),
          reportstate: state,
          provisionId: p.id,
          createdAt,
          reportCode: ++running
        };
        reports.push(report);

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

  private buildRows(
    cities: City[], hospitals: Hosp[],
    provisions: Provision[], reports: Report[],
    rdx: ReportDiagnosis[]
  ): ReportRow[] {
    const cityById: {[id:string]: City} = {}; for (let c of cities) cityById[c.id] = c;
    const hospById: {[id:string]: Hosp} = {}; for (let h of hospitals) hospById[h.id] = h;
    const provById: {[id:string]: Provision} = {}; for (let p of provisions) provById[p.id] = p;

    const diagByReportId: {[rid:string]: ReportDiagnosis} = {}; for (let x of rdx) diagByReportId[x.reportId] = x;

    const out: ReportRow[] = [];
    for (let r of reports){
      const p = provById[r.provisionId];
      const h = hospById[p.hospitalId];
      const c = cityById[h.cityId];
      const d = diagByReportId[r.id];
      out.push({
        reportId: r.id,
        reportCode: r.reportCode,
        cityId: c.id, cityName: c.name,
        hospitalId: h.id, hospitalName: h.name,
        diagnosisId: d.diagnosisId, diagnosisName: d.diagnosisName,
        reportstate: r.reportstate,
        reportCreated: r.createdAt
      });
    }
    return out;
  }

  /* ====================== Tarih & Getir ====================== */
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
    if (!this.startDateStr || !this.endDateStr){
      this.activeRows=[]; this.listRows=[]; this.pivot=null; this.pivotCH=null; this.totalCount=0; return;
    }
    const s = this.parseStart(this.startDateStr).getTime();
    const e = this.parseEnd(this.endDateStr).getTime();

    let rows = this.allRows.filter(r => {
      const t = r.reportCreated.getTime();
      return t>=s && t<=e;
    });

    if (this.selectedCityIds.length){
      const set = new Set(this.selectedCityIds);
      rows = rows.filter(r => set.has(r.cityId));
    }
    if (this.selectedHospitalIds.length){
      const set = new Set(this.selectedHospitalIds);
      rows = rows.filter(r => set.has(r.hospitalId));
    }

    this.activeRows = rows;
    this.run();
  }

  /* ====================== Checkbox çoklu seçim ====================== */
  isSelected(arr: string[], id: string){ return arr.indexOf(id) !== -1; }
  private toggleIn(arr: string[], id: string): string[] {
    const i = arr.indexOf(id);
    return i >= 0 ? arr.filter(x => x !== id) : arr.concat(id);
  }
  toggleCity(id: string){
    this.selectedCityIds = this.toggleIn(this.selectedCityIds, id);
    if (this.selectedCityIds.length){
      const allowed = new Set(this.hospitals.filter(h => this.selectedCityIds.indexOf(h.cityId)!==-1).map(h => h.id));
      this.selectedHospitalIds = this.selectedHospitalIds.filter(hid => allowed.has(hid));
    }
    this.run();
  }
  toggleHospital(id: string){ this.selectedHospitalIds = this.toggleIn(this.selectedHospitalIds, id); this.run(); }
  toggleDiagnosis(id: string){ this.selectedDiagnosisIds = this.toggleIn(this.selectedDiagnosisIds, id); this.run(); }
  toggleState(name: string){ this.selectedStates = this.toggleIn(this.selectedStates, name); this.run(); }

  /* ====================== Liste filtreleri (arama) ====================== */
  get citiesShown(): City[] {
    const q = this.cityQ.trim().toLowerCase();
    return q ? this.cities.filter(c => c.name.toLowerCase().includes(q)) : this.cities;
  }
  get hospitalsShown(): Hosp[] {
    const q = this.hospitalQ.trim().toLowerCase();
    let list = this.hospitals;
    if (this.selectedCityIds.length){
      const s = new Set(this.selectedCityIds);
      list = list.filter(h => s.has(h.cityId));
    }
    return q ? list.filter(h => h.name.toLowerCase().includes(q)) : list;
  }
  get diagnosesShown(): Diagnosis[] {
    const q = this.diagQ.trim().toLowerCase();
    return q ? this.diagnoses.filter(d => d.name.toLowerCase().includes(q)) : this.diagnoses;
  }

  /* ====================== Yardımcı etiketler ====================== */
  private labelRegionSimple(r: ReportRow): string {
    return this.rowMode === 'Hospital' ? r.hospitalName : r.cityName;
  }
  private labelCriteria(r: ReportRow): string {
    return this.criteriaType === 'Diagnosis' ? r.diagnosisName : r.reportstate;
  }

  /* ====================== Hesap ====================== */
  run(): void {
    const data = this.activeRows;

    if (!data.length){
      this.listRows=[]; this.pivot=null; this.pivotCH=null; this.totalCount=0; return;
    }

    /* --- Kriter yoksa tek boyutlu liste --- */
    if (this.criteriaType === 'None'){
      const map: {[k:string]: {[rid:string]: true}} = {};
      for (let i=0;i<data.length;i++){
        const rk = this.labelRegionSimple(data[i]);
        (map[rk]||(map[rk]={}))[data[i].reportId] = true;
      }
      const out: ListRow[] = [];
      let grand = 0;
      for (const k in map){
        const cnt = Object.keys(map[k]).length;
        grand += cnt;
        out.push({ label:k, count:cnt, percent: 0 });
      }
      for (let i=0;i<out.length;i++){
        out[i].percent = grand ? Math.round(10000 * out[i].count / grand) / 100 : 0;
      }
      out.sort((a,b)=> (b.count - a.count) || a.label.localeCompare(b.label,'tr'));
      this.listRows = out; this.pivot=null; this.pivotCH=null; this.totalCount = grand;
      return;
    }

    /* --- Kriter var: kolon anahtarlarını hazırla --- */
    const colSet: {[k:string]: true} = {};
    for (let i=0;i<data.length;i++){
      colSet[this.labelCriteria(data[i])] = true;
    }
    let colKeys = Object.keys(colSet).sort((a,b)=>a.localeCompare(b,'tr'));
    if (this.colOnlySelected){
      if (this.criteriaType === 'Diagnosis' && this.selectedDiagnosisIds.length){
        const m: {[id:string]: string} = {}; for (let d of this.diagnoses) m[d.id]=d.name;
        const picked = this.selectedDiagnosisIds.map(id => m[id]).filter(Boolean);
        if (picked.length) colKeys = picked;
      }
      if (this.criteriaType === 'ReportState' && this.selectedStates.length){
        colKeys = this.selectedStates.slice(0);
      }
    }

    if (this.rowMode === 'CityHospital') {
      this.pivot = null;
      this.pivotCH = this.computePivotCityHospital(data, colKeys);
      this.totalCount = this.pivotCH.grandTotal;
      this.listRows = [];
      return;
    }

    // Basit pivot: Şehir ya da Hastane
    const rowSet: {[k:string]: true} = {};
    const cell: {[rk:string]: {[ck:string]: {[rid:string]: true}}} = {};
    for (let i=0;i<data.length;i++){
      const r = data[i];
      const rk = this.labelRegionSimple(r);
      const ck = this.labelCriteria(r);
      rowSet[rk] = true;
      (cell[rk]||(cell[rk]={}))[ck] = cell[rk][ck] || {};
      cell[rk][ck][r.reportId] = true;
    }

    const rowKeys = Object.keys(rowSet).sort((a,b)=>a.localeCompare(b,'tr'));
    const counts: number[][] = [];
    const percents: number[][] = [];
    const rowTotals: number[] = [];

    for (let ri=0; ri<rowKeys.length; ri++){
      const rk = rowKeys[ri];
      let total = 0;
      const rowCounts: number[] = [];
      for (let ci=0; ci<colKeys.length; ci++){
        const ck = colKeys[ci];
        const bucket = cell[rk] && cell[rk][ck];
        const cnt = bucket ? Object.keys(bucket).length : 0;
        rowCounts.push(cnt);
        total += cnt;
      }
      rowTotals.push(total);
      counts.push(rowCounts);
      const rowPcts = rowCounts.map(c => total ? Math.round(10000 * c / total) / 100 : 0);
      percents.push(rowPcts);
    }

    const grandTotal = rowTotals.reduce((s,n)=>s+n,0);
    const rowShare = rowTotals.map(t => grandTotal ? Math.round(10000 * t / grandTotal) / 100 : 0);

    this.pivot = { rowKeys, colKeys, counts, percents, rowTotals, grandTotal, rowShare };
    this.pivotCH = null;
    this.totalCount = grandTotal;
    this.listRows = [];
  }

  /* === Şehir → Hastane (rowspan) pivot hesap === */
  private computePivotCityHospital(data: ReportRow[], colKeys: string[]): PivotCH {
    // gruplar
    const hospitalsByCity: {[city:string]: string[]} = {};
    const countsByHospital: {[hosp:string]: {[ck:string]: number}} = {};

    for (let i=0;i<data.length;i++){
      const r = data[i];
      const city = r.cityName;
      const hosp = r.hospitalName;
      const ck   = this.labelCriteria(r);

      (hospitalsByCity[city]||(hospitalsByCity[city]=[]));
      if (hospitalsByCity[city].indexOf(hosp)===-1) hospitalsByCity[city].push(hosp);

      (countsByHospital[hosp]||(countsByHospital[hosp]={}));
      countsByHospital[hosp][ck] = (countsByHospital[hosp][ck]||0) + 1;
    }

    // sıralama
    const cityNames = Object.keys(hospitalsByCity).sort((a,b)=>a.localeCompare(b,'tr'));
    for (const c of cityNames) hospitalsByCity[c].sort((a,b)=>a.localeCompare(b,'tr'));

    // önce tüm hastane toplamlarını hesapla, grandTotal bul
    const hospitalTotals: {[hosp:string]: number} = {};
    let grandTotal = 0;
    for (const c of cityNames){
      for (const h of hospitalsByCity[c]){
        const rowCounts = colKeys.map(ck => countsByHospital[h]?.[ck] || 0);
        const tot = rowCounts.reduce((s,n)=>s+n,0);
        hospitalTotals[h] = tot;
        grandTotal += tot;
      }
    }

    const displayRows: PivotCHRow[] = [];
    for (const city of cityNames){
      const hosps = hospitalsByCity[city];
      const rowspan = Math.max(1, hosps.length);
      for (let idx=0; idx<hosps.length; idx++){
        const h = hosps[idx];
        const rowCounts = colKeys.map(ck => countsByHospital[h]?.[ck] || 0);
        const total = hospitalTotals[h] || 0;
        const rowPercs = rowCounts.map(c => total ? Math.round(10000 * c / total) / 100 : 0);
        const share = grandTotal ? Math.round(10000 * total / grandTotal) / 100 : 0;

        displayRows.push({
          city,
          showCity: idx === 0,
          cityRowspan: rowspan,
          hospital: h,
          counts: rowCounts,
          percents: rowPercs,
          total,
          share
        });
      }
    }

    return { colKeys, displayRows, grandTotal };
  }
}
