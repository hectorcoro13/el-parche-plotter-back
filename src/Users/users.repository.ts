// import { Injectable } from '@nestjs/common';
// import { createUserDto } from './dto/Create-user-dto';

// export interface User {
//   id: number;
//   email: string;
//   name: string;
//   password: string;
//   address: string;
//   phone: string;
//   country?: string;
//   city?: string;
// }

// @Injectable()
// export class UsersRepository {
//   users: User[] = [
//     {
//       id: 1,
//       email: 'john.doe@example.com',
//       name: 'John Doe',
//       password: 'password123',
//       address: '123 Main St, Springfield',
//       phone: '+1 555-1234',
//       country: 'USA',
//       city: 'Springfield',
//     },
//     {
//       id: 2,
//       email: 'jane.smith@example.com',
//       name: 'Jane Smith',
//       password: 'securepass456',
//       address: '456 Elm St, Gotham',
//       phone: '+1 555-5678',
//       country: 'USA',
//       city: 'Gotham',
//     },
//     {
//       id: 3,
//       email: 'alice.wonderland@example.com',
//       name: 'Alice Wonderland',
//       password: 'aliceinwonderland789',
//       address: '789 Oak Ave, Neverland',
//       phone: '+1 555-9012',
//       country: 'Fantasyland',
//       city: 'Neverland',
//     },
//     {
//       id: 4,
//       email: 'bob.builder@example.com',
//       name: 'Bob Builder',
//       password: 'bobthebuilder001',
//       address: '321 Brick Lane, Buildertown',
//       phone: '+44 20 7946 0958',
//       country: 'UK',
//       city: 'Buildertown',
//     },
//     {
//       id: 5,
//       email: 'charlie.brown@example.com',
//       name: 'Charlie Brown',
//       password: 'peanuts123',
//       address: '742 Evergreen Terrace, Peanutsville',
//       phone: '+1 555-3344',
//       country: 'USA',
//       city: 'Peanutsville',
//     },
//   ];
//   getUsers() {
//     return this.users;
//   }
//   getUsersByid(id: number) {
//     return this.users.find((element) => element.id === id);
//   }
//   createUser(user: createUserDto) {
//     const newUser: User = {
//       id: this.users[this.users.length - 1].id + 1,
//       ...user,
//     };
//     this.users.push(newUser);

//     return newUser;
//   }
//   delete(id: number) {
//     const deleteUser = this.users.filter((element) => element.id !== id);
//     this.users = deleteUser;
//     return this.users;
//   }

//   update(id: number, user: Partial<User>) {
//     const index = this.users.findIndex((user) => user.id === id);

//     if (index === -1) {
//       return 'No hay tal';
//     }
//     this.users[index] = user as User;
//     return user;
//   }
// }
