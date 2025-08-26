import { Component, Inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { LeetcodeService } from '../../services/leetcode';

@Component({
  selector: 'app-notes-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './notes-dialog.html',
  styleUrls: ['./notes-dialog.scss']
})
export class NotesDialogComponent {
  @ViewChild('notesTextarea') notesTextarea!: ElementRef<HTMLTextAreaElement>;

  isEditing = false;
  editedNotes = '';
  saving = false;

  // Undo/Redo functionality
  undoStack: string[] = [];
  redoStack: string[] = [];
  lastChange = '';

  constructor(
    public dialogRef: MatDialogRef<NotesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private leetcodeService: LeetcodeService,
    private snackBar: MatSnackBar
  ) {
    // Set up keyboard shortcuts
    this.setupKeyboardShortcuts();
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event) => {
      if (!this.isEditing) return;

      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'enter':
            event.preventDefault();
            this.saveNotes();
            break;
          case 'b':
            event.preventDefault();
            this.applyFormatting('bold');
            break;
          case 'i':
            event.preventDefault();
            this.applyFormatting('italic');
            break;
          case 'k':
            event.preventDefault();
            this.applyFormatting('code');
            break;
          case 'z':
            if (event.shiftKey) {
              event.preventDefault();
              this.redoEdit();
            } else {
              event.preventDefault();
              this.undoEdit();
            }
            break;
          case 'y':
            event.preventDefault();
            this.redoEdit();
            break;
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        this.cancelEditing();
      }
    });
  }

  formatNotes(notes: string): string {
    if (!notes) return '';

    return notes
      // Headers
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Inline code
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Code blocks
      .replace(/```\n([\s\S]*?)\n```/g, '<pre><code>$1</code></pre>')
      // Quotes
      .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
      // Unordered lists
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      // Ordered lists
      .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>')
      // Horizontal rules
      .replace(/^---$/gm, '<hr>')
      // Line breaks
      .replace(/\n/g, '<br>');
  }

  startEditing(): void {
    this.isEditing = true;
    this.editedNotes = this.data.notes || '';
    this.initializeUndoStack();

    // Focus the textarea after the view updates
    setTimeout(() => {
      if (this.notesTextarea) {
        this.notesTextarea.nativeElement.focus();
        const textarea = this.notesTextarea.nativeElement;
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      }
    }, 100);
  }

  onKeyDown(event: KeyboardEvent): void {
    // Handle tab key for indentation
    if (event.key === 'Tab') {
      event.preventDefault();
      this.insertText('  ');
    }
  }

  onTextChange(): void {
    if (this.editedNotes !== this.lastChange) {
      this.pushToUndoStack();
      this.lastChange = this.editedNotes;
    }
  }

  applyFormatting(type: 'bold' | 'italic' | 'code'): void {
    const textarea = this.notesTextarea.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    let formattedText = '';
    let cursorOffset = 0;

    switch (type) {
      case 'bold':
        if (selectedText) {
          formattedText = `**${selectedText}**`;
          cursorOffset = 2;
        } else {
          formattedText = '**bold text**';
          cursorOffset = 2;
        }
        break;
      case 'italic':
        if (selectedText) {
          formattedText = `*${selectedText}*`;
          cursorOffset = 1;
        } else {
          formattedText = '*italic text*';
          cursorOffset = 1;
        }
        break;
      case 'code':
        if (selectedText) {
          formattedText = `\`${selectedText}\``;
          cursorOffset = 1;
        } else {
          formattedText = '`code text`';
          cursorOffset = 1;
        }
        break;
    }

    this.insertTextAtCursor(formattedText, !selectedText ? cursorOffset : formattedText.length - cursorOffset);
  }

  insertText(text: string): void {
    this.insertTextAtCursor(text.replace(/\\n/g, '\n'));
  }

  insertTemplate(type: 'approach' | 'complexity' | 'solution' | 'mistakes'): void {
    let template = '';

    switch (type) {
      case 'approach':
        template = `## Approach
- **Intuition**:
- **Key Insight**:
- **Steps**:
  1.
  2.
  3.

`;
        break;
      case 'complexity':
        template = `## Complexity Analysis
- **Time Complexity**: O()
- **Space Complexity**: O()
- **Explanation**:

`;
        break;
      case 'solution':
        template = `## Solution
\`\`\`
// Your code here

\`\`\`

**Explanation**:
-

`;
        break;
      case 'mistakes':
        template = `## Common Mistakes & Learnings
- **Mistake**:
  - **Fix**:
- **Key Learning**:
- **Edge Cases**:

`;
        break;
    }

    this.insertTextAtCursor(template);
  }

  private insertTextAtCursor(text: string, cursorOffset?: number): void {
    const textarea = this.notesTextarea.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    this.pushToUndoStack();

    const before = this.editedNotes.substring(0, start);
    const after = this.editedNotes.substring(end);

    this.editedNotes = before + text + after;

    setTimeout(() => {
      const newCursorPos = start + (cursorOffset !== undefined ? cursorOffset : text.length);
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    });
  }

  private initializeUndoStack(): void {
    this.undoStack = [this.editedNotes];
    this.redoStack = [];
    this.lastChange = this.editedNotes;
  }

  private pushToUndoStack(): void {
    if (this.undoStack[this.undoStack.length - 1] !== this.editedNotes) {
      this.undoStack.push(this.editedNotes);
      this.redoStack = []; // Clear redo stack when new action is performed

      // Limit undo stack size
      if (this.undoStack.length > 50) {
        this.undoStack = this.undoStack.slice(-50);
      }
    }
  }

  undoEdit(): void {
    if (this.undoStack.length > 1) {
      this.redoStack.push(this.undoStack.pop()!);
      this.editedNotes = this.undoStack[this.undoStack.length - 1];
      this.lastChange = this.editedNotes;
    }
  }

  redoEdit(): void {
    if (this.redoStack.length > 0) {
      const redoState = this.redoStack.pop()!;
      this.undoStack.push(redoState);
      this.editedNotes = redoState;
      this.lastChange = this.editedNotes;
    }
  }

  cancelEditing(): void {
    if (this.editedNotes !== (this.data.notes || '') && this.editedNotes.trim()) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        this.isEditing = false;
        this.editedNotes = '';
        this.clearUndoStacks();
      }
    } else {
      this.isEditing = false;
      this.editedNotes = '';
      this.clearUndoStacks();
    }
  }

  // Add this method to handle the close button explicitly
  closeDialog(): void {
    // Close without returning any value - this prevents updating the parent
    this.dialogRef.close();
  }

  clearNotes(): void {
    if (confirm('Are you sure you want to clear all notes? This action cannot be undone.')) {
      this.pushToUndoStack();
      this.editedNotes = '';
    }
  }

  private clearUndoStacks(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.lastChange = '';
  }

  async saveNotes(): Promise<void> {
    if (!this.data.id) {
      this.snackBar.open('Error: Problem ID not found', 'Close', { duration: 3000 });
      return;
    }

    this.saving = true;

    try {
      const trimmedNotes = this.editedNotes.trim();

      await this.leetcodeService.updateProblem(this.data.id, {
        notes: trimmedNotes
      });

      // Update the local data
      this.data.notes = trimmedNotes;

      this.isEditing = false;
      this.editedNotes = '';
      this.clearUndoStacks();

      this.snackBar.open(
        trimmedNotes ? 'Notes saved successfully!' : 'Notes cleared successfully!',
        'Close',
        { duration: 3000 }
      );

      // Return the updated notes to the parent component
      this.dialogRef.close(trimmedNotes);

    } catch (error) {
      console.error('Error saving notes:', error);
      this.snackBar.open('Error saving notes. Please try again.', 'Close', { duration: 5000 });
    } finally {
      this.saving = false;
    }
  }
}
