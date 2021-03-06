# [Mamkin Trade](https://mamkin.trade) backend code

## Installation and local launch

1. Clone this repo: `git clone https://github.com/mamkin-trade/backend`
2. Launch the [mongo database](https://www.mongodb.com/) locally
3. Create `.env` with the environment variables listed below
4. Run `yarn install` in the root folder
5. Run `yarn develop`

And you should be good to go! Feel free to fork and submit pull requests. Documentation is [also available](https://github.com/mamkin-trade/backend/tree/master/docs) in this repo.

## Environment variables

| Name                                     | Description                                 |
| ---------------------------------------- | ------------------------------------------- |
| `MONGO`                                  | URL of the mongo database                   |
| `JWT`                                    | secret for JWT                              |
| `TELEGRAM_TOKEN`                         | token for the telegram reporter bot         |
| `TELEGRAM_ADMIN`                         | admin id on the telegram for seding reports |
| `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` | Facebook login credentials                  |
| `TELEGRAM_LOGIN_TOKEN`                   | Telegram login bot                          |
| `VK_APP_ID`                              | VK login app id                             |
| `VK_SECRET`                              | VK login app secret                         |

Also, please, consider looking at `.env.sample`.

## Continuous integration

Any commit pushed to master gets deployed to [server.mamkin.trade](https://server.mamkin.trade) via [CI Ninja](https://github.com/backmeupplz/ci-ninja).

## License

MIT — use for any purpose. Would be great if you could leave a note about the original developers. Thanks!
