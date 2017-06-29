import { Component, OnInit } from '@angular/core';
import { UsersService } from '../users.service';

@Component({
    selector: 'app-users',
    templateUrl: './users.component.html',
    styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {

    listOfUsers:any = [];

    constructor(private usersService:UsersService) {
    }

    updateUserList(users){
        console.log(users);
        let userList = users.result;
        let userArray = [];
        if (userList && users.success && userList.length > 0) {
            userList.forEach(user => {
                if (user.email) {
                    userArray.push(user);
                }
            })
        }
        this.listOfUsers = userArray;
    }

    ngOnInit() {
        this.usersService.getAllUsers().subscribe(users => {
            this.updateUserList(users);
        });
    }

    public grantAccess = (user, giveAccess) => {
        console.log(user);
        console.log(giveAccess);
        if (giveAccess === 'true') {
            console.log('YESS');
            user.newUser = false;
            Object.keys(user.keys).forEach(key => user.keys[key] = true);
        } else {
            console.log('YESS');
            user.newUser = true;
            Object.keys(user.keys).forEach(key => user.keys[key] = false);
        }
        this.usersService.updateUser(user).subscribe(users => {
            this.updateUserList(users);
        });

    }

}
