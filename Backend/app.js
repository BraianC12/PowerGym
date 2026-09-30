const express = require('express')
const cors=require('cors')

const socioRoutes=require('./routes/socioRoutes')
const  administradorRoutes=require('./routes/administradorRoutes')
const vencimientoRoutes=require('./routes/vencimientosRoutes')

const app=express()
app.use(express.json())
app.use(cors())

app.use('/api/socios',socioRoutes)
app.use('/api/staff',administradorRoutes)
app.use('/api/suscripciones',vencimientoRoutes)

module.exports=app