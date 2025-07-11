import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpInterceptorFn } from '@angular/common/http';


export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
    const modifiedReq = req.clone({
      withCredentials: true, // Include cookies for cross-origin requests
    });
    return next(modifiedReq);
  };
