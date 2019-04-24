// Dependencies
import * as login from './controllers/login'
import * as users from './controllers/users'

export const AppRoutes = [
  {
    path: '/login/facebook',
    method: 'post',
    action: login.facebook,
  },
  {
    path: '/users/leaderboard',
    method: 'get',
    action: users.leaderboard,
  },
]
