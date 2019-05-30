# General notes

- API runs at https://backend.mamkin.trade
- [Insomnia](https://insomnia.rest/) schema is in this folder as well
- After obtaining `token` at `/login` you should sign all private requests with it putting it into `token` header
- Or you can sign all private requests with an api token obtained by `/users/keys` putting it into `key` header

# API documentation

## `/`

### [Public] POST `/stats`

Returns Mamkin Trade statistics.

## `/login`

### [Public] POST `/facebook`

Signs up with facebook, returns [User](#user).

#### Parameters

| field       | type   | Required | description                         |
| ----------- | ------ | -------- | ----------------------------------- |
| accessToken | string | Yes      | Access token obatined from Facebook |

### [Public] POST `/google`

Signs up with google, returns [User](#user).

#### Parameters

| field       | type   | Required | description                       |
| ----------- | ------ | -------- | --------------------------------- |
| accessToken | string | Yes      | Access token obatined from Google |

### [Public] POST `/telegram`

Signs up with telegram, returns [User](#user).

#### Parameters

| field    | type   | Required | description                      |
| -------- | ------ | -------- | -------------------------------- |
| userData | object | Yes      | User data obatined from Telegram |

### [Public] POST `/vk`

Signs up with vk, returns [User](#user).

#### Parameters

| field    | type   | Required | description                                                                  |
| -------- | ------ | -------- | ---------------------------------------------------------------------------- |
| userData | object | Yes      | User data obatined from VK including first name, last name, user id and hash |

### [Public] POST `/key`

Signs is with api key, returns [User](#user).

#### Parameters

| field | type   | Required | description                              |
| ----- | ------ | -------- | ---------------------------------------- |
| key   | string | Yes      | API key obtained from previous api calls |

## `/users`

### [Public] GET `/leaderboard`

Returns list of 10 [Users](#user) with either the highest balance or what is specified, exluding users without trade history.

#### Parameters

| field      | type    | Required | description                       |
| ---------- | ------- | -------- | --------------------------------- |
| sortBy     | string  | Optional | Can be 'balance' or 'subscribers' |
| descending | boolean | Optional | How to sort response              |

### [Public] GET `/leaderboard/position/:id`

Returns user's relative and absolute position in leaderboard

#### Parameters

| field | type   | Required | description    |
| ----- | ------ | -------- | -------------- |
| id    | string | Yes      | ID of the user |

### [Public] GET `/:id`

Returns [User](#user)

#### Parameters

| field | type   | Required | description    |
| ----- | ------ | -------- | -------------- |
| id    | string | Yes      | ID of the user |

### POST `/reset`

Resets user's balance to \$10 000 and removes all orders.

### GET `/keys`

Returns list of user's api keys

### POST `/key`

Creates and returns a new api key for the user

### DELETE `/key/:id`

Deletes api key from the user

#### Parameters

| field | type   | Required | description       |
| ----- | ------ | -------- | ----------------- |
| id    | string | Yes      | Api key to delete |

## `/market`

### [Public] GET `/tickers`

Returns list of [Tickers](#ticker) mapped by ticker pair name.

### [Public] GET `/nasdaq`

Returns list of [NasdaqTickers](#nasdaqticker) mapped by ticker pair name.

## `/orders`

### [Public] GET `/user/:id`

Returns list of [Orders](#order) for the user as well as total `count` of users.

#### Parameters

| field     | type    | Required | description                      |
| --------- | ------- | -------- | -------------------------------- |
| id        | string  | Yes      | ID of the user                   |
| skip      | number  | Optional | Pagination skip, defaults to 0   |
| limit     | number  | Optional | Pagination limit, defaults to 20 |
| completed | boolean | Optional | Return only complete orders      |
| cancelled | boolean | Optional | Return only cancelled orders     |
| active    | boolean | Optional | Return only active orders        |

### [Public] GET `/user/:id/count`

Returns total count of [Orders](#order) for the user.

#### Parameters

| field     | type    | Required | description                               |
| --------- | ------- | -------- | ----------------------------------------- |
| id        | string  | Yes      | ID of the user                            |
| completed | boolean | Optional | Return only complete or incomplete orders |
| cancelled | boolean | Optional | Return only active or cancelled orders    |

### POST `/order`

Creates [Order](#order).

#### Parameters

| field  | type             | Required | description                                                  |
| ------ | ---------------- | -------- | ------------------------------------------------------------ |
| symbol | string           | Yes      | Symbol such as "BTCUSD"                                      |
| amount | number \| string | Yes      | Amount of the order                                          |
| side   | string           | Yes      | Side of the order, can be either "buy" or "sell"             |
| type   | string           | Yes      | Type of the order, can be either "market", "stop" or "limit" |
| price  | number \| string | Optional | Price of the order, not available for "market" type          |

### DELETE `/order/:id`

Cancels [Order](#order).

#### Parameters

| field | type   | Required | description               |
| ----- | ------ | -------- | ------------------------- |
| id    | string | Yes      | ID of the order to cancel |

# Data models

### User

| field          | type   | description                                                            |
| -------------- | ------ | ---------------------------------------------------------------------- |
| \_id           | string | Database ID                                                            |
| name           | string | User's name                                                            |
| balance        | object | User's balance map in form of `currency: number`                       |
| overallBalance | number | User's overall balance in usd                                          |
| ordersBalance  | number | User's balance in orders in usd                                        |
| subCount       | number | Number of user's subscribers                                           |
| email          | string | _Optional._ User's email                                               |
| facebookId     | string | _Optional._ User's facebook ID                                         |
| vkId           | string | _Optional._ User's VK ID                                               |
| telegramId     | string | _Optional._ User's Telegram ID                                         |
| token          | number | _Optional._ Access token used to authenticate requests to Mamkin Trade |

### Ticker

| field            | type    | description                                                                 |
| ---------------- | ------- | --------------------------------------------------------------------------- |
| pair             | string  | Name of the pair                                                            |
| pricePrecision   | number  | Maximum number of significant digits for price in this pair                 |
| initialMargin    | string  | Initial margin required to open a position in this pair                     |
| minimumMargin    | string  | Minimal margin to maintain (in %)                                           |
| maximumOrderSize | string  | Maximum order size of the pair                                              |
| minimumOrderSize | string  | Minimum order size of the pair                                              |
| expiration       | number  | Expiration date for limited contracts/pairs                                 |
| margin           | boolean | margin trading enabled for this pair                                        |
| bid              | number  | _Optional._ Price of last highest bid                                       |
| bidSize          | number  | _Optional._ Size of the last highest bid                                    |
| ask              | number  | _Optional._ Price of last lowest ask                                        |
| askSize          | number  | _Optional._ Size of the last lowest ask                                     |
| dailyChange      | number  | _Optional._ Amount that the last price has changed since yesterday          |
| dailyChangePerc  | number  | _Optional._ Amount that the price has changed expressed in percentage terms |
| lastPrice        | number  | _Optional._ Price of the last trade                                         |
| volume           | number  | _Optional._ Daily volume                                                    |
| high             | number  | _Optional._ Daily high                                                      |
| low              | number  | _Optional._ Daily low                                                       |

### NasdaqTicker

| field             | type                        | description          |
| ----------------- | --------------------------- | -------------------- |
| symbol            | string                      | Name of the stock    |
| currentPrice      | [ShortFormat](#shortformat) | Current price        |
| totalCash         | [Format](#format)           | Total cash           |
| totalCashPerShare | [ShortFormat](#shortformat) | Total cash per share |
| totalRevenue      | [Format](#format)           | Total revenue        |
| grossProfits      | [Format](#format)           | Gross profits        |
| earningGrowth     | [ShortFormat](#shortformat) | Earning growth       |
| revenueGrowth     | [ShortFormat](#shortformat) | Revenue growth       |

### ShortFormat

| field | type   | description             |
| ----- | ------ | ----------------------- |
| raw   | number | Raw represenation       |
| fmt   | string | Formatted represenation |

### Format

| field   | type   | description                  |
| ------- | ------ | ---------------------------- |
| raw     | number | Raw represenation            |
| fmt     | string | Formatted represenation      |
| longFmt | string | Long formatted represenation |

### Order

| field          | type             | description                                                  |
| -------------- | ---------------- | ------------------------------------------------------------ |
| \_id           | string           | Database ID                                                  |
| symbol         | string           | Name of the symbol                                           |
| amount         | number \| string | Amount of currency in the order                              |
| price          | number \| string | Price of the order                                           |
| side           | string           | Side of the order, can be either "buy" or "sell"             |
| type           | string           | Type of the order, can be either "market", "stop" or "limit" |
| completed      | boolean          | Whether order is fullfilled                                  |
| cancelled      | boolean          | Whether order is cancelled                                   |
| createdAt      | Date             | When order was created                                       |
| fee            | number           | Amount paid as a fee                                         |
| crypto         | boolean          | Whether it's crypto (true) or stocks (false)                 |
| completionDate | Date             | _Optional._ When the order was completed                     |
