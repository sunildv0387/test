import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import Swiper from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';


@Component({
  selector: 'app-test',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './test.component.html',
  styleUrl: './test.component.css'
})
export class TestComponent {
  courseImage = [
    { image: 'images/01.jpg', name:'Koi Fish ' },
    { image: 'images/02.jpg', name:'Forestcore' },
    { image: 'images/03.jpg', name:'Northern Lights' },
    { image: 'images/04.jpg', name:'Vibrant Beach' },
    { image: 'images/01.jpg', name:'Koi Fish ' },
    { image: 'images/02.jpg', name:'Forestcore' },
    { image: 'images/03.jpg', name:'Northern Lights' },
    { image: 'images/04.jpg', name:'Vibrant Beach' }
  ];
  ngOnInit(): void {
    setTimeout(() => {
      const swiper = new Swiper('.swiper', { 
        loop: true, 
        autoplay: { delay: 1000 },
        navigation: { 
          nextEl: '.service-progress-button-next', 
          prevEl: '.service-progress-button-prev' 
        },
        slidesPerView: 1
      });
    
      console.log(swiper);
    }, 500);
  }
}
