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

## `/market`

### [Public] GET `/tickers`

Returns list of [Tickers](#ticker) mapped by ticker pair name.

# Data models

### User

| field          | type   | description                                                            |
| -------------- | ------ | ---------------------------------------------------------------------- |
| \_id           | string | Database ID                                                            |
| email          | string | User's email                                                           |
| name           | string | User's name                                                            |
| balance        | object | User's balance map in form of `currency: number`                       |
| overallBalance | number | User's overall balance in usd                                          |
| token          | number | _Optional._ Access token used to authenticate requests to Mamkin Trade |

### Ticker

| field            | type    | description                                                     |
| ---------------- | ------- | --------------------------------------------------------------- |
| pair             | string  | Name of the pair                                                |
| pricePrecision   | number  | Maximum number of significant digits for price in this pair     |
| initialMargin    | string  | Initial margin required to open a position in this pair         |
| minimumMargin    | string  | Minimal margin to maintain (in %)                               |
| maximumOrderSize | string  | Maximum order size of the pair                                  |
| minimumOrderSize | string  | Minimum order size of the pair                                  |
| expiration       | number  | Expiration date for limited contracts/pairs                     |
| margin           | boolean | margin trading enabled for this pair                            |
| bid              | number  | Price of last highest bid                                       |
| bidSize          | number  | Size of the last highest bid                                    |
| ask              | number  | Price of last lowest ask                                        |
| askSize          | number  | Size of the last lowest ask                                     |
| dailyChange      | number  | Amount that the last price has changed since yesterday          |
| dailyChangePerc  | number  | Amount that the price has changed expressed in percentage terms |
| lastPrice        | number  | Price of the last trade                                         |
| volume           | number  | Daily volume                                                    |
| high             | number  | Daily high                                                      |
| low              | number  | Daily low                                                       |
