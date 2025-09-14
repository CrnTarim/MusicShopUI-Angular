import { Component } from '@angular/core';
import { ReportService } from '../../services/report.service';
import { ReportEager } from '../../models/reporteager';

@Component({
  selector: 'app-reportgrid',
  templateUrl: './reportgrid.component.html',
  styleUrl: './reportgrid.component.css'
})
export class ReportgridComponent {

  reportEager = new ReportEager();
  reportEagerlist: ReportEager[]= [];
  constructor(private reportService: ReportService) { }

   ngOnInit(): void {
    this.getReportsEager();
    console.log(this.reportEagerlist);
    console.log("reprotgrid");

  }

  getReportsEager()
  {
    this.reportService.getReportEager().subscribe({
      next: data => {
          console.log('data geldi:', data);   // <-- burada dolu
          this.reportEagerlist = data ?? [];  // API null dönerse emniyet
        },
      error: err => console.error(err)
        })
  }
}
