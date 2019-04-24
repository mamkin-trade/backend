# General notes

- API runs on port `1338`
- [Insomnia](https://insomnia.rest/) schema is in this folder as well

# API documentation

### POST `/login/facebook`

Signs up with facebook

#### Body

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
