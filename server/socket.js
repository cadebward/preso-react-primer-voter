const { forEach, reduce, includes, keys } = require('lodash')

const VOTE_DEBOUNCE_LENGTH_IN_MS = 1000

let votes = {}
const clients = {
  voters: {},
  reporters: {}
}

exports.onConnection = socket => {
  const clientId = socket.id
  console.log(`${clientId} connected`)

  socket.on('register', type => {
    switch (type) {
      case 'voter':
        clients.voters[clientId] = socket
        updateReporter()
        break
      case 'reporter':
        clients.reporters[clientId] = socket
        updateReporter()
        break
      default:
        console.log('Cannot register type: ', type)
    }
  })

  socket.on('vote', function(vote) {
    if (!includes(['more', 'boring'], vote)) {
      console.log(`received invalid vote from ${clientId}: ${vote}`)
      return
    }
    const lastVoted = clients.voters[clientId].lastVoted || 0
    const TSLV = Date.now() - lastVoted
    if (TSLV < VOTE_DEBOUNCE_LENGTH_IN_MS) {
      console.log(`${clientId} attempted to vote too soon`, { TSLV })
      return
    }
    clients.voters[clientId].lastVoted = Date.now()
    votes[clientId] = vote
    updateReporter()
  })

  socket.on('stepenter', () => {
    votes = {}
    updateReporter()
  })

  socket.on('reset', function() {
    votes = {}
    updateReporter()
  })

  socket.on('disconnect', () => {
    delete clients.voters[clientId]
    updateReporter()
  })

  socket.emit('ack', { message: 'You are connected.' })
}

const updateReporter = () => {
  const summary = reduce(
    votes,
    (memo, choice, client) => {
      memo[choice]++
      return memo
    },
    { more: 0, boring: 0 }
  )
  const formatted = [
    { choice: 'boring', count: summary.boring },
    { choice: 'more', count: summary.more }
  ]
  forEach(clients.reporters, socket => {
    socket.emit('boringfactor', summary.boring / keys(clients.voters).length)
    socket.emit('voters', keys(clients.voters).length)
  })
}
