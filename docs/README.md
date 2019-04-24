# General notes

- API runs on port `1338`
- [Insomnia](https://insomnia.rest/) schema is in this folder as well

# API documentation

### [Public] POST `/login/facebook`

Signs up with facebook

#### Request

```json
{
  "token": "123"
}
```

#### Response

```json
{
  "accessToken": "123"
}
```

### [Public] GET `/users/leaderboard`

Returns best players

#### Response

```json
[
  {
    "name": "Name",
    "balance": 123,
  },
  <...>
]
```
