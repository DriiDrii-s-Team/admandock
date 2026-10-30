import { Component, computed, inject, signal } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';
import { CopyButtonComponent } from '../../shared/components/copy-button.component';
import { EditorComponent } from '../../shared/components/editor.component';
import { inspectJson } from './json-processor';

@Component({
  standalone: true,
  imports: [EditorComponent, CopyButtonComponent],
  template: `
    <div class="json-explorer">
      <div class="tool-page-heading">
        <div>
          <div class="eyebrow">{{ i18n.t('jsonEyebrow') }}</div>
          <h1>JSON Explorer</h1>
          <p>{{ i18n.t('jsonDescription') }}</p>
        </div>
        <span class="local-badge"><span class="status-dot"></span>{{ i18n.t('local') }}</span>
      </div>

      <div class="json-actions" role="toolbar" aria-label="JSON actions">
        <button class="primary-button" type="button" [disabled]="!inspection().valid" (click)="format()">{{ i18n.t('jsonFormat') }}</button>
        <button class="secondary-button" type="button" [disabled]="!inspection().valid" (click)="minify()">{{ i18n.t('jsonMinify') }}</button>
        <button class="secondary-button" type="button" [disabled]="!input() && !output()" (click)="clear()">{{ i18n.t('jsonClear') }}</button>
      </div>

      <div class="json-workspace">
        <dd-editor
          inputId="json-input"
          [label]="i18n.t('jsonInput')"
          [placeholder]="i18n.t('jsonPaste')"
          [value]="input()"
          (valueChange)="setInput($event)"
        />
        <div class="json-output">
          <div class="editor-column">
            <div class="editor-toolbar">
              <strong>{{ i18n.t('jsonOutput') }}</strong>
              @if (output()) {
                <dd-copy-button [text]="output()" [label]="i18n.t('jsonCopy')" />
              }
            </div>
            @if (output()) {
              <dd-editor
                inputId="json-output"
                [label]="i18n.t('jsonOutput')"
                [value]="output()"
                [readonly]="true"
              />
            } @else {
              <div class="json-output-empty">{{ i18n.t('jsonEmptyOutput') }}</div>
            }
          </div>
        </div>
      </div>

      <div class="json-feedback" aria-live="polite">
        @if (inspection(); as result) {
          @if (!input().trim()) {
            <span>{{ i18n.t('jsonEmpty') }}</span>
          } @else if (result.valid) {
            <span class="json-valid"><span class="status-dot"></span>{{ i18n.t('jsonValid') }}</span>
          } @else {
            <span class="json-invalid"><span class="status-dot"></span>{{ i18n.t('jsonInvalid') }}</span>
            <span>{{ result.message }}</span>
            @if (result.line !== null) {
              <span>({{ i18n.t('jsonErrorAt') }} {{ result.line }}, {{ i18n.t('jsonColumn') }} {{ result.column }})</span>
            }
          }
        }
      </div>
      <div class="notice"><span>{{ i18n.t('jsonPrivacy') }}</span></div>
    </div>
  `
})
export class JsonExplorerComponent {
  readonly i18n = inject(I18nService);
  readonly input = signal('');
  readonly output = signal('');
  readonly inspection = computed(() => inspectJson(this.input()));

  setInput(value: string): void {
    this.input.set(value);
    this.output.set('');
  }

  format(): void {
    const result = this.inspection();
    if (result.valid) this.output.set(result.formatted);
  }

  minify(): void {
    const result = this.inspection();
    if (result.valid) this.output.set(result.minified);
  }

  clear(): void {
    this.input.set('');
    this.output.set('');
  }
}
