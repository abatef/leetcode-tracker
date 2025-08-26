import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable, startWith, map } from 'rxjs';

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
  selector: 'app-all-tags-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule
  ],
  templateUrl: './tags-dialog.html',
  styleUrls: ['./tags-dialog.scss']
})
export class AllTagsDialogComponent {
  tagForm: FormGroup;
  selectedTags: string[] = [];
  allTags = COMMON_TAGS;
  filteredTags: Observable<string[]>;
  isEditable = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AllTagsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isEditable = data.editable || false;
    this.selectedTags = [...(data.tags || [])];

    this.tagForm = this.fb.group({
      tagInput: ['']
    });

    this.filteredTags = this.tagForm.get('tagInput')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterTags(value || ''))
    );
  }

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
      this.tagForm.get('tagInput')?.setValue('');
    }
    event.chipInput!.clear();
  }

  selectTag(event: any): void {
    const value = event.option.value;
    if (value && !this.selectedTags.includes(value)) {
      this.selectedTags.push(value);
      this.tagForm.get('tagInput')?.setValue('');
    }
  }

  removeTag(tag: string): void {
    const index = this.selectedTags.indexOf(tag);
    if (index >= 0) {
      this.selectedTags.splice(index, 1);
    }
  }

  onSave(): void {
    this.dialogRef.close(this.selectedTags);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
