// Dependencies
import { smoke } from './controllers/smoke'

export const AppRoutes = [
  {
    path: '/',
    method: 'post',
    action: smoke,
  },
]
