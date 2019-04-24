// Dependencies
import * as login from './controllers/login'

export const AppRoutes = [
  {
    path: '/login/facebook',
    method: 'post',
    action: login.facebook,
  },
  {
    path: '/login/vk',
    method: 'post',
    action: login.vk,
  },
  {
    path: '/login/twitter',
    method: 'post',
    action: login.twitter,
  },
]
