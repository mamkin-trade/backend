// Dependencies
import * as signup from './controllers/signup'

export const AppRoutes = [
  {
    path: '/signup/facebook',
    method: 'post',
    action: signup.facebook,
  },
  {
    path: '/signup/vk',
    method: 'post',
    action: signup.vk,
  },
  {
    path: '/signup/twitter',
    method: 'post',
    action: signup.twitter,
  },
]
