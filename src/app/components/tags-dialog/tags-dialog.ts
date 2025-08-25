import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-all-tags-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatChipsModule],
  templateUrl: './tags-dialog.html',
  styleUrls: ['./tags-dialog.scss']
})
export class AllTagsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<AllTagsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
}
