import { Component, OnInit, ViewChild, ElementRef, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Observable, startWith, map } from 'rxjs';
import { LeetcodeService } from '../../services/leetcode';
import { Problem } from '../../models/problem';
import { LeetcodeImportComponent } from '../leetcode-import/leetcode-import';

// Common LeetCode problem tags for autocomplete
const COMMON_TAGS = [
  'Array', 'String', 'Hash Table', 'Dynamic Programming', 'Math', 'Sorting',
  'Greedy', 'Depth-First Search', 'Binary Search', 'Database', 'Breadth-First Search',
  'Tree', 'Matrix', 'Two Pointers', 'Bit Manipulation', 'Heap (Priority Queue)',
  'Stack', 'Graph', 'Design', 'Prefix Sum', 'Simulation', 'Counting', 'Backtracking',
  'Sliding Window', 'Union Find', 'Linked List', 'Ordered Set', 'Monotonic Stack',
  'Trie', 'Number Theory', 'Topological Sort', 'Binary Indexed Tree', 'Segment Tree',
  'Binary Search Tree', 'Geometry', 'Memoization', 'Queue', 'Recursion'
];

@Component({
  selector: 'app-problem-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatAutocompleteModule
  ],
  templateUrl: './problem-form.html',
  styleUrls: ['./problem-form.scss']
})


export class ProblemFormComponent implements OnInit {
  problemForm: FormGroup;
  isEdit = false;
  selectedTags: string[] = [];
  allTags = COMMON_TAGS;
  filteredTags: Observable<string[]>;

  @ViewChild('notesTextarea') notesTextarea!: ElementRef<HTMLTextAreaElement>;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ProblemFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Problem | null,
    private leetcodeService: LeetcodeService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.isEdit = !!data;
    this.selectedTags = data?.tags || [];

    this.problemForm = this.fb.group({
      leetcodeId: [data?.leetcodeId || '', [Validators.required, Validators.min(1)]],
      title: [data?.title || '', Validators.required],
      url: [data?.url || '', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      difficulty: [data?.difficulty || '', Validators.required],
      status: [data?.status || 'Not Attempted', Validators.required],
      attempts: [data?.attempts || 0, [Validators.min(0)]],
      timeSpent: [data?.timeSpent || 0, [Validators.min(0)]],
      notes: [data?.notes || ''],
      tagInput: ['']
    });

    this.filteredTags = this.problemForm.get('tagInput')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterTags(value || ''))
    );
  }

  ngOnInit(): void {}

  private _filterTags(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.allTags.filter(tag =>
      tag.toLowerCase().includes(filterValue) &&
      !this.selectedTags.includes(tag)
    );
  }

  addTag(event: any): void {
    const value = (event.value || '').trim();
    if (value && !this.selectedTags.includes(value)) {
      this.selectedTags.push(value);
      this.problemForm.get('tagInput')?.setValue('');
    }
    event.chipInput!.clear();
  }

  selectTag(event: any): void {
    const value = event.option.value;
    if (value && !this.selectedTags.includes(value)) {
      this.selectedTags.push(value);
      this.problemForm.get('tagInput')?.setValue('');
    }
  }

  removeTag(tag: string): void {
    const index = this.selectedTags.indexOf(tag);
    if (index >= 0) {
      this.selectedTags.splice(index, 1);
    }
  }

  openImportDialog(): void {
    const dialogRef = this.dialog.open(LeetcodeImportComponent, {
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      autoFocus: false,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Problem was imported successfully, close the form
        this.dialogRef.close(true);
      }
    });
  }

  async onSubmit(): Promise<void> {
    if (this.problemForm.valid) {
      try {
        const formValue = this.problemForm.value;
        const problemData = {
          ...formValue,
          tags: this.selectedTags,
          companies: this.data?.companies || []
        };

        delete problemData.tagInput;

        if (this.isEdit && this.data?.id) {
          await this.leetcodeService.updateProblem(this.data.id, problemData);
          this.snackBar.open('Problem updated successfully!', 'Close', {
            duration: 3000,
            panelClass: 'success-snackbar'
          });
        } else {
          await this.leetcodeService.addProblem(problemData);
          this.snackBar.open('Problem added successfully!', 'Close', {
            duration: 3000,
            panelClass: 'success-snackbar'
          });
        }

        this.dialogRef.close(true);
      } catch (error) {
        console.error('Error saving problem:', error);
        this.snackBar.open('Failed to save problem. Please try again.', 'Close', {
          duration: 3000,
          panelClass: 'error-snackbar'
        });
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  applyFormat(format: 'bold' | 'italic' | 'code' | 'bullet'): void {
    const textarea = this.notesTextarea.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);

    let formattedText = '';
    let cursorOffset = 0;

    switch (format) {
      case 'bold':
        formattedText = selectedText ? `**${selectedText}**` : '**bold text**';
        cursorOffset = selectedText ? 2 : 2;
        break;
      case 'italic':
        formattedText = selectedText ? `*${selectedText}*` : '*italic text*';
        cursorOffset = selectedText ? 1 : 1;
        break;
      case 'code':
        formattedText = selectedText ? `\`${selectedText}\`` : '`code`';
        cursorOffset = selectedText ? 1 : 1;
        break;
      case 'bullet':
        formattedText = selectedText ? `• ${selectedText}` : '• bullet point';
        cursorOffset = selectedText ? 2 : 2;
        break;
    }

    const newValue = beforeText + formattedText + afterText;

    // Update form control
    this.problemForm.patchValue({ notes: newValue });

    // Update textarea value and focus
    textarea.value = newValue;
    textarea.focus();

    // Set cursor position
    const newCursorPos = selectedText ?
      start + formattedText.length :
      start + cursorOffset;

    setTimeout(() => {
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }
}
