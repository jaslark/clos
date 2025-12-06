import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.scss'
})
export class UploadComponent {
  file: File | null = null;
  isDragging = false;
  isProcessing = false;

  constructor(private apiService: ApiService) { }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File) {
    if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
      this.file = file;
    } else {
      alert('Please upload a PDF or Image file.');
    }
  }

  parseDocument() {
    if (!this.file) return;

    this.isProcessing = true;
    this.apiService.upload(this.file).subscribe({
      next: (res) => {
        this.isProcessing = false;
        alert('Upload successful! Job created.');
        // Reset or navigate
      },
      error: (err) => {
        this.isProcessing = false;
        console.error('Upload failed', err);
        alert('Upload failed. Please try again.');
      }
    });
  }
}
