import { Component, computed, inject, signal } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';
import { EditorComponent } from '../../shared/components/editor.component';
import { JsonChange, diffJson } from './json-diff-processor';

@Component({
  standalone: true,
  imports: [EditorComponent],
  template: `
    <div class="json-diff">
      <div class="tool-page-heading">
        <div>
          <div class="eyebrow">{{ i18n.t('jsonDiffEyebrow') }}</div>
          <h1>JSON Diff</h1>
          <p>{{ i18n.t('jsonDiffDescription') }}</p>
        </div>
        <span class="local-badge"><span class="status-dot"></span>{{ i18n.t('local') }}</span>
      </div>

      <div class="json-actions" role="toolbar" aria-label="JSON diff actions">
        <button class="secondary-button" type="button" [disabled]="!left() && !right()" (click)="clear()">{{ i18n.t('jsonClear') }}</button>
        <button class="secondary-button" type="button" [disabled]="!left() && !right()" (click)="swap()">{{ i18n.t('jsonDiffSwap') }}</button>
      </div>

      <div class="json-diff-inputs">
        <dd-editor
          inputId="json-diff-left"
          [label]="i18n.t('jsonDiffLeft')"
          [placeholder]="i18n.t('jsonPaste')"
          [value]="left()"
          (valueChange)="left.set($event)"
        />
        <dd-editor
          inputId="json-diff-right"
          [label]="i18n.t('jsonDiffRight')"
          [placeholder]="i18n.t('jsonPaste')"
          [value]="right()"
          (valueChange)="right.set($event)"
        />
      </div>

      <section class="json-diff-results" aria-live="polite">
        <div class="json-diff-results-header">
          <h2>{{ i18n.t('jsonDiffResults') }}</h2>
          @if (result(); as diff) {
            @if (diff.valid) {
              <div class="json-diff-counts">
                <span class="diff-added">{{ i18n.t('jsonDiffAdded') }} {{ count('added', diff.changes) }}</span>
                <span class="diff-removed">{{ i18n.t('jsonDiffRemoved') }} {{ count('removed', diff.changes) }}</span>
                <span class="diff-changed">{{ i18n.t('jsonDiffChanged') }} {{ count('changed', diff.changes) }}</span>
              </div>
            }
          }
        </div>

        @if (!left().trim() || !right().trim()) {
          <div class="json-diff-empty">{{ i18n.t('jsonDiffPrompt') }}</div>
        } @else if (result(); as diff) {
          @if (!diff.valid) {
            <div class="json-diff-error">
              <span class="json-invalid"><span class="status-dot"></span>{{ i18n.t('jsonInvalid') }}</span>
              <strong>{{ diff.side === 'left' ? i18n.t('jsonDiffLeft') : i18n.t('jsonDiffRight') }}</strong>
              <span>{{ diff.message }}</span>
            </div>
          } @else if (!diff.changes.length) {
            <div class="json-diff-empty json-diff-same"><span class="json-valid"><span class="status-dot"></span>{{ i18n.t('jsonDiffIdentical') }}</span></div>
          } @else {
            <div class="json-diff-list">
              @for (change of diff.changes; track change.path + change.kind) {
                <article class="json-diff-item" [class]="change.kind">
                  <div class="json-diff-item-heading">
                    <span class="json-diff-kind">{{ label(change.kind) }}</span>
                    <code>{{ change.path }}</code>
                  </div>
                  @if (change.kind !== 'added') {
                    <div class="json-diff-value diff-before"><span>{{ i18n.t('jsonDiffBefore') }}</span><code>{{ change.before }}</code></div>
                  }
                  @if (change.kind !== 'removed') {
                    <div class="json-diff-value diff-after"><span>{{ i18n.t('jsonDiffAfter') }}</span><code>{{ change.after }}</code></div>
                  }
                </article>
              }
            </div>
          }
        }
      </section>

      <div class="notice"><span>{{ i18n.t('jsonPrivacy') }}</span></div>
    </div>
  `
})
export class JsonDiffComponent {
  readonly i18n = inject(I18nService);
  readonly left = signal('');
  readonly right = signal('');
  readonly result = computed(() => {
    if (!this.left().trim() || !this.right().trim()) return null;
    return diffJson(this.left(), this.right());
  });

  count(kind: JsonChange['kind'], changes: JsonChange[]): number {
    return changes.filter(change => change.kind === kind).length;
  }

  label(kind: JsonChange['kind']): string {
    const labels = {
      added: 'jsonDiffAdded',
      removed: 'jsonDiffRemoved',
      changed: 'jsonDiffChanged'
    } as const;
    return this.i18n.t(labels[kind]);
  }

  clear(): void {
    this.left.set('');
    this.right.set('');
  }

  swap(): void {
    const previousLeft = this.left();
    this.left.set(this.right());
    this.right.set(previousLeft);
  }
}
