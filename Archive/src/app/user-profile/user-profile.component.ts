import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HeaderComponent],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent implements OnInit {
  profileForm!: FormGroup;
  userNameInitial: string = '';
  userId: string | null = sessionStorage.getItem('userId');
  currentPasswordError: string = '';
  confirmPasswordError: string = '';
  successMessage: string = '';
  errorMessage: string = '';
  loading: boolean = false;
  formMessage: string = '';

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      mobile: ['', [Validators.pattern(/^\d{10}$/)]],
      about: ['', [Validators.maxLength(500)]],
      language: ['English'],
      current_password: [''],
      new_password: ['', this.strongPasswordValidator.bind(this)],
      confirm_password: ['']
    });

    if (this.userId) {
      this.loading = true;
      this.http.get<any>('https://hyperblah.com/funtellocal/signup.php?get_user=true&id=' + this.userId)
        .subscribe({
          next: (res) => {
            if (res.status === 'success' && res.data) {
              this.profileForm.patchValue({
                name: res.data.name || '',
                email: res.data.email || '',
                username: res.data.username || '',
                mobile: res.data.mobile || '',
                about: res.data.about || '',
                language: res.data.language || 'English'
              });
              this.userNameInitial = res.data.name ? res.data.name.charAt(0).toUpperCase() : '';
            }
            this.loading = false;
          },
          error: () => {
            this.errorMessage = 'Failed to load user data';
            this.loading = false;
          }
        });
    }
  }

  onSubmit(): void {
    this.currentPasswordError = '';
    this.confirmPasswordError = '';
    this.successMessage = '';
    this.errorMessage = '';

    const form = this.profileForm.value;
    if (!this.userId) return;

    if ((form.new_password || form.confirm_password || form.current_password) && form.new_password !== form.confirm_password) {
      this.confirmPasswordError = 'New password and confirm password do not match';
      return;
    }

    const payload = {
      update_profile: true,
      user_id: this.userId,
      name: form.name,
      email: form.email,
      username: form.username,
      mobile: form.mobile,
      about: form.about,
      language: form.language,
      current_password: form.current_password,
      new_password: form.new_password,
      confirm_password: form.confirm_password
    };

    this.loading = true;
    this.http.post<any>('https://hyperblah.com/funtellocal/signup.php', payload, { withCredentials: true })
      .subscribe({
        next: (res) => {
          this.loading = false;
          if (res.status === 'success') {
            this.successMessage = res.message;
            this.formMessage = res.message;
            setTimeout(() => {
    this.formMessage = '';
  }, 3000);
          } else {
            if (res.message.includes('Current password is incorrect')) {
              this.currentPasswordError = res.message;
            } else if (res.message.includes('New password and Confirm password do not match')) {
              this.confirmPasswordError = res.message;
            } else {
              this.errorMessage = res.message;
            }
          }
        },
        error: () => {
          this.loading = false;
          this.errorMessage = 'Something went wrong. Please try again.';
        }
      });
  }
  onCurrentPasswordBlur(): void {
  const currentPassword = this.profileForm.get('current_password')?.value;
  if (currentPassword && currentPassword.length > 3) {
    // We'll just assume it's correct until backend confirms onSubmit.
    this.currentPasswordError = '✔ Will be verified on save';
  } else if (currentPassword) {
    this.currentPasswordError = '❌ Password too short';
  } else {
    this.currentPasswordError = '';
  }
}

onPasswordChange(): void {
  const newPassword = this.profileForm.get('new_password')?.value;
  const confirmPassword = this.profileForm.get('confirm_password')?.value;

  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    this.confirmPasswordError = '❌ Passwords do not match';
  } else if (newPassword && confirmPassword && newPassword === confirmPassword) {
    this.confirmPasswordError = '✔ Passwords match';
  } else {
    this.confirmPasswordError = '';
  }
}
validateCurrentPassword(): void {
  const currentPassword = this.profileForm.get('current_password')?.value;
  if (!currentPassword || !this.userId) {
    this.currentPasswordError = '';
    return;
  }

  this.http.post<any>('https://hyperblah.com/funtellocal/signup.php', {
    check_current_password: true,
    user_id: this.userId,
    current_password: currentPassword
  }, { withCredentials: true }).subscribe({
    next: (res) => {
      if (res.status === 'success') {
        this.currentPasswordError = '✔ Password is correct';
      } else {
        this.currentPasswordError = '❌ Incorrect current password';
      }
    },
    error: () => {
      this.currentPasswordError = '❌ Error verifying password';
    }
  });
}
 strongPasswordValidator(control: any) {
  const value = control.value || '';
  const errors: any = {};

  if (!/[A-Z]/.test(value)) errors.uppercase = true;
  if (!/[a-z]/.test(value)) errors.lowercase = true;
  if (!/[0-9]/.test(value)) errors.number = true;
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) errors.special = true;
  if (value.length < 8) errors.minlength = true;

  return Object.keys(errors).length > 0 ? errors : null;
}
}
