import { Component } from '@angular/core';
import { ReportService } from '../../services/report.service';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrl: './report.component.css'
})
export class ReportComponent {

  constructor(private reportService:ReportService){}

    

    ngOnInit(): void {
           
  }
}
