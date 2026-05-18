import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
// import { PROPERTIES, AGENTS } from '../data';
import { RouterOutlet } from '@angular/router';
import { Chat } from './components/chat/chat';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    FooterComponent,
    RouterOutlet,
    Chat
],
  templateUrl: `./app.component.html`
})
export class AppComponent  {
  
  
}
