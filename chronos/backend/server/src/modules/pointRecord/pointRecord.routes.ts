import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.js'
import * as controller from './pointRecord.controller.js'

export const pointRecordRouter = Router()

pointRecordRouter.get('/qr-checkin', controller.qrCheckinPage)
pointRecordRouter.post('/qr-checkin', controller.qrCheckin)

pointRecordRouter.use(authMiddleware)

pointRecordRouter.get('/', controller.list)
pointRecordRouter.post('/', controller.create)
pointRecordRouter.post('/qr-token', controller.generateQrToken)
