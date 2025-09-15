import { Component, OnInit } from '@angular/core';

/* =================== Tipler =================== */
type Guid = string;
type DimId = 'City' | 'Hospital' | 'Diagnosis' | 'Report' | 'State' | 'Organization';

export enum ReportStateId { Approval = 1, Annotation = 2, ManualAnnotation = 3 }

interface City        { id: Guid; code: number; name: string; }
interface Hospital    { id: Guid; code: number; name: string; cityId: Guid; }
interface Provision   { id: Guid; code: string; hospitalId: Guid; }
interface Organization{ id: Guid; name: string; }
interface ApproveUser { id: Guid; name: string; organizationId: Guid; }
interface Diagnosis   { id: Guid; code: string; name: string; }

interface Report {
  id: Guid;
  reportCode: number;
  stateId: ReportStateId;
  provisionId: Guid;
  approveUserId?: Guid;
  createdAt: Date;
  approvedAt?: Date | null;
}

interface ReportDiagnosis {
  id: Guid;
  reportId: Guid;
  diagnosisId: Guid;
  reportCode?: number;
  diagnosisName?: string;
}

/* Tabloda kullanacağımız eager satır */
interface ReportRow {
  reportId: string;
  reportCode: number;

  cityId: string;      cityName: string;
  hospitalId: string;  hospitalName: string;

  organizationId?: string; organizationName?: string;
  approveUserId?: string;  approveUserName?: string;

  diagnosisId: string; diagnosisName: string;

  stateId: ReportStateId;  stateName: string;

  reportCreated: Date;
}

/* Tek boyutlu liste sonucu */
interface StatRowDto {
  label1?: string;
  label2?: string | null;
  count: number;
  percent: number;
}

