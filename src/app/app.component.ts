import { Component, HostListener, OnInit } from '@angular/core';

// Extend Console type to include firebug (if needed)
declare global {
  interface Console {
    firebug?: boolean;
    [key: string]: any; // Allow any string index
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'code';

  ngOnInit() {
    // Anti-console trick
    setInterval(() => {
      // Type-safe console check
      if (typeof window.console !== 'undefined' && (window.console as any).firebug) {
        document.body.innerHTML = '<h1>Console Debugging is not allowed!</h1>';
      }
      
      // Type-safe console method override
      const methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 
        'error', 'exception', 'group', 'groupCollapsed', 
        'groupEnd', 'info', 'log', 'markTimeline', 'profile', 
        'profileEnd', 'table', 'time', 'timeEnd', 'timeStamp', 
        'trace', 'warn'
      ];
      
      methods.forEach(method => {
        (window.console as any)[method] = function() {};
      });
    }, 1000);
  }

  // Disable right-click
  @HostListener('contextmenu', ['$event'])
  onRightClick(event: MouseEvent): void {
    event.preventDefault();
  }

  // Disable text selection
  @HostListener('selectstart', ['$event'])
  onSelectStart(event: Event): void {
    event.preventDefault();
  }

  // Disable keyboard shortcuts
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (
      event.key === 'F12' ||
      (event.ctrlKey && event.shiftKey && (event.key === 'I' || event.key === 'i')) ||
      (event.ctrlKey && event.shiftKey && (event.key === 'J' || event.key === 'j')) ||
      (event.ctrlKey && (event.key === 'U' || event.key === 'u')) ||
      (event.ctrlKey && (event.key === 'C' || event.key === 'c')) ||
      (event.key === 'F5' || event.key === 'F8' || event.key === 'F7')
    ) {
      event.preventDefault();
      // Optional: Show a message
      alert('This action is not allowed');
    }
  }
}