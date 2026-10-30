import { Component, input, output } from '@angular/core';

@Component({
  selector: 'dd-editor',
  standalone: true,
  template: `
    <section class="editor-column">
      <div class="editor-toolbar">
        <label [for]="inputId()">{{ label() }}</label>
        <span>{{ value().length }} chars</span>
      </div>
      <textarea
        class="code-editor"
        [id]="inputId()"
        [value]="value()"
        [placeholder]="placeholder()"
        [readonly]="readonly()"
        [attr.aria-label]="label()"
        spellcheck="false"
        (input)="onInput($event)"
      ></textarea>
    </section>
  `
})
export class EditorComponent {
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly value = input('');
  readonly placeholder = input('');
  readonly readonly = input(false);
  readonly valueChange = output<string>();

  onInput(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLTextAreaElement) this.valueChange.emit(target.value);
  }
}
