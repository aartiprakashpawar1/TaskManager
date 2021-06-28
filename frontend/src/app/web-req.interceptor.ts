import { HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Injectable, ɵclearResolutionOfComponentResourcesQueue } from '@angular/core';
import { empty, Observable, Subject, throwError } from 'rxjs';
import { catchError ,switchMap,tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class WebReqInterceptor implements HttpInterceptor {

  constructor( private authService: AuthService) { }

  refreshingAccessToken : boolean;
  accessTokenRefreshed: Subject<any> = new Subject()


intercept(request:HttpRequest<any>, next :HttpHandler): Observable<any>{
//handle request
request = this.addAuthHeader(request);
 //call next 
 return next.handle(request).pipe(
   catchError((error :HttpErrorResponse) =>{
    console.log(error)
     if(error.status === 401){
       //unauthorized
       //refresh access token
   return this.refreshAccessToken().pipe(switchMap(() =>
       {
         request  = this.addAuthHeader(request)
         return next.handle(request)
       }), catchError((err:any) =>{
         console.log(err)
         this.authService.logout();
         return empty();
       })
       )


     }
    
return throwError(error)
   })
  
 )
}


refreshAccessToken(){
  if(this.refreshingAccessToken) {
     return new Observable(observer =>{
       this.accessTokenRefreshed.subscribe(() =>{
         //this code will run when access token refreshed
        observer.next();
        observer.complete();
       })
     })
  } else{
    this.refreshingAccessToken = true
    //we want to call a method in auth service to send a request to refresh the access token
     return this.authService.getNewAccessToken().pipe(
       tap(() => {
    
         console.log("Access token Refreshed ! ")
         this.refreshingAccessToken = false
         this.accessTokenRefreshed.next()

       })
     )
  }
 
}



addAuthHeader(request:HttpRequest<any>){
  //get access token
  const token = this.authService.getAccessToken()
  if(token){
    //append the access token to request header

    return request.clone({
      setHeaders:{
        'x-access-token':token
      }
    })
  }
  return request

}

}
