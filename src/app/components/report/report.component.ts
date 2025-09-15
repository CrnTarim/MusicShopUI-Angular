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

/* Eager satır (fact) */
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

/* 1D liste sonucu */
interface StatRowDto {
  label1?: string;
  label2?: string | null;
  count: number;
  percent: number;
}

/* 2D Pivot (çok katmanlı kolon başlığı destekli) */
interface PivotLeaf {
  k1: string;      // üst seviye kolon anahtarı
  k2?: string;     // alt seviye (ops)
  label: string;   // hücre başlığı (en alttaki)
}
interface PivotTable {
  rowKeys: string[];
  topKeys: string[];      // k1 anahtarları sıralı
  topSpan: number[];      // her k1 için colspan
  leafKeys: PivotLeaf[];  // render sırası
  counts: number[][];     // [ri][leafIdx]
  percents: number[][];   // satır içi %
  rowTotals: number[];
  grandTotal: number;
  rowShare: number[];
  hasSecondLevel: boolean;
  overflow: boolean;      // leaf sınırı aşıldı mı?
}

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {

  /* ------------ Tarih ------------- */
  startDateStr = '';
  endDateStr   = '';

  /* ------------ Boyutlar ----------- */
  rowDim: DimId = 'City';
  col1Dim: DimId | null = 'Diagnosis'; // Katman 1
  col2Dim: DimId | null = null;        // Katman 2 (opsiyonel)

  /* ----------- Kriterler ----------- */
  selectedCityIds: string[] = [];
  selectedHospitalIds: string[] = [];
  selectedDiagnosisIds: string[] = [];
  selectedOrganizationIds: string[] = [];
  selectedReportCodes: number[] = [];
  selectedStates: number[] = []; // ReportStateId[]

  /* ------------ Lookups ------------ */
  cities: City[] = [];
  hospitals: Hospital[] = [];
  organizations: Organization[] = [];
  users: ApproveUser[] = [];
  diagnoses: Diagnosis[] = [];

  /* --- Cascading için hastane DS --- */
  hospitalsFiltered: Hospital[] = [];

  /* --- Kolon kontrolü -------------- */
  colOnlySelected = true; // true: seçili üyeler; false: tüm üyeler
  showPercents = true;

  /* --- Rapor kod CSV --------------- */
  reportCodeCsv = '';

  /* ------------ Veriler ------------ */
  private allData: ReportRow[] = [];
  activeData: ReportRow[] = [];      // sadece “Getir” sonrası

  /* ------------ Sonuçlar ----------- */
  rows: StatRowDto[] = [];         // 1D liste
  pivot: PivotTable | null = null; // 2D pivot
  totalCount = 0;

  /* ---- Seçilen vs Diğerleri ------- */
  selectedVsOthers = { selected: 0, others: 0, total: 0, pctSel: 0 };

  /* ------------ Metinler ----------- */
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

  /* ============ Lifecycle ============ */
  ngOnInit(): void {
    const mock = this.generateMock(42);
    this.cities         = mock.cities;
    this.hospitals      = mock.hospitals;
    this.organizations  = mock.organizations;
    this.users          = mock.users;
    this.diagnoses      = mock.diagnoses;

    this.allData = this.buildRows(
      mock.cities, mock.hospitals, mock.organizations, mock.users,
      mock.provisions, mock.reports, mock.diagnoses, mock.reportDiagnoses
    );

    this.initDefaultDates();                     // tarih inputlarını doldur
    this.hospitalsFiltered = this.hospitals.slice(0); // cascading base
  }

  /* ============ Mock Üretim ============ */
  private rngSeed = 42;
  private rnd(): number { this.rngSeed = (this.rngSeed * 1664525 + 1013904223) >>> 0; return this.rngSeed / 0x100000000; }
  private pick<T>(arr: T[]): T { return arr[Math.floor(this.rnd() * arr.length)]!; }
  private between(min: number, max: number) { return Math.floor(this.rnd() * (max - min + 1)) + min; }
  private guid(prefix = ''): string { const h = () => Math.floor(this.rnd() * 0xffffffff).toString(16).padStart(8, '0'); return `${prefix}${h()}-${h().slice(0,4)}-${h().slice(0,4)}-${h().slice(0,4)}-${h()}`; }
  private getHospitalType(hName: string): 'GATA'|'Şehir'|'Acıbadem'|'Askeri'|'Diğer' {
    if (hName.includes('GATA')) return 'GATA';
    if (hName.includes('Askeri')) return 'Askeri';
    if (hName.includes('Acıbadem')) return 'Acıbadem';
    if (hName.includes('Şehir Hastanesi')) return 'Şehir';
    return 'Diğer';
  }
  private weightedPick<T>(items: T[], weights: number[]): T {
    const sum = weights.reduce((s, w) => s + w, 0); let r = this.rnd() * sum;
    for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i]; }
    return items[items.length - 1];
  }
  private pickStateWithContext(
    base: { approval: number; annotation: number; manual: number },
    ctx: { orgName?: string; hospType?: string; createdBackDays: number }
  ): ReportStateId {
    let wApproval = base.approval, wAnnot = base.annotation, wManual = base.manual;
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

    // 15 şehir
    const cityNames = [
      'İstanbul','Ankara','İzmir','Bursa','Antalya','Kocaeli','Konya','Gaziantep',
      'Adana','Mersin','Diyarbakır','Kayseri','Samsun','Trabzon','Eskişehir'
    ];
    const cities: City[] = cityNames.map((n, i) => ({ id: this.guid('C-'), code: 100 + i, name: n }));

    // Her şehirde 5 hastane tipi
    const hospTypes = ['GATA','Şehir Hastanesi','Acıbadem','Askeri Hastane','Şehir Hastanesi 2'];
    const hospitals: Hospital[] = [];
    let hCode = 500;
    for (const c of cities) for (let k = 0; k < 5; k++) {
      hospitals.push({ id: this.guid('H-'), code: hCode++, name: `${c.name} ${hospTypes[k]}`, cityId: c.id });
    }

    // 3 kurum, her kurumda 5 onaylayan
    const orgNames = ['Kara Kuvvetleri', 'Hava Kuvvetleri', 'MSB Merkez'];
    const organizations: Organization[] = orgNames.map(n => ({ id: this.guid('ORG-'), name: n }));
    const first = ['Ahmet','Mehmet','Ayşe','Fatma','Elif','Ali','Burak','Zeynep','Cem','Merve','Ece','Oğuz'];
    const last  = ['Yılmaz','Demir','Şahin','Çelik','Yıldız','Acar','Öztürk','Koç','Aslan','Kaya','Arslan'];
    const users: ApproveUser[] = [];
    for (const org of organizations) for (let i = 0; i < 5; i++) {
      users.push({ id: this.guid('USR-'), name: `${this.pick(first)} ${this.pick(last)}`, organizationId: org.id });
    }

    // 10 tanı
    const diagCatalog: Array<[string,string]> = [
      ['J11','Grip'], ['I10','Primer hipertansiyon'], ['K52','Enterit ve kolit'],
      ['E11','Tip 2 Diyabet'], ['J20','Akut bronşit'], ['M54','Dorsalji'],
      ['N39','Üriner sistem enf.'], ['L70','Akne'], ['G43','Migren'], ['K21','GÖRH']
    ];
    const diagnoses: Diagnosis[] = diagCatalog.map((d, i) => ({ id: `D-${(i+1).toString().padStart(2,'0')}`, code: d[0], name: d[1] }));

    // Provision (hastane başına 15)
    const provisions: Provision[] = [];
    for (const h of hospitals) for (let i = 1; i <= 15; i++) {
      provisions.push({ id: this.guid('PRV-'), code: `PRV-${h.code}-${i.toString().padStart(4,'0')}`, hospitalId: h.id });
    }

    // Raporlar (hastane başına 15) + rapor başına 1 tanı
    const today = new Date();
    let runningCode = 20250000, approverIdx = 0;

    const provByHospital = new Map<string, Provision[]>();
    for (const p of provisions) {
      const arr = provByHospital.get(p.hospitalId) || [];
      arr.push(p);
      provByHospital.set(p.hospitalId, arr);
    }

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
        } else {
          if (this.rnd() < 0.40) approveUserId = users[approverIdx++ % users.length].id;
        }

        const rpt: Report = { id: this.guid('RPT-'), reportCode: ++runningCode, stateId, provisionId: prov.id, approveUserId, createdAt, approvedAt };
        reports.push(rpt);

        const d = diagnoses[this.between(0, diagnoses.length - 1)];
        reportDiagnoses.push({ id: this.guid('RDX-'), reportId: rpt.id, diagnosisId: d.id, reportCode: rpt.reportCode, diagnosisName: d.name });
      }
    }

    return { cities, hospitals, organizations, users, provisions, reports, diagnoses, reportDiagnoses };
  }

  private buildRows(
    cities: City[], hospitals: Hospital[], orgs: Organization[], users: ApproveUser[],
    provisions: Provision[], reports: Report[], diagnoses: Diagnosis[], rdx: ReportDiagnosis[]
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

  /* ============ Tarih yardımcıları ============ */
  private pad2(n: number) { return n < 10 ? '0' + n : '' + n; }
  private toInputDate(d: Date) { return d.getFullYear() + '-' + this.pad2(d.getMonth() + 1) + '-' + this.pad2(d.getDate()); }
  private parseInputDateStart(s: string): Date { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d, 0, 0, 0, 0); }
  private parseInputDateEnd(s: string): Date   { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d, 23, 59, 59, 999); }
  private initDefaultDates(): void {
    const end = new Date(); const start = new Date(end.getTime() - 30 * 86400000);
    this.startDateStr = this.toInputDate(start);
    this.endDateStr   = this.toInputDate(end);
  }

  onSaveDate(): void {
    if (!this.startDateStr || !this.endDateStr) {
      this.activeData = []; this.rows = []; this.pivot = null; this.totalCount=0;
      this.selectedVsOthers = {selected:0, others:0, total:0, pctSel:0};
      return;
    }
    const s = this.parseInputDateStart(this.startDateStr).getTime();
    const e = this.parseInputDateEnd(this.endDateStr).getTime();
    this.activeData = this.allData.filter(x => {
      const t = x.reportCreated.getTime();
      return t >= s && t <= e;
    });
    this.run();
  }

  /* ============ Eventler ============ */

  // Şehir → Hastane cascading
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

  // Tanı seçim sırası = kolon sırası
  onDiagnosisSelectionChange(newIds: string[]): void {
    const prev = this.selectedDiagnosisIds || [];
    const newSet = new Set(newIds || []);
    const ordered: string[] = [];
    for (const id of prev) if (newSet.has(id)) ordered.push(id);
    for (const id of (newIds || [])) if (!prev.includes(id)) ordered.push(id);
    this.selectedDiagnosisIds = ordered;
    this.run();
  }

  // Rapor Kod CSV (boşluk/virgül)
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

  /* ====== Sütun Değerleri (çok katman) ====== */
  getColMemberDataSource(layer: 1|2): Array<{ id: string | number; name: string }> {
    const dim = layer === 1 ? this.col1Dim : this.col2Dim;
    if (!dim) return [];
    switch (dim) {
      case 'Diagnosis':    return this.diagnoses.map(d => ({ id: d.id, name: d.name }));
      case 'City':         return this.cities.map(c => ({ id: c.id, name: c.name }));
      case 'Hospital':     return (this.selectedCityIds.length ? this.hospitalsFiltered : this.hospitals)
                              .map(h => ({ id: h.id, name: h.name }));
      case 'Organization': return this.organizations.map(o => ({ id: o.id, name: o.name }));
      case 'State':        return [
                              { id: ReportStateId.Approval,        name: 'Onay' },
                              { id: ReportStateId.Annotation,       name: 'Açıklama' },
                              { id: ReportStateId.ManualAnnotation, name: 'Manuel Açıklama' },
                            ];
      case 'Report':       return []; // Rapor kodu text inputtan
    }
  }
  getColMemberValue(layer: 1|2): Array<string | number> {
    const dim = layer === 1 ? this.col1Dim : this.col2Dim;
    if (!dim) return [];
    switch (dim) {
      case 'Diagnosis':    return this.selectedDiagnosisIds.slice(0);
      case 'City':         return this.selectedCityIds.slice(0);
      case 'Hospital':     return this.selectedHospitalIds.slice(0);
      case 'Organization': return this.selectedOrganizationIds.slice(0);
      case 'State':        return this.selectedStates.slice(0);
      case 'Report':       return [];
    }
  }
  onColMembersChange(ids: Array<string | number>, layer: 1|2): void {
    const dim = layer === 1 ? this.col1Dim : this.col2Dim;
    if (!dim) return;
    switch (dim) {
      case 'Diagnosis':    this.onDiagnosisSelectionChange(ids as string[]); return;
      case 'City':         this.onCitySelectionChange(ids as string[]);      return;
      case 'Hospital':     this.selectedHospitalIds = (ids as string[]) || []; break;
      case 'Organization': this.selectedOrganizationIds = (ids as string[]) || []; break;
      case 'State':        this.selectedStates = (ids as number[]) || []; break;
      case 'Report':       return;
    }
    this.run();
  }

  /* ====== Pivot Aç/Kapat ====== */
  togglePivot(): void {
    if (!this.col1Dim) {
      const order: DimId[] = ['Diagnosis','Hospital','City','Organization','State','Report'];
      this.col1Dim = order.find(d => d !== this.rowDim) || 'Diagnosis';
    } else {
      this.col1Dim = null; this.col2Dim = null;
    }
    this.run();
  }

  /* ====== Dim seçim yardımcıları ====== */
