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
import { AIService } from '../../services/ai.service';

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
  aiProcessing = false;
  aiSuggestion = '';

  // Undo/Redo functionality
  undoStack: string[] = [];
  redoStack: string[] = [];
  lastChange = '';

  constructor(
    public dialogRef: MatDialogRef<NotesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private leetcodeService: LeetcodeService,
    @Inject(AIService) private aiService: AIService,
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

  closeDialog(): void {
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

      this.data.notes = trimmedNotes;
      this.isEditing = false;
      this.editedNotes = '';
      this.clearUndoStacks();

      this.snackBar.open(
        trimmedNotes ? 'Notes saved successfully!' : 'Notes cleared successfully!',
        'Close',
        { duration: 3000 }
      );

      this.dialogRef.close(trimmedNotes);

    } catch (error) {
      console.error('Error saving notes:', error);
      this.snackBar.open('Error saving notes. Please try again.', 'Close', { duration: 5000 });
    } finally {
      this.saving = false;
    }
  }

  async enhanceNotesWithAI(type: 'improve' | 'rephrase' | 'structure'): Promise<void> {
    if (!this.editedNotes.trim()) {
      this.snackBar.open('Please add some notes first before using AI enhancement.', 'Close', { duration: 3000 });
      return;
    }

    this.aiProcessing = true;

    try {
      let prompt = '';
      const context = `Problem: ${this.data.title}\nDifficulty: ${this.data.difficulty}\nTags: ${this.data.tags?.join(', ') || 'N/A'}`;

      switch (type) {
        case 'improve':
          prompt = `Please improve and enhance the following LeetCode problem notes. Make them more comprehensive, clear, and educational while maintaining the original insights. Add any missing important details about the solution approach, time/space complexity analysis, or edge cases if appropriate.

${context}

Current Notes:
${this.editedNotes}

Please provide improved notes that are:
- More detailed and comprehensive
- Better structured and organized
- Include proper complexity analysis if missing
- Highlight key insights and patterns
- Maintain the original author's voice and insights`;
          break;

        case 'rephrase':
          prompt = `Please rephrase and rewrite the following LeetCode problem notes to make them clearer, more concise, and better organized while preserving all the important information and insights.

${context}

Current Notes:
${this.editedNotes}

Please provide rephrased notes that are:
- Clearer and more concise
- Better organized and structured
- Use improved technical language
- Maintain all original insights and information
- Follow markdown formatting conventions`;
          break;

        case 'structure':
          prompt = `Please restructure and organize the following LeetCode problem notes into a well-formatted, logical structure with proper headings, sections, and markdown formatting.

${context}

Current Notes:
${this.editedNotes}

Please provide structured notes with:
- Clear headings and sections (## Approach, ## Complexity Analysis, ## Solution, etc.)
- Proper markdown formatting
- Logical flow of information
- Bullet points and numbered lists where appropriate
- Code blocks for algorithms/pseudocode if present
- All original information preserved but better organized`;
          break;
      }

      const enhancedNotes = await this.aiService.enhanceNotes(prompt);

      if (enhancedNotes) {
        this.aiSuggestion = enhancedNotes;
        this.snackBar.open('AI suggestion generated! Review and accept if you like it.', 'Close', { duration: 4000 });
      } else {
        throw new Error('No response from AI service');
      }

    } catch (error) {
      console.error('Error enhancing notes with AI:', error);
      this.snackBar.open('Failed to enhance notes with AI. Please try again.', 'Close', { duration: 5000 });
    } finally {
      this.aiProcessing = false;
    }
  }

  acceptAISuggestion(): void {
    if (this.aiSuggestion) {
      this.pushToUndoStack();
      this.editedNotes = this.aiSuggestion;
      this.aiSuggestion = '';
      this.snackBar.open('AI suggestion applied to your notes!', 'Close', { duration: 3000 });

      // Focus the textarea after accepting suggestion
      setTimeout(() => {
        if (this.notesTextarea) {
          this.notesTextarea.nativeElement.focus();
        }
      }, 100);
    }
  }

  dismissAISuggestion(): void {
    this.aiSuggestion = '';
  }
}
