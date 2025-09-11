import { Component, OnInit } from '@angular/core';

type DimId = 'City' | 'Hospital' | 'Diagnosis' | 'Report';

interface City   { id: string; code: number; name: string; }
interface Hosp   { id: string; code: number; name: string; cityId: string; }
interface Diag   { id: string; code: string;  name: string; }
interface ReportRow {
  reportId: string;
  reportCode: number;
  cityId: string;      cityName: string;
  hospitalId: string;  hospitalName: string;
  diagnosisId: string; diagnosisName: string;
  reportCreated: Date;
}

interface StatRowDto {
  label1?: string;
  label2?: string | null;
  count: number;
  percent: number;
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
  colDim: DimId | null = null;

  // ---- Kriter seçimleri (CSV ile dolduruyoruz) ----
  selectedCityIds: string[] = [];
  selectedHospitalIds: string[] = [];
  selectedDiagnosisIds: string[] = [];
  selectedReportCodes: number[] = [];

  // ---- Mock lookuplar ----
  cities: City[] = [];
  hospitals: Hosp[] = [];
  diagnoses: Diag[] = [];

  // ---- Veri setleri ----
  private allData: ReportRow[] = [];
  activeData: ReportRow[] = [];      // tarih ile süzülmüş

  // ---- Sonuçlar ----
  rows: StatRowDto[] = [];
  totalCount = 0;

  // ---- “Seçilen vs Diğerleri” (satır boyutu için) ----
  selectedVsOthers = { selected: 0, others: 0, total: 0, pctSel: 0 };

  // ---- Metin haritası ----
  dimTextMap: { [k in DimId]: string } = {
    City: 'Şehir',
    Hospital: 'Hastane',
    Diagnosis: 'Tanı',
    Report: 'Rapor'
  };

  // ======================================================
  // Lifecycle
  // ======================================================
  ngOnInit(): void {
    this.seedLookups();
    this.seedReports(240);        // 240 rapor (son ~60 güne yay)
    this.initDefaultDates();      // varsayılan tarih: son 30 gün
    this.onSaveDate();            // aktifData’yı doldur
  }

  // ======================================================
  // Mock üretimi
  // ======================================================
  private _seed = 42;
  private rnd(): number {
    // deterministik “random”
    this._seed = (this._seed * 1664525 + 1013904223) % 4294967296;
    return this._seed / 4294967296;
  }
  private pick<T>(arr: T[]): T {
    return arr[Math.floor(this.rnd() * arr.length)];
  }

  private seedLookups(): void {
    // 50 şehir
    const cityBaseNames = [
      'Adana','Adıyaman','Afyonkarahisar','Ağrı','Amasya','Ankara','Antalya','Artvin','Aydın','Balıkesir',
      'Bilecik','Bingöl','Bitlis','Bolu','Burdur','Bursa','Çanakkale','Çankırı','Çorum','Denizli',
      'Diyarbakır','Edirne','Elazığ','Erzincan','Erzurum','Eskişehir','Gaziantep','Giresun','Gümüşhane','Hakkari',
      'Hatay','Isparta','Mersin','İstanbul','İzmir','Kars','Kastamonu','Kayseri','Kırklareli','Kırşehir',
      'Kocaeli','Konya','Kütahya','Malatya','Manisa','Kahramanmaraş','Mardin','Muğla','Muş','Nevşehir'
    ];
    const cities: City[] = [];
    for (let i = 0; i < 50; i++) {
      const code = 100 + i;
      const name = cityBaseNames[i % cityBaseNames.length];
      cities.push({ id: 'C' + code, code, name });
    }
    this.cities = cities;

    // 50 hastane (her şehirden en az birkaçı)
    const hospitals: Hosp[] = [];
    let hc = 1;
    for (let i = 0; i < this.cities.length; i++) {
      const perCity = 1 + Math.floor(this.rnd() * 2); // şehir başına 1-2 hastane
      for (let k = 0; k < perCity; k++) {
        const code = 500 + hc;
        const name = this.cities[i].name + ' ' + (k % 2 === 0 ? 'Şehir Hastanesi' : 'EAH');
        hospitals.push({
          id: 'H' + code,
          code,
          name,
          cityId: this.cities[i].id
        });
        hc++;
        if (hospitals.length >= 50) break;
      }
      if (hospitals.length >= 50) break;
    }
    // Eğer 50’den az kaldıysa rastgele ekle
    while (hospitals.length < 50) {
      const ci = this.pick(this.cities);
      const code = 500 + hospitals.length + 1;
      hospitals.push({
        id: 'H' + code,
        code,
        name: ci.name + ' Hastanesi ' + (1 + Math.floor(this.rnd() * 3)),
        cityId: ci.id
      });
    }
    this.hospitals = hospitals;

    // 10 tanı
    const diagList: Diag[] = [
      { id: 'D01', code: 'J11', name: 'Grip' },
      { id: 'D02', code: 'I10', name: 'Primer hipertansiyon' },
      { id: 'D03', code: 'K52', name: 'Enterit ve kolit' },
      { id: 'D04', code: 'E11', name: 'Tip 2 Diyabet' },
      { id: 'D05', code: 'J20', name: 'Akut bronşit' },
      { id: 'D06', code: 'M54', name: 'Dorsalji' },
      { id: 'D07', code: 'N39', name: 'Üriner sistem enf.' },
      { id: 'D08', code: 'L70', name: 'Akne' },
      { id: 'D09', code: 'G43', name: 'Migren' },
      { id: 'D10', code: 'K21', name: 'GÖRH' },
    ];
    this.diagnoses = diagList;
  }

