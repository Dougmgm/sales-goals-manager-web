import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'metas' },
  {
    path: 'metas',
    title: 'Metas · Sales Goals Manager',
    loadComponent: () => import('./features/metas/meta-list.component').then((m) => m.MetaListComponent),
  },
  {
    path: 'metas/nova',
    title: 'Nova meta · Sales Goals Manager',
    loadComponent: () => import('./features/metas/meta-form.component').then((m) => m.MetaFormComponent),
  },
  {
    path: 'metas/:id/editar',
    title: 'Editar meta · Sales Goals Manager',
    loadComponent: () => import('./features/metas/meta-form.component').then((m) => m.MetaFormComponent),
  },
  {
    path: 'produtos',
    title: 'Produtos · Sales Goals Manager',
    loadComponent: () => import('./features/produtos/produtos.component').then((m) => m.ProdutosComponent),
  },
  {
    path: 'vendedores',
    title: 'Vendedores · Sales Goals Manager',
    loadComponent: () => import('./features/vendedores/vendedores.component').then((m) => m.VendedoresComponent),
  },
  { path: '**', redirectTo: 'metas' },
];
