import { Component, input, signal } from '@angular/core';

@Component({
  selector: 'dd-copy-button',
  standalone: true,
  template: `<button class="secondary-button" type="button" (click)="copy()">{{ copied() ? 'Copied' : label() }}</button>`
})
export class CopyButtonComponent {
  readonly text = input.required<string>();
  readonly label = input('Copy');
  readonly copied = signal(false);
  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.text());
      this.copied.set(true);
      window.setTimeout(() => this.copied.set(false), 1400);
    } catch { this.copied.set(false); }
  }
}
