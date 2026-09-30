const{Sequelize}=require('sequelize')


// Sincronizar Base de Datos y arrancar el servidor
const sequelize=new Sequelize({dialect:'sqlite',storage:process.env.NODE_ENV==='test'?':memory:':'./powergym.sqlite',logging:false})

module.exports=sequelize