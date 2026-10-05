const cron = require('node-cron');
const {calcularFechaObjetivo,procesarAvisos} = require('../services/avisosService')

let tarea

function iniciarAvisosAutomaticos() {
  if (
    process.env.NODE_ENV ==='test'||process.env.AVISOS_ACTIVOS!== 'true') {
    console.log('Avisos automáticos desactivados.');
    return
  }

  if (tarea) return tarea
  const horario= process.env.AVISOS_CRON||'0 9 * * *'
  const zona= process.env.AVISOS_TIMEZONE||'America/Buenos_Aires'

  if (!cron.validate(horario)) {throw new Error('AVISOS_CRON contiene un horario inválido.')}

 
  calcularFechaObjetivo()

  const variablesSMTP= ['SMTP_HOST','SMTP_USER','SMTP_PASS','SMTP_FROM']

  for (const variable of variablesSMTP) {
    if (!process.env[variable]) {throw new Error(`Falta configurar ${variable}.`)}
  }

  tarea = cron.schedule(
    horario,
    async()=>{
      try {
        const resumen = await procesarAvisos()
        console.log('Resultado de avisos automáticos:', resumen)
      }catch(error){
        console.error('Error al procesar los avisos automáticos:',error.message)
      }
    },
    {timezone: zona,noOverlap: true}
  )
  console.log(`Avisos programados: ${horario}, zona ${zona}.`)
  return tarea
}

module.exports = {iniciarAvisosAutomaticos}