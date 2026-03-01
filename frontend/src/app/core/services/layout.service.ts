import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  // Signal to track sidebar state. Default is open (true).
  private sidebarOpenSignal = signal<boolean>(true);

  // Read-only signal for consumers
  readonly isSidebarOpen = this.sidebarOpenSignal.asReadonly();

  toggleSidebar() {
    this.sidebarOpenSignal.update((value) => !value);
  }

  setSidebarState(isOpen: boolean) {
    this.sidebarOpenSignal.set(isOpen);
  }
}
