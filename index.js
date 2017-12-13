const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

const app = express()

app
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  
app.post('/', (req, res) => {
  console.log(req.body)

  res.send({
    replies: [{
      type: 'text',
      content: 'Roger that',
    }], 
    conversation: {
      memory: { key: 'value' }
    }
  })
})
  
app.post('/errors', (req, res) => {
  console.log(req.body) 
  res.send() 
}) 

app.listen(PORT, () => console.log(`Listening on ${ PORT }`))  