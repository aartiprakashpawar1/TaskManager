import { Component, OnInit } from '@angular/core';
import { TaskService } from 'src/app/task.service';
import { ActivatedRoute,Params, Router} from '@angular/router';
import { Task} from 'src/app/models/task.model'
import { List} from 'src/app/models/list.model'
@Component({
  selector: 'app-new-task',
  templateUrl: './new-task.component.html',
  styleUrls: ['./new-task.component.scss']
})
export class NewTaskComponent implements OnInit {
  lists :List[];
  tasks: Task[];

  constructor(  private taskService :TaskService, private route:ActivatedRoute , private router :Router) { }

  listId:string;
  ngOnInit(): void {
    this.route.params.subscribe(
      (params :Params) =>{
      this.listId = params['listId']
      console.log(this.listId)
        }
        
      )
  }
  

  createTask(title : string ){
    this.taskService.createTask(title,this.listId).subscribe((newTask:Task) =>
    {
      console.log(newTask); 
      this.router.navigate(['../'],{relativeTo:this.route})
    });
      }

    }