<ng-container *ngIf="false">
  <!-- Arama Çubuğu -->
  <div class="container" style="margin-top: 20px;">
    <h3>Şarkıcılar</h3>

    <div class="mb-3">
      <input
        type="text"
        class="form-control"
        [(ngModel)]="searchTerm"
        placeholder="Şarkıcı adı ile ara"
      />
    </div>

    <div class="singer-list-container">
      <div class="list-group">
        <div class="list-group-item" *ngFor="let singer of singers | singerSearch: searchTerm | orderBy: 'name'">
          <div class="d-flex justify-content-between align-items-center">
            <span>{{ singer.name }}</span>
            <button class="btn btn-info" (click)="singer.id && toggleCard(singer.id)">
              Info
            </button>
          </div>

          <div class="card mt-2" *ngIf="selectedSingerId === singer.id">
            <div class="card-body">
              <h5 class="card-title">{{ singer.name }}</h5>
              <p class="card-text">infoinfo</p>
              <button class="btn btn-info" [routerLink]="['/singer-profile', singer.id]">
                View Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</ng-container>
