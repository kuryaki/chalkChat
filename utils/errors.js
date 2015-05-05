function errorManager(err, req, res, next) { // TODO make test and util/lib/middleware
  if (err.name === 'UnauthorizedError') { 
    res
    .status(401)
    .end()
  }
}

module.exports = errorManager