/* İki boyutlu pivot tablo yapısı (custom) */
interface PivotTable {
  rowKeys: string[];
  colKeys: string[];
  counts: number[][];     // [ri][ci]
  percents: number[][];   // [ri][ci] — satır toplamına göre
  rowTotals: number[];    // [ri]
  grandTotal: number;     // tüm hücrelerin toplamı
  rowShare: number[];     // [ri] satır toplamının genel toplam içindeki oranı (%)
  overflow: boolean;      // kolon sayısı limit üstü mü?
}

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {

  // ---- Tarih alanları (input[type=date] için string) ----
  startDateStr = '';
  endDateStr   = '';

  // ---- Satır / Sütun boyutları ----
  rowDim: DimId = 'City';
  colDim: DimId | null = 'Diagnosis'; // varsayılan pivot: Şehir × Tanı

  // ---- Kriter seçimleri ----
  selectedCityIds: string[] = [];
  selectedHospitalIds: string[] = [];
  selectedDiagnosisIds: string[] = [];
  selectedOrganizationIds: string[] = [];
  selectedReportCodes: number[] = [];
  selectedStates: number[] = []; // ReportStateId[]

  // ---- Lookuplar ----
  cities: City[] = [];
  hospitals: Hospital[] = [];
  organizations: Organization[] = [];
  users: ApproveUser[] = [];
  diagnoses: Diagnosis[] = [];

  // ---- Cascading için filtrelenmiş hastaneler ----
  hospitalsFiltered: Hospital[] = [];

  // ---- Kolon kontrolü ----
  colOnlySelected = true; // true: sadece seçilen tanılar, false: tüm tanılar

  // ---- Rapor kod CSV inputu ----
  reportCodeCsv = '';

  // ---- Veri setleri ----
  private allData: ReportRow[] = [];
  activeData: ReportRow[] = [];      // tarih ile süzülmüş (Getir'e basınca dolar)

  // ---- Sonuçlar ----
  rows: StatRowDto[] = [];           // tek boyutlu görünüm
  pivot: PivotTable | null = null;   // iki boyutlu pivot görünüm
  showPercents = true;               // pivotta sayıların yanında % göster

  totalCount = 0;

  // ---- “Seçilen vs Diğerleri” (satır boyutu için) ----
  selectedVsOthers = { selected: 0, others: 0, total: 0, pctSel: 0 };

  // ---- Metin haritası ----
  dimTextMap: { [k in DimId]: string } = {
    City: 'Şehir',
    Hospital: 'Hastane',
    Diagnosis: 'Tanı',
    Report: 'Rapor',
    State: 'Durum',
    Organization: 'Kurum'
  };

  stateText(s: ReportStateId): string {
    if (s === ReportStateId.Approval) return 'Onay';
    if (s === ReportStateId.Annotation) return 'Açıklama';
    return 'Manuel Açıklama';
  }

  /* =================== Lifecycle =================== */
  ngOnInit(): void {
    // 1) Mock üret
    const mock = this.generateMock(42);
    this.cities         = mock.cities;
    this.hospitals      = mock.hospitals;
    this.organizations  = mock.organizations;
    this.users          = mock.users;
    this.diagnoses      = mock.diagnoses;

    // 2) Eager satırları kur
    this.allData = this.buildRows(
      mock.cities, mock.hospitals, mock.organizations, mock.users,
      mock.provisions, mock.reports, mock.diagnoses, mock.reportDiagnoses
    );

    // 3) Varsayılan tarih alanlarına değer ver ama **Getir'e basmadan veri çekme**
    this.initDefaultDates();

    // 4) Hastane datasını başlangıçta tümü yap
    this.hospitalsFiltered = this.hospitals.slice(0);

    // 5) Artık otomatik run() / onSaveDate() çağırmıyoruz → kullanıcı “Getir”e basınca çalışacak.
  }

  /* =================== Mock Üretim (aynen önceki gibi) =================== */

  private rngSeed = 42;
  private rnd(): number {
    this.rngSeed = (this.rngSeed * 1664525 + 1013904223) >>> 0;
    return this.rngSeed / 0x100000000;
  }
  private pick<T>(arr: T[]): T { return arr[Math.floor(this.rnd() * arr.length)]!; }
  private between(min: number, max: number) { return Math.floor(this.rnd() * (max - min + 1)) + min; }
  private guid(prefix = ''): string {
    const h = () => Math.floor(this.rnd() * 0xffffffff).toString(16).padStart(8, '0');
    return `${prefix}${h()}-${h().slice(0,4)}-${h().slice(0,4)}-${h().slice(0,4)}-${h()}`;
  }
  private getHospitalType(hName: string): 'GATA'|'Şehir'|'Acıbadem'|'Askeri'|'Diğer' {
    if (hName.includes('GATA')) return 'GATA';
    if (hName.includes('Askeri')) return 'Askeri';
    if (hName.includes('Acıbadem')) return 'Acıbadem';
    if (hName.includes('Şehir Hastanesi')) return 'Şehir';
    return 'Diğer';
  }
  private weightedPick<T>(items: T[], weights: number[]): T {
    const sum = weights.reduce((s, w) => s + w, 0);
    let r = this.rnd() * sum;
    for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i]; }
    return items[items.length - 1];
  }
  private pickStateWithContext(
    base: { approval: number; annotation: number; manual: number },
    ctx: { orgName?: string; hospType?: string; createdBackDays: number }
  ): ReportStateId {
    let wApproval = base.approval;   // 60
    let wAnnot    = base.annotation; // 25
    let wManual   = base.manual;     // 15
    if (ctx.orgName?.includes('MSB Merkez')) wApproval += 10;
    if (ctx.hospType === 'Askeri') wAnnot += 8;
    if (ctx.createdBackDays <= 2) wApproval = Math.max(5, Math.floor(wApproval * 0.75));
    return this.weightedPick(
      [ReportStateId.Approval, ReportStateId.Annotation, ReportStateId.ManualAnnotation],
      [wApproval, wAnnot, wManual]
    );
  }
  private generateMock(seed = 42): {
    cities: City[]; hospitals: Hospital[]; organizations: Organization[];
    users: ApproveUser[]; provisions: Provision[]; reports: Report[];
    diagnoses: Diagnosis[]; reportDiagnoses: ReportDiagnosis[];
  } {
    this.rngSeed = seed >>> 0;
    const cityNames = [
      'İstanbul','Ankara','İzmir','Bursa','Antalya','Kocaeli','Konya','Gaziantep',
      'Adana','Mersin','Diyarbakır','Kayseri','Samsun','Trabzon','Eskişehir'
    ];
    const cities: City[] = cityNames.map((n, i) => ({ id: this.guid('C-'), code: 100 + i, name: n }));
    const hospTypes = ['GATA','Şehir Hastanesi','Acıbadem','Askeri Hastane','Şehir Hastanesi 2'];
    const hospitals: Hospital[] = [];
    let hCode = 500;
    for (const c of cities) {
      for (let k = 0; k < 5; k++) {
        hospitals.push({ id: this.guid('H-'), code: hCode++, name: `${c.name} ${hospTypes[k]}`, cityId: c.id });
      }
    }
    const orgNames = ['Kara Kuvvetleri', 'Hava Kuvvetleri', 'MSB Merkez'];
    const organizations: Organization[] = orgNames.map(n => ({ id: this.guid('ORG-'), name: n }));
    const first = ['Ahmet','Mehmet','Ayşe','Fatma','Elif','Ali','Burak','Zeynep','Cem','Merve','Ece','Oğuz'];
    const last  = ['Yılmaz','Demir','Şahin','Çelik','Yıldız','Acar','Öztürk','Koç','Aslan','Kaya','Arslan'];
    const users: ApproveUser[] = [];
    for (const org of organizations) {
      for (let i = 0; i < 5; i++) {
        users.push({ id: this.guid('USR-'), name: `${this.pick(first)} ${this.pick(last)}`, organizationId: org.id });
      }
    }
    const diagCatalog: Array<[string,string]> = [
      ['J11','Grip'], ['I10','Primer hipertansiyon'], ['K52','Enterit ve kolit'],
      ['E11','Tip 2 Diyabet'], ['J20','Akut bronşit'], ['M54','Dorsalji'],
      ['N39','Üriner sistem enf.'], ['L70','Akne'], ['G43','Migren'], ['K21','GÖRH']
    ];
    const diagnoses: Diagnosis[] = diagCatalog.map((d, i) => ({ id: `D-${(i+1).toString().padStart(2,'0')}`, code: d[0], name: d[1] }));
    const provisions: Provision[] = [];
    for (const h of hospitals) for (let i = 1; i <= 15; i++) provisions.push({ id: this.guid('PRV-'), code: `PRV-${h.code}-${i.toString().padStart(4,'0')}`, hospitalId: h.id });
    const today = new Date();
    let runningCode = 20250000, approverIdx = 0;
    const provByHospital = new Map<string, Provision[]>();
    for (const p of provisions) (provByHospital.get(p.hospitalId) || provByHospital.set(p.hospitalId, []).get(p.hospitalId)!)!.push(p);
    const reports: Report[] = [];
    const reportDiagnoses: ReportDiagnosis[] = [];
    const baseWeights = { approval: 60, annotation: 25, manual: 15 };
    for (const h of hospitals) {
      const provs = provByHospital.get(h.id)!;
      for (let i = 0; i < 15; i++) {
        const prov = provs[i];
        const createdBack = this.between(0, 180);
        const createdAt = new Date(today.getTime() - createdBack * 86400000);
        createdAt.setHours(8 + this.between(0,9), this.between(0,59), 0, 0);
        const stateId = this.pickStateWithContext(baseWeights, {
          orgName: organizations[(approverIdx % organizations.length)].name,
          hospType: this.getHospitalType(h.name),
          createdBackDays: createdBack
        });
        let approveUserId: string | undefined; let approvedAt: Date | null = null;
        if (stateId === ReportStateId.Approval) {
          approveUserId = users[approverIdx++ % users.length].id;
          approvedAt = new Date(createdAt.getTime() + this.between(0, 5) * 86400000);
        } else { if (this.rnd() < 0.40) approveUserId = users[approverIdx++ % users.length].id; }
        const rpt: Report = { id: this.guid('RPT-'), reportCode: ++runningCode, stateId, provisionId: prov.id, approveUserId, createdAt, approvedAt };
        reports.push(rpt);
        const d = diagnoses[this.between(0, diagnoses.length - 1)];
        reportDiagnoses.push({ id: this.guid('RDX-'), reportId: rpt.id, diagnosisId: d.id, reportCode: rpt.reportCode, diagnosisName: d.name });
      }
    }
    return { cities, hospitals, organizations, users, provisions, reports, diagnoses, reportDiagnoses };
  }

  private buildRows(
    cities: City[],
    hospitals: Hospital[],
    orgs: Organization[],
    users: ApproveUser[],
    provisions: Provision[],
    reports: Report[],
    diagnoses: Diagnosis[],
    rdx: ReportDiagnosis[]
  ): ReportRow[] {
    const cityById = new Map(cities.map(c => [c.id, c]));
    const hospById = new Map(hospitals.map(h => [h.id, h]));
    const orgById  = new Map(orgs.map(o => [o.id, o]));
    const userById = new Map(users.map(u => [u.id, u]));
    const provById = new Map(provisions.map(p => [p.id, p]));
    const diagByReportId = new Map<string, ReportDiagnosis>();
    for (const x of rdx) diagByReportId.set(x.reportId, x);

    const out: ReportRow[] = [];
    for (const r of reports) {
      const p = provById.get(r.provisionId)!;
      const h = hospById.get(p.hospitalId)!;
      const c = cityById.get(h.cityId)!;
      const u = r.approveUserId ? userById.get(r.approveUserId) : undefined;
      const o = u ? orgById.get(u.organizationId) : undefined;
      const d = diagByReportId.get(r.id)!;

      out.push({
        reportId: r.id, reportCode: r.reportCode,
        cityId: c.id, cityName: c.name,
        hospitalId: h.id, hospitalName: h.name,
        organizationId: o?.id, organizationName: o?.name,
        approveUserId: u?.id, approveUserName: u?.name,
        diagnosisId: d.diagnosisId, diagnosisName: d.diagnosisName || '',
        stateId: r.stateId, stateName: this.stateText(r.stateId),
        reportCreated: r.createdAt
      });
    }
    return out;
  }

  /* =================== Tarih yardımcıları =================== */
  private pad2(n: number) { return n < 10 ? '0' + n : '' + n; }
  private toInputDate(d: Date) { return d.getFullYear() + '-' + this.pad2(d.getMonth() + 1) + '-' + this.pad2(d.getDate()); }
  private parseInputDateStart(s: string): Date { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d, 0, 0, 0, 0); }
  private parseInputDateEnd(s: string): Date   { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d, 23, 59, 59, 999); }
  private initDefaultDates(): void {
    const end = new Date(); const start = new Date(end.getTime() - 30 * 86400000);
    this.startDateStr = this.toInputDate(start);
    this.endDateStr   = this.toInputDate(end);
  }

  // Artık sadece kullanıcı “Getir” diyince çalışır
  onSaveDate(): void {
    if (!this.startDateStr || !this.endDateStr) { this.activeData = []; this.rows = []; this.pivot = null; this.totalCount=0; this.selectedVsOthers = {selected:0, others:0, total:0, pctSel:0}; return; }
    const s = this.parseInputDateStart(this.startDateStr).getTime();
    const e = this.parseInputDateEnd(this.endDateStr).getTime();
    this.activeData = this.allData.filter(x => {
      const t = x.reportCreated.getTime();
      return t >= s && t <= e;
    });
    this.run();
  }

  /* =================== Event handler'lar =================== */
  onCitySelectionChange(ids: string[]): void {
    this.selectedCityIds = ids || [];
    if (this.selectedCityIds.length) {
      const s = new Set(this.selectedCityIds);
      this.hospitalsFiltered = this.hospitals.filter(h => s.has(h.cityId));
    } else {
      this.hospitalsFiltered = this.hospitals.slice(0);
    }
    const allowed = new Set(this.hospitalsFiltered.map(h => h.id));
    this.selectedHospitalIds = this.selectedHospitalIds.filter(id => allowed.has(id));
    this.run();
  }
  onHospitalSelectionChange(ids: string[]): void { this.selectedHospitalIds = ids || []; this.run(); }
  onDiagnosisSelectionChange(newIds: string[]): void {
    const prev = this.selectedDiagnosisIds || [];
    const newSet = new Set(newIds || []);
    const ordered: string[] = [];
    for (const id of prev) if (newSet.has(id)) ordered.push(id);
    for (const id of (newIds || [])) if (!prev.includes(id)) ordered.push(id);
    this.selectedDiagnosisIds = ordered;
    this.run();
  }
  onReportCodeChange(ev: Event | string): void {
    let text = '';
    if (typeof ev === 'string') text = ev;
    else { const target = ev.target as HTMLInputElement | null; text = target?.value ?? ''; }
    this.selectedReportCodes = this.parseCsvNumbers(text);
    this.run();
  }
  private parseCsvNumbers(v: string | null | undefined): number[] {
    if (!v) return [];
    return v.split(/[,\s]+/).map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
  }

  /* =================== Hesap (kırılım + seçilen vs diğerleri) =================== */
  run(): void {
    // tarih seçilmeden (activeData boşken) filtre çalışsa da sonuç doğal olarak boş kalır
    let filtered = this.activeData.slice(0);

    if (this.selectedCityIds.length) {
      const s = new Set(this.selectedCityIds);
      filtered = filtered.filter(x => s.has(x.cityId));
    }
    if (this.selectedHospitalIds.length) {
      const s = new Set(this.selectedHospitalIds);
      filtered = filtered.filter(x => s.has(x.hospitalId));
    }
    if (this.selectedOrganizationIds.length) {
      const s = new Set(this.selectedOrganizationIds);
      filtered = filtered.filter(x => x.organizationId && s.has(x.organizationId));
    }
    if (this.selectedDiagnosisIds.length) {
      const s = new Set(this.selectedDiagnosisIds);
      filtered = filtered.filter(x => s.has(x.diagnosisId));
    }
    if (this.selectedReportCodes.length) {
      const s = new Set(this.selectedReportCodes);
      filtered = filtered.filter(x => s.has(x.reportCode));
    }
    if (this.selectedStates.length) {
      const s = new Set(this.selectedStates);
      filtered = filtered.filter(x => s.has(x.stateId));
    }

    if (!this.colDim) {
      // 1D liste
      this.rows = this.computeStats1D(filtered, this.rowDim);
      this.totalCount = this.rows.reduce((sum, r) => sum + r.count, 0);
      this.pivot = null;
    } else {
      // 2D pivot
      this.pivot = this.computePivot2D(filtered, this.rowDim, this.colDim);
      this.totalCount = this.pivot.rowTotals.reduce((s, n) => s + n, 0);
      this.rows = [];
    }

    this.computeSelectedVsOthers();
  }

  private labelOf(r: ReportRow, d: DimId): string {
    if (d === 'City')         return r.cityName;
    if (d === 'Hospital')     return r.hospitalName;
    if (d === 'Diagnosis')    return r.diagnosisName;
    if (d === 'State')        return r.stateName;
    if (d === 'Organization') return r.organizationName || '(Yok)';
    return '' + r.reportCode;
  }

  private computeStats1D(list: ReportRow[], d1: DimId): StatRowDto[] {
    const out: StatRowDto[] = [];
    const map: { [label: string]: { [rid: string]: true } } = {};
    for (let i = 0; i < list.length; i++) {
      const lab = this.labelOf(list[i], d1);
      (map[lab] = map[lab] || {})[list[i].reportId] = true;
    }
    for (const k in map) out.push({ label1: k, label2: null, count: Object.keys(map[k]).length, percent: 0 });
    const total = out.reduce((s, r) => s + r.count, 0);
    for (let i = 0; i < out.length; i++) out[i].percent = total ? Math.round(10000 * out[i].count / total) / 100 : 0;
    out.sort((a,b) => (b.count - a.count) || (a.label1! < b.label1! ? -1 : 1));
    return out;
  }

  // Kolonları sabitleme (kullanıcı seçimine göre)
  private getFixedColsFor(d2: DimId): string[] | null {
    if (d2 === 'Diagnosis') {
      if (this.colOnlySelected && this.selectedDiagnosisIds.length) {
        const idToName = new Map(this.diagnoses.map(d => [d.id, d.name]));
        return this.selectedDiagnosisIds.map(id => idToName.get(id)!).filter(Boolean); // seçme sırası korunur
      }
      // colOnlySelected=false ise null döndür → verideki tüm tanılar (alfabetik)
    }
    if (d2 === 'State' && this.selectedStates.length) {
      const idToName = new Map<number, string>([
        [ReportStateId.Approval, 'Onay'],
        [ReportStateId.Annotation, 'Açıklama'],
        [ReportStateId.ManualAnnotation, 'Manuel Açıklama'],
      ]);
      return this.selectedStates.map(s => idToName.get(s)!).filter(Boolean);
    }
    if (d2 === 'Organization' && this.selectedOrganizationIds.length) {
      const idToName = new Map(this.organizations.map(o => [o.id, o.name]));
      return this.selectedOrganizationIds.map(id => idToName.get(id)!).filter(Boolean);
    }
    if (d2 === 'City' && this.selectedCityIds.length) {
      const idToName = new Map(this.cities.map(c => [c.id, c.name]));
      return this.selectedCityIds.map(id => idToName.get(id)!).filter(Boolean);
    }
    if (d2 === 'Hospital' && this.selectedHospitalIds.length) {
      const idToName = new Map(this.hospitals.map(h => [h.id, h.name]));
      return this.selectedHospitalIds.map(id => idToName.get(id)!).filter(Boolean);
    }
    return null;
  }

  private computePivot2D(list: ReportRow[], d1: DimId, d2: DimId): PivotTable {
    const rowSet = new Set<string>();
    const colSet = new Set<string>();
    const cell: Record<string, Record<string, Set<string>>> = {}; // distinct reportId

    for (const r of list) {
      const rk = this.labelOf(r, d1);
      const ck = this.labelOf(r, d2);
      rowSet.add(rk); colSet.add(ck);
      cell[rk] ??= {};
      cell[rk][ck] ??= new Set<string>();
      cell[rk][ck].add(r.reportId);
    }

    // Kolon anahtarı
    let colKeys = this.getFixedColsFor(d2) ?? Array.from(colSet);
    if (!(d2 === 'Diagnosis' && this.colOnlySelected && this.selectedDiagnosisIds.length)) {
      colKeys.sort((a,b) => a.localeCompare(b, 'tr'));
    }

    const MAX_COLS = 20;
    const overflow = colKeys.length > MAX_COLS;
    if (overflow) colKeys = colKeys.slice(0, MAX_COLS);

    const rowKeys = Array.from(rowSet).sort((a,b) => a.localeCompare(b, 'tr'));

    const counts: number[][] = [];
    const percents: number[][] = [];
    const rowTotals: number[] = [];

    for (const rk of rowKeys) {
      let total = 0;
      const rowCounts: number[] = [];
      for (const ck of colKeys) {
        const cnt = cell[rk]?.[ck]?.size ?? 0;
        rowCounts.push(cnt);
        total += cnt;
      }
      rowTotals.push(total);
      const rowPercs = rowCounts.map(c => total ? Math.round(10000 * c / total) / 100 : 0);
      counts.push(rowCounts);
      percents.push(rowPercs);
    }

    const grandTotal = rowTotals.reduce((s, n) => s + n, 0);
    const rowShare = rowTotals.map(t => grandTotal ? Math.round(10000 * t / grandTotal) / 100 : 0);

    return { rowKeys, colKeys, counts, percents, rowTotals, grandTotal, rowShare, overflow };
  }

  private computeSelectedVsOthers(): void {
    const selectedIds = this.getSelectedIdsForDim(this.rowDim);
    if (!selectedIds.length) { this.selectedVsOthers = { selected: 0, others: 0, total: 0, pctSel: 0 }; return; }

    let base = this.activeData.slice(0);

    if (this.rowDim !== 'City' && this.selectedCityIds.length) {
      const s = new Set(this.selectedCityIds);
      base = base.filter(x => s.has(x.cityId));
    }
    if (this.rowDim !== 'Hospital' && this.selectedHospitalIds.length) {
      const s = new Set(this.selectedHospitalIds);
      base = base.filter(x => s.has(x.hospitalId));
    }
    if (this.rowDim !== 'Organization' && this.selectedOrganizationIds.length) {
      const s = new Set(this.selectedOrganizationIds);
      base = base.filter(x => x.organizationId && s.has(x.organizationId));
    }
    if (this.rowDim !== 'Diagnosis' && this.selectedDiagnosisIds.length) {
      const s = new Set(this.selectedDiagnosisIds);
      base = base.filter(x => s.has(x.diagnosisId));
    }
    if (this.rowDim !== 'Report' && this.selectedReportCodes.length) {
      const s = new Set(this.selectedReportCodes);
      base = base.filter(x => s.has(x.reportCode));
    }
    if (this.rowDim !== 'State' && this.selectedStates.length) {
      const s = new Set(this.selectedStates);
      base = base.filter(x => s.has(x.stateId));
    }

    const selSet = new Set(selectedIds);
    let sel = 0, oth = 0;
    const seenSel: { [rid: string]: true } = {};
    const seenOth: { [rid: string]: true } = {};

    for (let i = 0; i < base.length; i++) {
      const r = base[i];
      let isSel = false;
      switch (this.rowDim) {
        case 'City':         isSel = selSet.has(r.cityId); break;
        case 'Hospital':     isSel = selSet.has(r.hospitalId); break;
        case 'Organization': isSel = !!r.organizationId && selSet.has(r.organizationId); break;
        case 'Diagnosis':    isSel = selSet.has(r.diagnosisId); break;
        case 'Report':       isSel = selSet.has('' + r.reportCode); break;
        case 'State':        isSel = selSet.has('' + r.stateId); break;
      }
      if (isSel) { if (!seenSel[r.reportId]) { seenSel[r.reportId] = true; sel++; } }
      else       { if (!seenOth[r.reportId]) { seenOth[r.reportId] = true; oth++; } }
    }

    const total = sel + oth;
    const pctSel = total ? Math.round(10000 * sel / total) / 100 : 0;
    this.selectedVsOthers = { selected: sel, others: oth, total, pctSel };
  }

  private getSelectedIdsForDim(d: DimId): string[] {
    if (d === 'City') return this.selectedCityIds.slice(0);
    if (d === 'Hospital') return this.selectedHospitalIds.slice(0);
    if (d === 'Organization') return this.selectedOrganizationIds.slice(0);
    if (d === 'Diagnosis') return this.selectedDiagnosisIds.slice(0);
    if (d === 'Report') return this.selectedReportCodes.map(n => '' + n);
    if (d === 'State') return this.selectedStates.map(s => '' + s);
    return [];
  }
}
