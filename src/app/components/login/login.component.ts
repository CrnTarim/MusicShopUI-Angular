import { Router } from '@angular/router';
import { UserService } from './../../services/user.service';
import { Component } from '@angular/core';
import { User } from '../../models/user';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  loginData = { email: '', password: '' ,username:''}; // Kullanıcı giriş bilgileri
  errorMessage: string = ''; // Hata mesajı

  constructor(private userService: UserService,private router: Router) {}

  // Giriş işlemi için metot
  onSubmit() {
    const loginPayload = {
      username:this.loginData.username,
      email: this.loginData.email,
      password: this.loginData.password,
    };

    
    this.userService.userLogin(loginPayload).subscribe({
      next: (userId) => {
        // Giriş başarılı olduysa kullanıcı ID'sini logla
       console.log("userId:",userId);
        localStorage.setItem('userId', userId); // Burada gerçek kullanıcı ID'sini kullanmalısınız
        this.router.navigate(['/singer-list']);
        
      },
      error: (err) => {
        // Hata durumunda mesaj göster
        this.errorMessage = err.error || 'Login failed. Please try again.';
      }
    });
  }

}
