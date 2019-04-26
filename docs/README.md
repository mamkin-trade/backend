# General notes

- API runs on port `1338`
- [Insomnia](https://insomnia.rest/) schema is in this folder as well

# API documentation

## `/login`

### [Public] POST `/facebook`

Signs up with facebook, returns [User](#user).

#### Parameters

| field       | type   | Required | description                         |
| ----------- | ------ | -------- | ----------------------------------- |
| accessToken | string | Yes      | Access token obatined from Facebook |

## `/users`

### [Public] GET `/leaderboard`

Returns list of [Users](#user) with the highest balances, exluding users without trade history.

### GET `/:id`

Returns [User](#user)

#### Parameters

| field | type   | Required | description    |
| ----- | ------ | -------- | -------------- |
| id    | string | Yes      | ID of the user |

# Data models

### User

| field   | type   | description                                                            |
| ------- | ------ | ---------------------------------------------------------------------- |
| \_id    | string | Database ID                                                            |
| email   | string | User's email                                                           |
| name    | string | User's name                                                            |
| balance | number | User's balance                                                         |
| token   | number | _Optional._ Access token used to authenticate requests to Mamkin Trade |
