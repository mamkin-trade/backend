// Get environment variables
import * as dotenv from 'dotenv'
dotenv.config({ path: `${__dirname}/../.env` })
// Dependencies
import 'reflect-metadata'
import * as Koa from 'koa'
import bodyParser from 'koa-bodyparser-ts'
import { loadControllers } from 'koa-router-ts'
import * as cors from '@koa/cors'
import { startCheckingOrders } from './helpers/orderExecutor'
import './telegram'

const app = new Koa()
const router = loadControllers(`${__dirname}/controllers`, { recurse: true })

// Run app
app.use(cors({ origin: '*' }))
app.use(bodyParser())
app.use(router.routes())
app.use(router.allowedMethods())
app.listen(1338)

// Extra setup
startCheckingOrders()

console.log('Koa application is up and running on port 1338')
