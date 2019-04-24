// Get environment variables
import * as dotenv from 'dotenv'
dotenv.config({ path: `${__dirname}/../.env` })
// Dependencies
import 'reflect-metadata'
import * as Koa from 'koa'
import * as Router from 'koa-router'
import * as bodyParser from 'koa-bodyparser'
import { AppRoutes } from './routes'

const app = new Koa()
const router = new Router()

// Register all application routes
AppRoutes.forEach(route => router[route.method](route.path, route.action))

// Run app
app.use(bodyParser())
app.use(router.routes())
app.use(router.allowedMethods())
app.listen(1338)

console.log('Koa application is up and running on port 1338')
