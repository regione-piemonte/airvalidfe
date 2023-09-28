/*
 *Copyright Regione Piemonte - 2023
 *SPDX-License-Identifier: EUPL-1.2-or-later
 */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BodyComponent } from './body/body.component';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { MainContentComponent } from './main-content/main-content.component';
import { SideBarComponent } from './side-bar/side-bar.component';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatStepperModule } from '@angular/material/stepper';
import { MatListModule } from '@angular/material/list';
import { MatRadioModule } from '@angular/material/radio';
import { PageTitleComponent } from './page-title/page-title.component';
import { SidenavMainMenuComponent } from './sidenav-main-menu/sidenav-main-menu.component';
import { TableExampleComponent } from './table-example/table-example.component';
import { TranslateModule } from '@ngx-translate/core'
import { UserInitial } from '../helpers/pipes/userInitial';

const materialModules = [
  MatIconModule,
  MatButtonModule,
  MatCardModule,
  MatDialogModule,
  MatExpansionModule,
  MatToolbarModule,
  MatSidenavModule,
  MatTabsModule,
  MatStepperModule,
  MatTableModule,
  MatSortModule,
  MatSnackBarModule,
  MatSelectModule,
  MatProgressSpinnerModule,
  MatPaginatorModule,
  MatInputModule,
  MatCardModule,
  MatListModule,
  MatRadioModule,
  MatTooltipModule,
  MatMenuModule,
  MatGridListModule,
]

@NgModule({
  declarations: [
    HeaderComponent,
    FooterComponent,
    SideBarComponent,
    BodyComponent,
    MainContentComponent,
    PageTitleComponent,
    SidenavMainMenuComponent,
    TableExampleComponent,
    UserInitial
  ],
  imports: [
    CommonModule,
    RouterModule,
    materialModules,
    TranslateModule
  ],
  exports: [BodyComponent,UserInitial],
})
export class CoreComponentsModule {}
