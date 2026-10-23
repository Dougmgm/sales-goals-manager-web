import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ConfirmDialogComponent } from './shared/confirm-dialog.component';
import { ToastHostComponent } from './shared/toast-host.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastHostComponent, ConfirmDialogComponent],
  template: `
    <a class="skip" href="#conteudo">Ir para o conteúdo</a>
    <div class="shell">
      <aside class="side">
        <a class="brand" routerLink="/metas">
          <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
            <rect x="6" y="18" width="5" height="8" fill="#f2b705" />
            <rect x="13.5" y="12" width="5" height="14" fill="#f2b705" />
            <rect x="21" y="6" width="5" height="20" fill="#f2b705" />
          </svg>
          <span>Sales Goals<br />Manager</span>
        </a>
        <nav aria-label="Principal">
          <a routerLink="/metas" routerLinkActive="on">Metas</a>
          <a routerLink="/produtos" routerLinkActive="on">Produtos</a>
          <a routerLink="/vendedores" routerLinkActive="on">Vendedores</a>
        </nav>
      </aside>
      <main class="main" id="conteudo" tabindex="-1">
        <router-outlet />
      </main>
    </div>
    <app-toast-host />
    <app-confirm-dialog />
  `,
  styles: [
    `
      .skip {
        position: absolute;
        left: -999px;
        top: 0;
        background: var(--gold);
        color: var(--ink);
        padding: 0.5rem 1rem;
        z-index: 100;
      }
      .skip:focus { left: 0.5rem; top: 0.5rem; }
      .shell { display: grid; grid-template-columns: 15rem 1fr; min-height: 100vh; }
      .side {
        background: var(--slate);
        color: #fff;
        padding: 1.5rem 1rem;
        display: flex;
        flex-direction: column;
        gap: 2rem;
        position: sticky;
        top: 0;
        height: 100vh;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        color: #fff;
        text-decoration: none;
        font-weight: 700;
        line-height: 1.15;
        padding: 0 0.5rem;
      }
      nav { display: grid; gap: 0.25rem; }
      nav a {
        color: #d5dce5;
        text-decoration: none;
        padding: 0.65rem 0.75rem;
        border-radius: 6px;
        border-left: 3px solid transparent;
        font-weight: 500;
      }
      nav a:hover { background: rgb(255 255 255 / 0.08); color: #fff; }
      nav a.on { background: rgb(255 255 255 / 0.12); color: #fff; border-left-color: var(--gold); }
      nav a:focus-visible, .brand:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
      .main { padding: 2rem clamp(1rem, 3vw, 2.5rem) 4rem; min-width: 0; max-width: 72rem; width: 100%; }
      .main:focus { outline: none; }

      @media (max-width: 860px) {
        .shell { grid-template-columns: 1fr; }
        .side {
          position: static;
          height: auto;
          flex-direction: row;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.75rem 1.5rem;
          padding: 0.75rem 1rem;
        }
        nav { grid-auto-flow: column; }
        nav a { border-left: 0; border-bottom: 3px solid transparent; border-radius: 4px; }
        nav a.on { border-bottom-color: var(--gold); }
      }
    `,
  ],
})
export class App {}
