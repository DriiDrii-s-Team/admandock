import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { LogEntry, LogFilterState, LogSourceFormat } from '../models/log-entry.model';
import { LogAnalyzerService } from '../services/log-analyzer.service';

type LogSamplePreset = {
  label: string;
  content: string;
};

@Component({
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="log-analyzer-page">
      <style>
        .log-analyzer-page { display: grid; gap: 1.25rem; }
        .tool-page-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
        .tool-page-heading h1 { margin: 0.25rem 0; font-size: clamp(2rem, 3vw, 2.6rem); }
        .tool-page-heading p { margin: 0; color: #a8b3c7; }
        .local-badge { display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(16, 185, 129, 0.12); color: #7ee7b5; padding: 0.45rem 0.8rem; border: 1px solid rgba(16,185,129,0.35); border-radius: 999px; font-size: 0.8rem; }
        .status-dot { width: 0.55rem; height: 0.55rem; border-radius: 50%; background: currentColor; display: inline-block; }
        .log-import-panel, .log-panel, .log-details, .log-list-panel, .log-help-panel { background: rgba(15, 23, 42, 0.72); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 18px; }
        .log-import-panel { padding: 1rem; display: grid; gap: 1rem; }
        .log-toolbar { display: flex; flex-wrap: wrap; gap: 0.75rem; }
        .log-help-panel { padding: 1rem; display: grid; gap: 1rem; }
        .help-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
        .help-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
        .help-card { background: rgba(15, 23, 42, 0.5); border: 1px solid rgba(148,163,184,0.15); border-radius: 12px; padding: 0.9rem; }
        .help-card h3 { margin: 0 0 0.6rem; font-size: 1rem; }
        .help-card ul { margin: 0; padding-left: 1.1rem; color: #dfe7ff; display: grid; gap: 0.35rem; }
        .help-card code { background: rgba(148,163,184,0.12); border-radius: 6px; padding: 0.1rem 0.35rem; }
        .preset-list { display: flex; flex-wrap: wrap; gap: 0.75rem; }
        .preset-button { border: 1px solid rgba(148,163,184,0.2); background: rgba(15,23,42,0.55); color: #e2e8f0; border-radius: 10px; padding: 0.65rem 0.8rem; cursor: pointer; }
        .primary-button, .secondary-button { border: none; border-radius: 10px; padding: 0.72rem 1rem; cursor: pointer; font-weight: 600; }
        .primary-button { background: linear-gradient(135deg, #7c4dff, #4f46e5); color: white; }
        .secondary-button { background: rgba(148,163,184,0.12); color: #e2e8f0; border: 1px solid rgba(148,163,184,0.15); }
        .secondary-button:disabled, .primary-button:disabled { opacity: 0.5; cursor: not-allowed; }
        .log-upload-row { display: flex; align-items: center; justify-content: space-between; gap: 0.8rem; flex-wrap: wrap; }
        .log-file-meta { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; color: #dfe7ff; }
        .log-file-meta strong { color: #f8fafc; }
        .hidden-file-input { display: none; }
        .log-analysis { display: grid; grid-template-columns: 1.2fr 2.3fr; gap: 1rem; }
        .log-panel { padding: 1rem; }
        .log-panel h2 { margin: 0 0 0.75rem; font-size: 1.1rem; }
        .log-sample-box { width: 100%; min-height: 240px; resize: vertical; background: rgba(2, 6, 23, 0.55); color: #e2e8f0; border: 1px solid rgba(148,163,184,0.2); border-radius: 12px; padding: 0.9rem; font-family: 'SFMono-Regular', Consolas, monospace; }
        .log-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 0.75rem; }
        .log-metric { padding: 0.8rem; border-radius: 12px; background: rgba(15, 23, 42, 0.65); border: 1px solid rgba(148,163,184,0.2); }
        .log-metric .label { font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; }
        .log-metric .value { font-size: 1.75rem; font-weight: 700; margin-top: 0.4rem; }
        .log-metric.debug .value { color: #c4b5fd; }
        .log-metric.info .value { color: #60a5fa; }
        .log-metric.warn .value { color: #fbbf24; }
        .log-metric.error .value { color: #f87171; }
        .log-metric.fatal .value { color: #fb7185; }
        .log-metric.unknown .value { color: #cbd5e1; }
        .log-layout { display: grid; grid-template-columns: minmax(270px, 0.9fr) minmax(260px, 1.4fr); gap: 1rem; }
        .log-list-panel, .log-details { padding: 1rem; }
        .filters { display: grid; gap: 0.75rem; }
        .filters input, .filters select { width: 100%; padding: 0.7rem 0.75rem; border-radius: 10px; border: 1px solid rgba(148,163,184,0.2); background: rgba(2,6,23,0.55); color: #e2e8f0; }
        .result-count { color: #cbd5e1; font-size: 0.82rem; margin-bottom: 0.7rem; }
        .log-entry-list { display: grid; gap: 0.55rem; max-height: 560px; overflow: auto; }
        .log-entry-item { padding: 0.75rem 0.8rem; border-radius: 12px; border: 1px solid rgba(148,163,184,0.15); background: rgba(15,23,42,0.5); cursor: pointer; display: grid; gap: 0.32rem; }
        .log-entry-item.active { border-color: rgba(96,165,250,0.85); background: rgba(37,99,235,0.12); }
        .log-entry-header { display: flex; justify-content: space-between; gap: 0.5rem; align-items: center; font-size: 0.8rem; }
        .level-pill { display: inline-flex; padding: 0.18rem 0.5rem; border-radius: 999px; font-weight: 700; font-size: 0.72rem; }
        .level-pill.info { background: rgba(59,130,246,0.18); color: #93c5fd; }
        .level-pill.warn { background: rgba(251,191,36,0.2); color: #fbbf24; }
        .level-pill.error { background: rgba(248,113,113,0.2); color: #fca5a5; }
        .level-pill.fatal { background: rgba(244,63,94,0.2); color: #fda4af; }
        .level-pill.debug, .level-pill.trace { background: rgba(148,163,184,0.2); color: #cbd5e1; }
        .level-pill.unknown { background: rgba(148,163,184,0.2); color: #e2e8f0; }
        .entry-logger { color: #bfdbfe; font-size: 0.8rem; }
        .entry-message { white-space: pre-wrap; color: #f8fafc; }
        .log-details h3 { margin: 0 0 0.85rem; }
        .detail-grid { display: grid; grid-template-columns: repeat(2, minmax(120px, 1fr)); gap: 0.75rem; }
        .detail-item { background: rgba(15,23,42,0.5); border: 1px solid rgba(148,163,184,0.15); border-radius: 10px; padding: 0.7rem; }
        .detail-item small { display: block; color: #94a3b8; margin-bottom: 0.25rem; }
        .detail-value { white-space: pre-wrap; word-break: break-word; color: #f8fafc; }
        .detail-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.7rem; }
        .empty-state { color: #cbd5e1; padding: 1.25rem; border: 1px dashed rgba(148,163,184,0.2); border-radius: 10px; }
      </style>

      <div class="tool-page-heading">
        <div>
          <div class="eyebrow">LOG ANALYZER</div>
          <h1>Log Analyzer</h1>
          <p>Inspect Java, .NET, JSON and generic logs locally in the browser.</p>
        </div>
        <span class="local-badge"><span class="status-dot"></span> Local processing</span>
      </div>

      <section class="log-import-panel">
        <div class="log-toolbar">
          <button class="primary-button" type="button" (click)="openFilePicker()">Import file</button>
          <button class="secondary-button" type="button" [disabled]="!sampleText().trim()" (click)="analyzeSample()">Analyze sample</button>
          <button class="secondary-button" type="button" (click)="toggleHelp()">{{ showHelp() ? 'Hide help' : 'Help' }}</button>
          <button class="secondary-button" type="button" [disabled]="!entries().length" (click)="clearAll()">Clear</button>
          <input id="log-file-input" class="hidden-file-input" type="file" accept=".log,.txt,.json,.ndjson" (change)="handleFileChange($event)" />
        </div>

        <div class="log-upload-row">
          <div class="log-file-meta">
            <strong>{{ fileName() }}</strong>
            @if (fileSize() > 0) {
              <span>{{ formatBytes(fileSize()) }}</span>
            }
          </div>
          @if (sourceFormat() !== 'unknown') {
            <span>Detected: {{ sourceFormat() }} ({{ confidence() * 100 | number: '1.0-0' }}%)</span>
          }
        </div>
      </section>

      @if (showHelp()) {
        <section class="log-help-panel" aria-live="polite">
          <div class="help-header">
            <h2>Developer help</h2>
            <span class="local-badge"><span class="status-dot"></span> Local only</span>
          </div>

          <div class="help-grid">
            <div class="help-card">
              <h3>Supported formats</h3>
              <ul>
                <li>Java / Spring Boot log lines</li>
                <li>.NET / ASP.NET Core console logs</li>
                <li>Structured JSON and NDJSON events</li>
                <li>Generic plain-text log entries</li>
              </ul>
            </div>

            <div class="help-card">
              <h3>Known limits</h3>
              <ul>
                <li>Detection remains heuristic, not authoritative.</li>
                <li>Very custom formats may be classified as generic.</li>
                <li>Multiline stack traces are attached to the nearest prior entry.</li>
              </ul>
            </div>

            <div class="help-card">
              <h3>Detection rules</h3>
              <ul>
                <li>Patterns are matched on timestamps, levels and known logger fields.</li>
                <li>JSON is detected via object keys such as <code>timestamp</code> or <code>level</code>.</li>
                <li>Confidence is reported as a percentage alongside the detected format.</li>
              </ul>
            </div>

            <div class="help-card">
              <h3>Extracted information</h3>
              <ul>
                <li>Timestamp and normalized level</li>
                <li>Logger name and thread when present</li>
                <li>Message, exception and stack trace</li>
                <li>Original raw line content</li>
              </ul>
            </div>

            <div class="help-card">
              <h3>Local behavior</h3>
              <ul>
                <li>No data leaves the browser.</li>
                <li>No log content is stored automatically.</li>
                <li>All parsing and filtering run client-side.</li>
              </ul>
            </div>

            <div class="help-card">
              <h3>Unrecognized formats</h3>
              <ul>
                <li>They are still shown as entries, but with <code>UNKNOWN</code> level.</li>
                <li>Generic parsing preserves the original text as faithfully as possible.</li>
              </ul>
            </div>
          </div>

          <div class="help-card">
            <h3>Try sample logs</h3>
            <div class="preset-list">
              @for (example of presetExamples; track example.label) {
                <button class="preset-button" type="button" (click)="applyPreset(example)">{{ example.label }}</button>
              }
            </div>
          </div>
        </section>
      }

      <section class="log-analysis">
        <div class="log-panel">
          <h2>Sample log</h2>
          <textarea class="log-sample-box" [value]="sampleText()" (input)="sampleText.set($any($event.target).value)"></textarea>
        </div>

        <div class="log-panel">
          <h2>Overview</h2>
          <div class="log-summary">
            <div class="log-metric total">
              <div class="label">Total</div>
              <div class="value">{{ stats()['total'] }}</div>
            </div>
            <div class="log-metric debug">
              <div class="label">DEBUG</div>
              <div class="value">{{ stats()['debug'] }}</div>
            </div>
            <div class="log-metric info">
              <div class="label">INFO</div>
              <div class="value">{{ stats()['info'] }}</div>
            </div>
            <div class="log-metric warn">
              <div class="label">WARN</div>
              <div class="value">{{ stats()['warn'] }}</div>
            </div>
            <div class="log-metric error">
              <div class="label">ERROR</div>
              <div class="value">{{ stats()['error'] }}</div>
            </div>
            <div class="log-metric fatal">
              <div class="label">FATAL</div>
              <div class="value">{{ stats()['fatal'] }}</div>
            </div>
            <div class="log-metric unknown">
              <div class="label">Unknown</div>
              <div class="value">{{ stats()['unknown'] }}</div>
            </div>
          </div>
        </div>
      </section>

      <section class="log-layout">
        <div class="log-list-panel">
          <h2>Entries</h2>
          <div class="filters">
            <select [value]="filters().level" (change)="updateFilter('level', $any($event.target).value)">
              <option value="ALL">All levels</option>
              <option value="TRACE">TRACE</option>
              <option value="DEBUG">DEBUG</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
              <option value="FATAL">FATAL</option>
              <option value="UNKNOWN">UNKNOWN</option>
            </select>
            <input type="search" placeholder="Search logs" [value]="filters().search" (input)="updateFilter('search', $any($event.target).value)" />
            <input type="text" placeholder="Logger filter" [value]="filters().logger" (input)="updateFilter('logger', $any($event.target).value)" />
            <input type="text" placeholder="Exception contains" [value]="filters().exception" (input)="updateFilter('exception', $any($event.target).value)" />
            <div style="display: grid; grid-template-columns: repeat(2, minmax(120px,1fr)); gap: 0.75rem;">
              <input type="date" [value]="filters().from" (input)="updateFilter('from', $any($event.target).value)" />
              <input type="date" [value]="filters().to" (input)="updateFilter('to', $any($event.target).value)" />
            </div>
          </div>

          <div class="result-count">{{ visibleEntries().length }} matching entries</div>

          @if (visibleEntries().length) {
            <div class="log-entry-list">
              @for (entry of visibleEntries(); track entry.id) {
                <article class="log-entry-item" [class.active]="selectedEntry() !== null && selectedEntry()!.id === entry.id" (click)="selectEntry(entry.id)">
                  <div class="log-entry-header">
                    <span class="level-pill {{ entry.level.toLowerCase() }}">{{ entry.level }}</span>
                    <span>{{ entry.timestamp ? formatDate(entry.timestamp) : 'No date' }}</span>
                  </div>
                  <div class="entry-logger">{{ entry.logger ?? 'Unknown logger' }}</div>
                  <div class="entry-message">{{ entry.message }}</div>
                </article>
              }
            </div>
          } @else {
            <div class="empty-state">No log entries match the current filters.</div>
          }
        </div>

        <div class="log-details">
          @if (selectedEntry(); as entry) {
            <h3>Entry details</h3>
            <div class="detail-grid">
              <div class="detail-item"><small>Message</small><div class="detail-value">{{ entry.message }}</div></div>
              <div class="detail-item"><small>Level</small><div class="detail-value">{{ entry.level }}</div></div>
              <div class="detail-item"><small>Date</small><div class="detail-value">{{ entry.timestamp ? formatDate(entry.timestamp) : 'Not available' }}</div></div>
              <div class="detail-item"><small>Logger</small><div class="detail-value">{{ entry.logger ?? 'N/A' }}</div></div>
              <div class="detail-item"><small>Thread</small><div class="detail-value">{{ entry.thread ?? 'N/A' }}</div></div>
              <div class="detail-item"><small>Source</small><div class="detail-value">{{ entry.sourceFormat }}</div></div>
              @if (entry.exception) {
                <div class="detail-item" style="grid-column: 1 / -1;"><small>Exception</small><div class="detail-value">{{ entry.exception }}</div></div>
              }
              @if (entry.stackTrace?.length) {
                <div class="detail-item" style="grid-column: 1 / -1;"><small>Stack trace</small><div class="detail-value">{{ entry.stackTrace?.join('\n') ?? 'N/A' }}</div></div>
              }
              <div class="detail-item" style="grid-column: 1 / -1;"><small>Raw</small><div class="detail-value">{{ entry.raw }}</div></div>
            </div>
            <div class="detail-actions">
              <button class="secondary-button" type="button" (click)="copyText(entry.message)">Copy message</button>
              <button class="secondary-button" type="button" (click)="copyText(entry.stackTrace?.join('\n') ?? '')">Copy stack trace</button>
            </div>
          } @else {
            <div class="empty-state">Select an entry to inspect its details.</div>
          }
        </div>
      </section>
    </div>
  `
})

export class LogAnalyzerPageComponent {
  private readonly service = inject(LogAnalyzerService);
  readonly sampleText = signal('');
  readonly showHelp = signal(false);
  readonly presetExamples: LogSamplePreset[] = [
    {
      label: 'Java / Spring',
      content: `2026-10-30 14:32:12.123 INFO 12345 --- [http-nio-8080-exec-1] com.example.UserService : User authenticated\n2026-10-30 14:32:13.456 WARN 12345 --- [http-nio-8080-exec-1] com.example.CacheService : Cache warm-up took 650ms\n2026-10-30 14:32:14.890 ERROR 12345 --- [http-nio-8080-exec-1] com.example.OrderService : Failed to process order 42\njava.lang.NullPointerException: Cannot invoke "String.trim()" because "value" is null\n\tat com.example.OrderService.process(OrderService.java:82)\n\tat com.example.OrderController.handle(OrderController.java:56)\n\tat org.springframework.web.servlet.DispatcherServlet.doDispatch(DispatcherServlet.java:1080)`
    },
    {
      label: '.NET',
      content: `2026-10-30 14:32:12.1234 info: MyApp.Services.UserService[1001]\nUser authenticated successfully\n2026-10-30 14:32:13.4567 warn: MyApp.Services.CacheService[2002]\nCache warm-up exceeded expected duration\n2026-10-30 14:32:14.8901 error: MyApp.Services.OrderService[3003]\nOrder processing failed for customer 42\nSystem.NullReferenceException: Object reference not set to an instance of an object\n   at MyApp.Services.OrderService.ProcessOrder(...)` 
    },
    {
      label: 'JSON / NDJSON',
      content: `{"timestamp":"2026-10-30T14:32:12.123Z","level":"INFO","logger":"app.api","message":"Request completed","thread":"http-nio-8080-exec-1"}\n{"timestamp":"2026-10-30T14:32:15.456Z","level":"ERROR","logger":"app.payments","message":"Payment processing failed","exception":"TimeoutException","stackTrace":["at app.payments.Service.process(Service.java:42)","at app.payments.Controller.handle(Controller.java:18)"]}`
    },
    {
      label: 'Generic',
      content: `2026-10-30T14:32:12Z INFO Booting application\n2026-10-30T14:32:17Z WARN Retrying connection to primary DB\n2026-10-30T14:32:20Z ERROR Failed to initialize broker connection`
    }
  ];
  readonly fileName = signal('No file selected');
  readonly fileSize = signal(0);
  readonly entries = signal<LogEntry[]>([]);
  readonly sourceFormat = signal<LogSourceFormat>('unknown');
  readonly confidence = signal(0);
  readonly processing = signal(false);
  readonly filters = signal<LogFilterState>({
    level: 'ALL',
    search: '',
    logger: '',
    exception: '',
    from: '',
    to: ''
  });
  readonly selectedEntryId = signal<string | null>(null);

  readonly visibleEntries = computed(() => {
    const list = this.entries();
    const filter = this.filters();
    return this.service.filterEntries(list, filter);
  });

  readonly stats = computed(() => this.service.summarize(this.visibleEntries()));
  readonly selectedEntry = computed(() => {
    const list = this.visibleEntries();
    const selected = this.selectedEntryId();
    return list.find(entry => entry.id === selected) ?? list[0] ?? null;
  });

  constructor() {
    effect(() => {
      const currentVisible = this.visibleEntries();
      const selectedId = this.selectedEntryId();
      if (selectedId && currentVisible.some(entry => entry.id === selectedId)) {
        return;
      }
      this.selectedEntryId.set(currentVisible[0]?.id ?? null);
    });
  }

  toggleHelp(): void {
    this.showHelp.set(!this.showHelp());
  }

  applyPreset(example: LogSamplePreset): void {
    this.sampleText.set(example.content);
    this.showHelp.set(false);
    this.analyzeSample();
  }

  openFilePicker(): void {
    const element = document.querySelector<HTMLInputElement>('#log-file-input');
    if (element) {
      element.click();
    }
  }

  async handleFileChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) { return; }

    this.fileName.set(file.name);
    this.fileSize.set(file.size);
    const text = await file.text();
    this.sampleText.set(text);
    this.analyzeSample();
  }

  analyzeSample(): void {
    const text = this.sampleText();
    if (!text.trim()) {
      this.entries.set([]);
      this.sourceFormat.set('unknown');
      this.confidence.set(0);
      return;
    }

    this.processing.set(true);
    const summary = this.service.parseLogs(text);
    const format = summary.format;
    const confidence = summary.confidence;
    this.entries.set(summary.entries);
    this.sourceFormat.set(format);
    this.confidence.set(confidence);
    this.processing.set(false);
    if (this.entries().length) {
      this.selectedEntryId.set(this.entries()[0].id);
    }
  }

  updateFilter(key: keyof LogFilterState, value: string): void {
    const current = this.filters();
    if (key === 'level') {
      this.filters.set({ ...current, level: value as LogFilterState['level'] });
      return;
    }
    this.filters.set({ ...current, [key]: value });
  }

  clearAll(): void {
    this.sampleText.set('');
    this.entries.set([]);
    this.fileName.set('No file selected');
    this.fileSize.set(0);
    this.sourceFormat.set('unknown');
    this.confidence.set(0);
    this.filters.set({
      level: 'ALL',
      search: '',
      logger: '',
      exception: '',
      from: '',
      to: ''
    });
    this.selectedEntryId.set(null);
  }

  selectEntry(id: string): void {
    this.selectedEntryId.set(id);
  }

  formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString();
  }

  formatBytes(bytes: number): string {
    if (bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const formatted = bytes / 1024 ** index;
    return `${formatted.toFixed(formatted >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
  }

  copyText(value: string): void {
    if (!value) return;
    void navigator.clipboard.writeText(value).catch(() => undefined);
  }
}
