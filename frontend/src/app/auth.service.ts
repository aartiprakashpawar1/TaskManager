import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { WebRequestService } from './web-request.service';
import {shareReplay ,tap} from 'rxjs/operators'
import { identifierModuleUrl } from '@angular/compiler';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor( private webService : WebRequestService, private router: Router, private http:HttpClient) { }

  
private setSession(userId:string,accessToken: string,refreshToken : string){
  localStorage.setItem('user-id',userId)
  localStorage.setItem('x-access-token',accessToken)
  localStorage.setItem('x-refresh-token',refreshToken)
 }
 

login(email:string, password: string){
 return this.webService.logn(email,password).pipe(
  shareReplay(),
 tap((res:HttpResponse<any>) =>
 {
   // the auth token will be reponse of this response
this.setSession(res.body._id,res.headers.get('x-access-token'),res.headers.get('x-refresh-token'));
console.log("logged-in")
//console.log(res)
 })
)
}



signup(email:string, password: string){
  return this.webService.signup(email,password).pipe(
   shareReplay(),
  tap((res:HttpResponse<any>) =>
  {
    // the auth token will be reponse of this response
 this.setSession(res.body._id,res.headers.get('x-access-token'),res.headers.get('x-refresh-token'));
 console.log(" successfully signed-up and now logged in")
 //console.log(res)
  })
 )
 }

private removeSession(){
  localStorage.removeItem('user-id')
  localStorage.removeItem('x-access-token')
  localStorage.removeItem('x-refresh-token')
 }

 logout(){
   this.removeSession()
  this.router.navigate(['/login'])

 }
 getAccessToken(){
   return localStorage.getItem('x-access-token')

 }
 setAccessToken(accessToken: string){
   localStorage.setItem('x-access-token', accessToken);
 }
getUserId(){
  return localStorage.getItem('user-id')
}

 getRefreshToken(){
  return  localStorage.getItem('x-refresh-token')
 }

 getNewAccessToken(){
  return this.http.get(`${this.webService.ROOT_URL}/users/me/access-token`,{
    headers:{
      'x-refresh-token':this.getRefreshToken(),
      '_id':this.getUserId()
  },
  observe:'response'
  }).pipe(
 tap((res: HttpResponse<any>) =>{
  this.setAccessToken(res.headers.get('x-access-token'));
 })
  )
}
}
