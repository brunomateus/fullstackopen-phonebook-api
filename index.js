require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const app = express()

const Person = require('./models/person')

app.use(cors())
app.use(express.static('dist'))

morgan.token('body', (req) => {
  if (req.method === 'POST') {
    return JSON.stringify(req.body)
  }
  return ''
})

app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))

app.use(express.json())

app.get('/api/persons', (request, response) => {
   Person.find({}).then(persons => {
     response.json(persons)
    }).catch(err => {
      console.error('Error fetching persons:', err)
      mongoose.connection.close()
    })
})


app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id).then(person => {
    if(person) {
      response.json(person)
    } else {
      return response.status(404).json({
        error: 'person not found',
      })
    }
  })
  .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
  .then(result => {
    response.status(204).end()
  })
  .catch(error => next(error))
})

app.post('/api/persons', (request, response) => {
  const { name, number } = request.body

  if (!name) {
    return response.status(400).json({
      error: 'name missing',
    })
  }

  if (!number) {
    return response.status(400).json({
      error: 'number missing',
    })
  }

  const person = new Person({
    name,
    number,
  })

  Person.findOne({ name: person.name }).then(existingPersons => {
    console.log('existingPersons', existingPersons)
    if (existingPersons) {
      const putForm = `
        <form id="putForm" method="PUT" action="$/api/persons/${existingPersons._id}">
          <input type="hidden" name="data" value="${JSON.stringify(request.body)}">
        </form>
        <script>
          document.getElementById('putForm').submit();
        </script>
      `;

      response.send(putForm);
    } else {
      person.save().then(result => {
        console.log(`added ${person.name} number ${person.number} to phonebook`)
        response.json(person)
      })
    }
  })

})


app.put('/api/persons/:id', (request, response, next) => {
  const { name, number } = request.body

  if (!name) {
    return response.status(400).json({
      error: 'name missing',
    })
  }

  if (!number) {
    return response.status(400).json({
      error: 'number missing',
    })
  }

  const person = {
    name,
    number,
  }

  Person.findOneAndUpdate({ _id: request.params.id }, person, { new: true })
  .then(updatedPerson => {
    if (updatedPerson) {
      response.json(updatedPerson)
    } else {
      return response.status(404).json({
        error: 'person not found',
      })
    }
  }).catch(error => next(error))
})

app.get('/api/info', (request, response) => {
  const date = new Date()
  const info = `
    <p>Phonebook has info for ${persons.length} people</p>
    <time datetime=${date.toISOString()}>${date.toLocaleDateString()}</p>
  `
  response.send(info)
})

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } 

  next(error)
}

app.use(errorHandler)


const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
