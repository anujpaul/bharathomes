import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@/app/services/auth.service';
import { FormsModule } from '@angular/forms';

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
          <div class="avatar">
            {{ profile()?.name?.charAt(0) || 'U' }}
          </div>

          <div>
            <h2>{{ profile()?.name }}</h2>
            <p class="muted">{{ profile()?.email }}</p>
          </div>
        </div>

        <hr />

        <!-- View Mode -->
        @if (!isEditing()) {
          <div class="info">
            <p><strong>Provider:</strong> {{ profile()?.provider }}</p>
          </div>

          <button class="btn primary" (click)="startEdit()">
            Edit Profile
          </button>
        }

        <!-- Edit Mode -->
        @else {
          <div class="form">

            <label>Name</label>
            <input [(ngModel)]="editModel.name" />

            <label>Email</label>
            <input [(ngModel)]="editModel.email" disabled />

            <label>Provider</label>
            <input [value]="profile()?.provider" disabled />

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
  `,
  styles: [`
    .profile-wrapper {
      display: flex;
      justify-content: center;
      padding: 40px;
      font-family: Arial, sans-serif;
    }

    .profile-card {
      width: 420px;
      background: #ffffff;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4f46e5, #9333ea);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: bold;
    }

    h2 {
      margin: 0;
    }

    .muted {
      color: gray;
      font-size: 13px;
    }

    hr {
      margin: 20px 0;
      border: none;
      border-top: 1px solid #eee;
    }

    .btn {
      padding: 10px 14px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      margin-top: 12px;
    }

    .primary {
      background: #4f46e5;
      color: white;
    }

    .form {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    input {
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 8px;
      outline: none;
    }

    input:focus {
      border-color: #4f46e5;
    }

    .actions {
      display: flex;
      justify-content: space-between;
      margin-top: 16px;
    }

    .loading {
      font-size: 16px;
      color: gray;
    }
  `]
})
export class ProfileComponent {

  private authService = inject(AuthService);

  profile = this.authService.authResponse;

  isEditing = signal(false);

  editModel = {
    name: '',
    email: ''
  };

  startEdit() {
    const p = this.profile();
    this.editModel = {
      name: p.name,
      email: p.email
    };
    this.isEditing.set(true);
  }

  cancel() {
    this.isEditing.set(false);
  }

  save() {
    // TODO: call backend update API
    console.log('Saving:', this.editModel);
    this.authService.editUserProfile(this.editModel);
    
    this.isEditing.set(false);
  }
}