  private seedReports(count: number): void {
    const out: ReportRow[] = [];
    const today = new Date();
    const maxDays = 60; // son 60 güne yay

    for (let i = 0; i < count; i++) {
      const city = this.pick(this.cities);
      // ilgili şehrin hastanelerinden birini al
      const hlist = this.hospitals.filter(function(h){ return h.cityId === city.id; });
      const hosp  = this.pick(hlist.length ? hlist : this.hospitals);
      const diag  = this.pick(this.diagnoses);

      const daysBack = Math.floor(this.rnd() * maxDays); // 0..59
      const created = new Date(today.getTime() - daysBack * 86400000);
      created.setHours(10 + Math.floor(this.rnd() * 8), Math.floor(this.rnd() * 60), Math.floor(this.rnd() * 60), 0);

      const code = 1000 + i;
      out.push({
        reportId: 'R' + (i + 1),
        reportCode: code,
        cityId: city.id,        cityName: city.name,
        hospitalId: hosp.id,    hospitalName: hosp.name,
        diagnosisId: diag.id,   diagnosisName: diag.name,
        reportCreated: created
      });
    }

    this.allData = out;
  }

  // ======================================================
  // Tarih yardımcıları
  // ======================================================
  private pad2(n: number) { return n < 10 ? '0' + n : '' + n; }
  private toInputDate(d: Date) {
    return d.getFullYear() + '-' + this.pad2(d.getMonth() + 1) + '-' + this.pad2(d.getDate());
  }
  private parseInputDateStart(s: string): Date {
    const parts = s.split('-');
    const y = +parts[0], m = +parts[1] - 1, d = +parts[2];
    return new Date(y, m, d, 0, 0, 0, 0);
  }
  private parseInputDateEnd(s: string): Date {
    const parts = s.split('-');
    const y = +parts[0], m = +parts[1] - 1, d = +parts[2];
    return new Date(y, m, d, 23, 59, 59, 999);
  }
  private initDefaultDates(): void {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 86400000); // son 30 gün
    this.startDateStr = this.toInputDate(start);
    this.endDateStr   = this.toInputDate(end);
  }

  onSaveDate(): void {
    if (!this.startDateStr || !this.endDateStr) { this.activeData = []; this.rows = []; this.selectedVsOthers = {selected:0, others:0, total:0, pctSel:0}; return; }
    const start = this.parseInputDateStart(this.startDateStr);
    const end   = this.parseInputDateEnd(this.endDateStr);
    const s = start.getTime(), e = end.getTime();

    const out: ReportRow[] = [];
    for (let i = 0; i < this.allData.length; i++) {
      const t = this.allData[i].reportCreated.getTime();
      if (t >= s && t <= e) out.push(this.allData[i]);
    }
    this.activeData = out;

    // Tarih değişince otomatik bir ilk hesap
    this.run();
  }

  // ======================================================
  // CSV input handler’ları
  // ======================================================
  private parseCsvStrings(v: string): string[] {
    if (!v) return [];
    return v.split(',').map(function(x){ return x.trim(); }).filter(function(x){ return !!x; });
  }
  private parseCsvNumbers(v: string): number[] {
    if (!v) return [];
    return v.split(',').map(function(x){ return parseInt(x.trim(), 10); }).filter(function(n){ return !isNaN(n); });
  }

  onCityChange(e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    // ad veya id gelebilir; mock’ta şehir id = "Cxxx", ad ise "Ankara"
    // kolaylık: önce ada göre eşle, yoksa direkt id kabul et
    const names = this.parseCsvStrings(v);
    const ids: string[] = [];
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const byName = this.cities.find(function(c){ return c.name.toLowerCase() === name.toLowerCase() || c.id === name; });
      if (byName) ids.push(byName.id);
    }
    this.selectedCityIds = ids;
  }
  onHospitalChange(e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    const names = this.parseCsvStrings(v);
    const ids: string[] = [];
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const byName = this.hospitals.find(function(h){ return h.name.toLowerCase() === name.toLowerCase() || h.id === name; });
      if (byName) ids.push(byName.id);
    }
    this.selectedHospitalIds = ids;
  }
  onDiagnosisChange(e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    const names = this.parseCsvStrings(v);
    const ids: string[] = [];
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const byName = this.diagnoses.find(function(d){ return d.name.toLowerCase() === name.toLowerCase() || d.code.toLowerCase() === name.toLowerCase() || d.id === name; });
      if (byName) ids.push(byName.id);
    }
    this.selectedDiagnosisIds = ids;
  }
  onReportCodeChange(e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    this.selectedReportCodes = this.parseCsvNumbers(v);
  }

  // ======================================================
  // Hesap (kırılım + seçilen vs diğerleri)
  // ======================================================
  run(): void {
    // 1) Önce tüm kriterlerle filtrele (hepsi)
    let filtered = this.activeData.slice(0);

    if (this.selectedCityIds.length) {
      const s = new Set(this.selectedCityIds);
      filtered = filtered.filter(function(x){ return s.has(x.cityId); });
    }
    if (this.selectedHospitalIds.length) {
      const s = new Set(this.selectedHospitalIds);
      filtered = filtered.filter(function(x){ return s.has(x.hospitalId); });
    }
    if (this.selectedDiagnosisIds.length) {
      const s = new Set(this.selectedDiagnosisIds);
      filtered = filtered.filter(function(x){ return s.has(x.diagnosisId); });
    }
    if (this.selectedReportCodes.length) {
      const s = new Set(this.selectedReportCodes);
      filtered = filtered.filter(function(x){ return s.has(x.reportCode); });
    }

    // 2) Kırılım tablosu
    this.rows = this.computeStats(filtered, this.rowDim, this.colDim);
    this.totalCount = this.rows.reduce(function(sum, r){ return sum + r.count; }, 0);

    // 3) “Seçilen vs Diğerleri” (sadece rowDim üzerinde)
    this.computeSelectedVsOthers();
  }

  private computeStats(list: ReportRow[], d1: DimId, d2: DimId | null): StatRowDto[] {
    const out: StatRowDto[] = [];
    if (!d2) {
      const map: { [label: string]: { [rid: string]: true } } = {};
      for (let i = 0; i < list.length; i++) {
        const lab = this.labelFor(list[i], d1);
        (map[lab] = map[lab] || {})[list[i].reportId] = true;
      }
      for (const k in map) out.push({ label1: k, label2: null, count: Object.keys(map[k]).length, percent: 0 });
      // yüzde toplam içinden
      const total = out.reduce(function(s, r){ return s + r.count; }, 0);
      for (let i = 0; i < out.length; i++) out[i].percent = total ? Math.round(10000 * out[i].count / total) / 100 : 0;
      out.sort(function(a,b){ return (b.count - a.count) || (a.label1! < b.label1! ? -1 : 1); });
      return out;
    }

    // çift kırılım
    const outer: { [l1: string]: { [l2: string]: { [rid: string]: true } } } = {};
    for (let i = 0; i < list.length; i++) {
      const l1 = this.labelFor(list[i], d1);
      const l2 = this.labelFor(list[i], d2);
      ((outer[l1] = outer[l1] || {})[l2] = (outer[l1][l2] || {}))[list[i].reportId] = true;
    }
    for (const l1 in outer) {
      for (const l2 in outer[l1]) {
        out.push({ label1: l1, label2: l2, count: Object.keys(outer[l1][l2]).length, percent: 0 });
      }
    }
    // yüzde: satır içi normalize
    const totals: { [l1: string]: number } = {};
    for (let i = 0; i < out.length; i++) {
      const k = out[i].label1 || '';
      totals[k] = (totals[k] || 0) + out[i].count;
    }
    for (let i = 0; i < out.length; i++) {
      const t = totals[out[i].label1 || ''] || 0;
      out[i].percent = t ? Math.round(10000 * out[i].count / t) / 100 : 0;
    }
    out.sort(function(a,b){
      const c1 = (a.label1! < b.label1! ? -1 : 1);
      if (a.label1 === b.label1) {
        const c2 = (b.count - a.count);
        if (c2 !== 0) return c2;
        return (a.label2! < b.label2! ? -1 : 1);
      }
      return c1;
    });
    return out;
  }

  private labelFor(r: ReportRow, d: DimId): string {
    if (d === 'City') return r.cityName;
    if (d === 'Hospital') return r.hospitalName;
    if (d === 'Diagnosis') return r.diagnosisName;
    return '' + r.reportCode;
  }

  private computeSelectedVsOthers(): void {
    // RowDim için seçilmiş bir şey yoksa sıfırla ve çık
    const selectedIds = this.getSelectedIdsForDim(this.rowDim);
    if (!selectedIds.length) {
      this.selectedVsOthers = { selected: 0, others: 0, total: 0, pctSel: 0 };
      return;
    }

    // “diğer”i hesaplamak için: rowDim dışındaki kriterleri uygula, rowDim’i ayır
    let base = this.activeData.slice(0);

    // diğer kriterler
    if (this.rowDim !== 'City' && this.selectedCityIds.length) {
      const s = new Set(this.selectedCityIds);
      base = base.filter(function(x){ return s.has(x.cityId); });
    }
    if (this.rowDim !== 'Hospital' && this.selectedHospitalIds.length) {
      const s = new Set(this.selectedHospitalIds);
      base = base.filter(function(x){ return s.has(x.hospitalId); });
    }
    if (this.rowDim !== 'Diagnosis' && this.selectedDiagnosisIds.length) {
      const s = new Set(this.selectedDiagnosisIds);
      base = base.filter(function(x){ return s.has(x.diagnosisId); });
    }
    if (this.rowDim !== 'Report' && this.selectedReportCodes.length) {
      const s = new Set(this.selectedReportCodes);
      base = base.filter(function(x){ return s.has(x.reportCode); });
    }

    // seçilen ve diğer ayırımı
    const selSet = new Set(selectedIds);
    let sel = 0;
    let oth = 0;
    const seenSel: { [rid: string]: true } = {};
    const seenOth: { [rid: string]: true } = {};

    for (let i = 0; i < base.length; i++) {
      const r = base[i];
      let isSel = false;
      if (this.rowDim === 'City')      isSel = selSet.has(r.cityId);
      else if (this.rowDim === 'Hospital')  isSel = selSet.has(r.hospitalId);
      else if (this.rowDim === 'Diagnosis') isSel = selSet.has(r.diagnosisId);
      else if (this.rowDim === 'Report')    isSel = selSet.has('' + r.reportCode);

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
    if (d === 'Diagnosis') return this.selectedDiagnosisIds.slice(0);
    if (d === 'Report') return this.selectedReportCodes.map(function(n){ return '' + n; });
    return [];
  }
}
