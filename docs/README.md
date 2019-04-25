# General notes

- API runs on port `1338`
- [Insomnia](https://insomnia.rest/) schema is in this folder as well

# API documentation

## `/login`

### [Public] POST `/facebook`

Signs up with facebook, returns [User](#user).

#### Parameters

| field       | type   | description                        |
| ----------- | ------ | ---------------------------------- |
| accessToken | string | Access token obatins from Facebook |

## `/users`

### [Public] GET `/leaderboard`

Returns list of [Users](#user) with the highest balances, exluding users without trade history.

### GET `/:id`

Returns [User](#user)

# Data models

### User

| field   | type   | description                                                |
| ------- | ------ | ---------------------------------------------------------- |
| email   | string | User's email                                               |
| balance | number | User's balance                                             |
| token   | number | Access token used to authenticate requests to Mamkin Trade |
