import { Injectable } from '@angular/core';
import { from } from 'rxjs';
import { WebRequestService } from './web-request.service';
import { Task} from 'src/app/models/task.model'
@Injectable({
  providedIn: 'root'
})
export class TaskService {

  constructor( private webReqService: WebRequestService) { }

  createList(title: string){
    //we want to send web request to create a list
  return this.webReqService.post('lists',{title});
  }


  getLists(){
    return this.webReqService.get('lists');
  }
   



deleteTask(listId: string, taskId: string) {
  return this.webReqService.delete(`lists/${listId}/tasks/${taskId}`);
}

updateList(id:string,title: string){
  //update list 
  return this.webReqService.patch(`lists/${id}`,{title})
}

updateTask(listId:string,taskId:string,title: string){
  //update task 
  return this.webReqService.patch(`lists/${listId}/tasks/${taskId}`,{title})
}


deleteList(id: string) {
  return this.webReqService.delete(`lists/${id}`);
}
getTasks(listId: string){
  return this.webReqService.get(`lists/${listId}/tasks`);
}


createTask(title: string ,listId:string){
  //we want to send web request to create a list
return this.webReqService.post(`lists/${listId}/tasks`,{title});
}
completed(task:Task){
  return this.webReqService.patch(`lists/${task._listId}/tasks/${task._id}`,{
    completed:!task.completed
  })
}

}
   