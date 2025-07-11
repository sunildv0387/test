import { Component } from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, HeaderComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  
  onSubmit() {
  this.authService.login(this.username, this.password).subscribe({
    next: (data) => {
      console.log('Login response:', data);
      if (data.status === 'success' && data.id) {
        sessionStorage.setItem('userId', String(data.id)); // ✅ required for header check
        this.router.navigate(['/home']); // or wherever your home route is
      } else {
        this.errorMessage = data.message;
      }
    },
    error: (err) => {
      console.error('Login Error:', err);
      this.errorMessage = 'An error occurred during login.';
    }
  });
}


}
