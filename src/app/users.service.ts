import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';

@Injectable()
export class UsersService {

    constructor(private http:Http) {
    }

    // Get all posts from the API
    getAllUsers() {
        return this.http.get('/users')
            .map(res => res.json());
    }

    updateUser(userObj) {
        return this.http.post('/activate', userObj)
            .map(res => res.json());
    }

}
