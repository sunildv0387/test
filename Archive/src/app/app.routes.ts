import { Routes, provideRoutes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { GenresComponent } from './genres/genres.component';

import { SeriesComponent } from './series/series.component';
import { CreateComponent } from './create/create.component';
import { WritestoryComponent } from './writestory/writestory.component';
import { TestComponent } from './test/test.component';
import { StorytitleComponent } from './storytitle/storytitle.component';
import { NewComponent } from './new/new.component';
import { MyworksComponent } from './myworks/myworks.component';
import { EpisodeComponent } from './episode/episode.component';
import { StoryComponent } from './story/story.component';
import { SignupComponent } from './signup/signup.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { SearchResultComponent } from './search-result/search-result.component';
import { LibraryComponent } from './library/library.component';


export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', loadComponent: () => import('./home/home.component').then(m => m.HomeComponent) },
    { path: 'login', component: LoginComponent },
    { path: 'genres', component: GenresComponent },

    { path: 'series/:idAndTitle', component: SeriesComponent },
    { path: 'creat/:storyId', component:CreateComponent},
    {path: 'story-write/:idAndTitle',
  loadComponent: () => import('./writestory/writestory.component').then(m => m.WritestoryComponent)},
  { path:'register', component:SignupComponent},
  
    {path:'test', component:TestComponent},
    {path:'create-story', component:StorytitleComponent},
    {path:'new', component:NewComponent},
    {path:'myworks', component:MyworksComponent},
    {path:'episode/:idAndTitle', loadComponent: () => import('./episode/episode.component').then(m =>m.EpisodeComponent)},
    {path:'story/:idAndTitle', component:StoryComponent},
    { path:'user-profile', component:UserProfileComponent},
    { path: 'category/:id/:name', component: SearchResultComponent },
    { path: 'search', component: SearchResultComponent },
    { path:'library', component:LibraryComponent}

];

export const appRoutingProviders = [
    provideRoutes(routes) // ✅ Use provideRoutes instead of provideRouter
];