setColLayer(layer: 1|2, dim: DimId | null): void {
  if (layer === 1) {
    this.col1Dim = dim;
    if (this.col1Dim === this.rowDim) this.col1Dim = null;

    // Katman 1 seçildiyse, 2. katmanı otomatik öner (ör: Hastane → Tanı)
    if (this.col1Dim && !this.col2Dim) {
      const preference: DimId[] = ['Diagnosis','Organization','State','City','Hospital','Report'];
      this.col2Dim = preference.find(d => d !== this.rowDim && d !== this.col1Dim) || null;
    }

    // Çakışma olursa sıfırla
    if (this.col2Dim && (this.col2Dim === this.rowDim || this.col2Dim === this.col1Dim)) {
      this.col2Dim = null;
    }
  } else {
    this.col2Dim = dim;
    if (this.col2Dim === this.rowDim || this.col2Dim === this.col1Dim) this.col2Dim = null;
  }
  this.run();
}


  /* ============ Hesap ============ */
  run(): void {
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

    if (!this.col1Dim) {
      // Liste modu
      this.rows = this.computeStats1D(filtered, this.rowDim);
      this.totalCount = this.rows.reduce((sum, r) => sum + r.count, 0);
      this.pivot = null;
    } else {
      // Pivot modu (0/1/2 katman)
      this.pivot = this.computePivot(filtered, this.rowDim, this.col1Dim, this.col2Dim);
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
    for (const r of list) {
      const lab = this.labelOf(r, d1);
      (map[lab] = map[lab] || {})[r.reportId] = true;
    }
    for (const k in map) out.push({ label1: k, label2: null, count: Object.keys(map[k]).length, percent: 0 });
    const total = out.reduce((s, r) => s + r.count, 0);
    for (const row of out) row.percent = total ? Math.round(10000 * row.count / total) / 100 : 0;
    out.sort((a,b) => (b.count - a.count) || (a.label1! < b.label1! ? -1 : 1));
    return out;
  }

  /* ====== Seçimden "ad listesi" üret (sıralı) ====== */
  private selectedNamesFor(dim: DimId): string[] {
    if (dim === 'Diagnosis' && this.selectedDiagnosisIds.length) {
      const m = new Map(this.diagnoses.map(d => [d.id, d.name]));
      return this.selectedDiagnosisIds.map(id => m.get(id)!).filter(Boolean);
    }
    if (dim === 'City' && this.selectedCityIds.length) {
      const m = new Map(this.cities.map(c => [c.id, c.name]));
      return this.selectedCityIds.map(id => m.get(id)!).filter(Boolean);
    }
    if (dim === 'Hospital' && this.selectedHospitalIds.length) {
      const m = new Map(this.hospitals.map(h => [h.id, h.name]));
      return this.selectedHospitalIds.map(id => m.get(id)!).filter(Boolean);
    }
    if (dim === 'Organization' && this.selectedOrganizationIds.length) {
      const m = new Map(this.organizations.map(o => [o.id, o.name]));
      return this.selectedOrganizationIds.map(id => m.get(id)!).filter(Boolean);
    }
    if (dim === 'State' && this.selectedStates.length) {
      const m = new Map<number, string>([
        [ReportStateId.Approval, 'Onay'],
        [ReportStateId.Annotation, 'Açıklama'],
        [ReportStateId.ManualAnnotation, 'Manuel Açıklama'],
      ]);
      return this.selectedStates.map(id => m.get(id)!).filter(Boolean);
    }
    return [];
  }

  /* ====== Pivot hesap (0/1/2 katman) ====== */
  private computePivot(list: ReportRow[], rowDim: DimId, col1: DimId, col2: DimId | null): PivotTable {
    const rowSet = new Set<string>();
    const col1Set = new Set<string>();
    const col2SetByCol1 = new Map<string, Set<string>>();
    const cell: Record<string, Record<string, Record<string, Set<string>>>> = {};

    for (const r of list) {
      const rk = this.labelOf(r, rowDim);
      const c1 = this.labelOf(r, col1);
      const c2 = col2 ? this.labelOf(r, col2) : '__NO_C2__';

      rowSet.add(rk);
      col1Set.add(c1);
      if (!col2SetByCol1.has(c1)) col2SetByCol1.set(c1, new Set());
      col2SetByCol1.get(c1)!.add(c2);

      cell[rk] ??= {};
      cell[rk][c1] ??= {};
      cell[rk][c1][c2] ??= new Set<string>();
      cell[rk][c1][c2].add(r.reportId);
    }

    // Kolon seçimlerini uygula (seçililer öncelik + sıra korunur)
    let topKeys = this.colOnlySelected ? this.selectedNamesFor(col1) : [];
    if (!topKeys.length) topKeys = Array.from(col1Set).sort((a,b) => a.localeCompare(b, 'tr'));

    const hasSecondLevel = !!col2;
    const MAX_LEAF = 40; // toplam yaprak sütun sınırı (iki katman için artırdık)
    const leafKeys: PivotLeaf[] = [];
    const topSpan: number[] = [];
    let overflow = false;

    if (hasSecondLevel) {
      // Katman 2 seçimleri
      const selectedChild = this.colOnlySelected ? this.selectedNamesFor(col2!) : [];
      const childSorter = (arr: string[]) => {
        if (selectedChild.length) {
          const set = new Set(selectedChild);
          const ordered = selectedChild.filter(x => arr.includes(x));
          const rest = arr.filter(x => !set.has(x)).sort((a,b) => a.localeCompare(b,'tr'));
          return [...ordered, ...rest];
        }
        return arr.sort((a,b) => a.localeCompare(b,'tr'));
      };

      for (const k1 of topKeys) {
        const rawChild = Array.from(col2SetByCol1.get(k1) || []);
        // "__NO_C2__" sadece tek katmanlı veri güvenliği için; iki katman modunda normalde oluşmaz
        const cleanChild = rawChild.filter(x => x && x !== '__NO_C2__');
        const children = childSorter(cleanChild);

        let added = 0;
        const startLen = leafKeys.length;
        for (const ch of children) {
          if (leafKeys.length >= MAX_LEAF) { overflow = true; break; }
          leafKeys.push({ k1, k2: ch, label: ch });
          added++;
        }
        topSpan.push(Math.max(1, added));
        if (leafKeys.length >= MAX_LEAF) break;
      }
      // Hiç çocuk yoksa (uç case), k1’leri tek başlık gibi göster
      if (!leafKeys.length) {
        for (const k1 of topKeys) { leafKeys.push({ k1, label: k1 }); topSpan.push(1); }
      }
    } else {
      for (const k1 of topKeys) { leafKeys.push({ k1, label: k1 }); topSpan.push(1); }
    }

    const rowKeys = Array.from(rowSet).sort((a,b) => a.localeCompare(b, 'tr'));

    // Hücreler
    const counts: number[][] = [];
    const percents: number[][] = [];
    const rowTotals: number[] = [];

    for (const rk of rowKeys) {
      let total = 0;
      const rowCounts: number[] = [];
      for (const leaf of leafKeys) {
        const c2Key = hasSecondLevel ? (leaf.k2 || '__NO_C2__') : '__NO_C2__';
        const cnt = cell[rk]?.[leaf.k1]?.[c2Key]?.size ?? 0;
        rowCounts.push(cnt);
        total += cnt;
      }
      rowTotals.push(total);
      counts.push(rowCounts);
      percents.push(rowCounts.map(c => total ? Math.round(10000 * c / total) / 100 : 0));
    }

    const grandTotal = rowTotals.reduce((s, n) => s + n, 0);
    const rowShare   = rowTotals.map(t => grandTotal ? Math.round(10000 * t / grandTotal) / 100 : 0);

    return { rowKeys, topKeys, topSpan, leafKeys, counts, percents, rowTotals, grandTotal, rowShare, hasSecondLevel, overflow };
  }

  private computeSelectedVsOthers(): void {
    const selectedIds = this.getSelectedIdsForDim(this.rowDim);
    if (!selectedIds.length) { this.selectedVsOthers = { selected: 0, others: 0, total: 0, pctSel: 0 }; return; }

    let base = this.activeData.slice(0);

    if (this.rowDim !== 'City' && this.selectedCityIds.length) {
      const s = new Set(this.selectedCityIds); base = base.filter(x => s.has(x.cityId));
    }
    if (this.rowDim !== 'Hospital' && this.selectedHospitalIds.length) {
      const s = new Set(this.selectedHospitalIds); base = base.filter(x => s.has(x.hospitalId));
    }
    if (this.rowDim !== 'Organization' && this.selectedOrganizationIds.length) {
      const s = new Set(this.selectedOrganizationIds); base = base.filter(x => x.organizationId && s.has(x.organizationId));
    }
    if (this.rowDim !== 'Diagnosis' && this.selectedDiagnosisIds.length) {
      const s = new Set(this.selectedDiagnosisIds); base = base.filter(x => s.has(x.diagnosisId));
    }
    if (this.rowDim !== 'Report' && this.selectedReportCodes.length) {
      const s = new Set(this.selectedReportCodes); base = base.filter(x => s.has(x.reportCode));
    }
    if (this.rowDim !== 'State' && this.selectedStates.length) {
      const s = new Set(this.selectedStates); base = base.filter(x => s.has(x.stateId));
    }

    const selSet = new Set(selectedIds);
    let sel = 0, oth = 0;
    const seenSel: Record<string, true> = {};
    const seenOth: Record<string, true> = {};

    for (const r of base) {
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
