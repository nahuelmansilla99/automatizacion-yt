import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Prompt } from '../../../../core/models/prompt.model';

@Component({
  selector: 'app-prompt-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './prompt-list.html',
  styleUrl: './prompt-list.css',
})
export class PromptListComponent {
  @Input() prompts: Prompt[] = [];
  @Input() loading = false;

  @Output() onEdit = new EventEmitter<Prompt>();
  @Output() onDetail = new EventEmitter<Prompt>();
  @Output() onSetDefault = new EventEmitter<Prompt>();
  @Output() onDelete = new EventEmitter<Prompt>();
  @Output() onToggleActive = new EventEmitter<Prompt>();

  formatTags(tags: string[]): string {
    return tags.map((t) => `#${t}`).join(', ');
  }
}
