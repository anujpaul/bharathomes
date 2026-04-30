import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@/app/services/auth.service';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { appConfig } from '@/app/config/app-config';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="profile-wrapper">
    @if (profile()) {
      <div class="profile-card">

        <!-- Header -->
        <div class="profile-header">

          <!-- Avatar: click = preview (view mode) OR upload (edit mode) -->
          <div class="avatar-wrapper">
            @if (profile()?.userPhoto) {
              <img class="avatar-img"
                   [src]="profile()?.userPhoto"
                   alt="Profile Photo"
                   (click)="isEditing() ? fileInput.click() : openPreview()">
            } @else {
              <div class="avatar"
                   (click)="isEditing() ? fileInput.click() : null">
                {{ profile()?.name?.charAt(0) || 'U' }}
              </div>
            }

            <!-- Camera button: only visible in edit mode -->
            @if (isEditing()) {
              <div class="avatar-overlay" (click)="fileInput.click()">
                @if (uploading()) { ⏳ } @else { 📷 }
              </div>
            }
          </div>
          <input #fileInput type="file" accept="image/*" style="display:none"
                 (change)="onFileSelected($event)" />

          <div>
            <h2>{{ profile()?.name }}</h2>
            <p class="muted">{{ profile()?.email }}</p>
          </div>
        </div>

        <hr />

        @if (!isEditing()) {
          <div class="info">
            <p><strong>Phone:</strong> {{ profile()?.phone }}</p>
          </div>
          <button class="btn primary" (click)="startEdit()">Edit Profile</button>
        } @else {
          <div class="form">
            <label>Name</label>
            <input [(ngModel)]="editModel.name" />
            <label>Email</label>
            <input [(ngModel)]="editModel.email" disabled />
            <label>Phone</label>
            <input [(ngModel)]="editModel.phone" />
          </div>
          <div class="actions">
            <button class="btn" (click)="cancel()">Cancel</button>
            <button class="btn primary" (click)="save()">Save</button>
          </div>
        }

      </div>
    } @else {
      <div class="loading">Loading profile...</div>
    }
  </div>

  <!-- Photo Preview Modal -->
  @if (showPreview()) {
    <div class="modal-backdrop" (click)="closePreview()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <button class="modal-close" (click)="closePreview()">✕</button>
        <img [src]="profile()?.userPhoto" alt="Profile Photo" class="preview-img">
      </div>
    </div>
  }
  `,
  styles: [`
    .profile-wrapper { display: flex; justify-content: center; padding: 40px; font-family: Arial, sans-serif; }
    .profile-card { width: 420px; background: #ffffff; border-radius: 16px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
    .profile-header { display: flex; align-items: center; gap: 16px; }

    .avatar-wrapper { position: relative; width: 60px; height: 60px; flex-shrink: 0; }
    .avatar-img { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; display: block; cursor: pointer; }
    .avatar { width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #4f46e5, #9333ea); color: white; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: bold; }
    .avatar-overlay { position: absolute; inset: 0; border-radius: 50%; background: rgba(0,0,0,0.4); color: white; display: flex; align-items: center; justify-content: center; font-size: 16px; cursor: pointer; opacity: 0; transition: opacity 0.2s; }
    .avatar-wrapper:hover .avatar-overlay { opacity: 1; }

    h2 { margin: 0; }
    .muted { color: gray; font-size: 13px; }
    hr { margin: 20px 0; border: none; border-top: 1px solid #eee; }
    .btn { padding: 10px 14px; border-radius: 8px; border: none; cursor: pointer; margin-top: 12px; }
    .primary { background: #4f46e5; color: white; }
    .form { display: flex; flex-direction: column; gap: 10px; }
    input { padding: 10px; border: 1px solid #ddd; border-radius: 8px; outline: none; }
    input:focus { border-color: #4f46e5; }
    .actions { display: flex; justify-content: space-between; margin-top: 16px; }
    .loading { font-size: 16px; color: gray; }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { position: relative; border-radius: 12px; overflow: hidden; max-width: 90vw; max-height: 90vh; }
    .modal-close { position: absolute; top: 10px; right: 12px; background: rgba(0,0,0,0.5); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; }
    .preview-img { display: block; max-width: 90vw; max-height: 85vh; object-fit: contain; }
  `]
})
export class ProfileComponent {
  private authService = inject(AuthService);
  private http = inject(HttpClient);

  profile = this.authService.authResponse;
  isEditing = signal(false);
  uploading = signal(false);
  showPreview = signal(false);   // ← new

  editModel = { name: '', email: '', phone: '' };

  openPreview() { this.showPreview.set(true); }
  closePreview() { this.showPreview.set(false); }

  async onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    this.uploading.set(true);
    try {
      await this.http.post<{ userPhoto: string }>(
        `${appConfig.baseUrl}/api/user/upload-photo`, formData
      ).toPromise();
      this.authService.fetchUserProfile();
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      this.uploading.set(false);
    }
  }

  startEdit() {
    const p = this.profile();
    this.editModel = { name: p.name, email: p.email, phone: p.phone };
    this.isEditing.set(true);
  }

  cancel() { this.isEditing.set(false); }

  save() {
    this.authService.editUserProfile(this.editModel);
    this.isEditing.set(false);
  }
}