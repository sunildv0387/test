import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { debounceTime, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent {
  signupForm: FormGroup;
  passwordErrors: string[] = [];
  usernameStatus: 'available' | 'taken' | null = null;
  emailStatus: 'available' | 'taken' | null = null;
  submissionErrors: string[] = [];

  constructor(private fb: FormBuilder, private http: HttpClient, private router:Router) {
    this.signupForm = this.fb.group({
      first_name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
      terms: [false, [Validators.requiredTrue]],
    });

    // Username live check
    this.signupForm.get('username')?.valueChanges
      .pipe(debounceTime(500), switchMap(username => this.checkUsername(username)))
      .subscribe(res => {
        this.usernameStatus = res.exists ? 'taken' : 'available';
      });

    // Email live check
    this.signupForm.get('email')?.valueChanges
      .pipe(debounceTime(500), switchMap(email => this.checkEmail(email)))
      .subscribe(res => {
        this.emailStatus = res.exists ? 'taken' : 'available';
      });
  }

  checkPasswordStrength(password: string): string[] {
    const errors: string[] = [];
    if (!/[A-Z]/.test(password)) errors.push('at least one uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('at least one lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('at least one number');
    if (!/[^A-Za-z0-9]/.test(password)) errors.push('at least one special character');
    if (password.length < 8) errors.push('at least 8 characters long');
    return errors;
  }

  onPasswordInput() {
    const password = this.signupForm.get('password')?.value || '';
    this.passwordErrors = this.checkPasswordStrength(password);
  }

  onSubmit() {
  this.submissionErrors = [];

  if (this.signupForm.get('first_name')?.invalid) {
    this.submissionErrors.push('Full name is required');
  }

  if (this.signupForm.get('email')?.invalid) {
    this.submissionErrors.push('Valid email is required');
  }

  if (this.emailStatus === 'taken') {
    this.submissionErrors.push('Email already exists');
  }

  if (this.signupForm.get('username')?.invalid) {
    this.submissionErrors.push('Username is required');
  }

  if (this.usernameStatus === 'taken') {
    this.submissionErrors.push('Username already exists');
  }

  if (this.signupForm.get('password')?.invalid || this.passwordErrors.length) {
    this.submissionErrors.push('Password must meet all strength requirements');
  }

  if (!this.signupForm.get('terms')?.value) {
    this.submissionErrors.push('Please accept Terms and Conditions');
  }

  if (this.submissionErrors.length) {
    return; // Stop form submission
  }

  const formData = this.signupForm.value;
  this.http.post('https://hyperblah.com/funtellocal/signup.php', formData, {
    withCredentials: true,
  }).subscribe({
    next: (res: any) => {
      this.router.navigate(['login'])
    },
    error: () => {
      this.submissionErrors = ['Signup failed. Please try again.'];
    }
  });
}

  checkUsername(username: string) {
    return this.http.post<any>('https://hyperblah.com/funtellocal/signup.php', {
      check_username: true,
      username
    }, { withCredentials: true });
  }

  checkEmail(email: string) {
    return this.http.post<any>('https://hyperblah.com/funtellocal/signup.php', {
      check_email: true,
      email
    }, { withCredentials: true });
  }
}