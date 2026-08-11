import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { KnowledgeBaseComponent } from './pages/knowledge-base/knowledge-base.component';
import { KnowledgeDetailComponent } from './pages/knowledge-detail/knowledge-detail.component';
import { AccountComponent } from './pages/account/account.component';
import { LegalPageComponent } from './pages/legal-page/legal-page.component';
import { FeaturesComponent } from './pages/features/features.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'TestingView.com' },
  { path: 'features', component: FeaturesComponent, title: 'Features — TestingView.com' },
  { path: 'knowledge-base', component: KnowledgeBaseComponent },
  { path: 'knowledge-base/:slug', component: KnowledgeDetailComponent },
  { path: 'account', component: AccountComponent },
  { path: 'terms', component: LegalPageComponent, data: { page: 'terms' } },
  { path: 'privacy', component: LegalPageComponent, data: { page: 'privacy' } },
  { path: 'refund-policy', component: LegalPageComponent, data: { page: 'refund' } },
  { path: 'accessibility', component: LegalPageComponent, data: { page: 'accessibility' } },
  { path: '**', redirectTo: '' },
];
